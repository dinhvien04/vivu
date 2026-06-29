import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken, type User as ClerkBackendUser } from '@clerk/backend';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

export interface ExtractedClerkToken {
  token: string;
  source: 'authorization' | 'cookie';
}

export interface ClerkUserProfile {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

type ClerkClaims = {
  sub?: string;
  email?: string;
  email_address?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
};

type VivuUserRow = {
  id: string;
  clerkUserId: string | null;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  createdAt: Date;
  deletedAt: Date | null;
};

const USER_AUTH_SELECT = {
  id: true,
  clerkUserId: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  bio: true,
  location: true,
  createdAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);
  private readonly secretKey?: string;
  private readonly jwtKey?: string;
  private readonly allowedOrigins: string[];
  private readonly clerkClient: ReturnType<typeof createClerkClient> | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.secretKey = nonEmpty(config.get<string>('CLERK_SECRET_KEY'));
    this.jwtKey = nonEmpty(config.get<string>('CLERK_JWT_KEY'));
    this.allowedOrigins = parseCsv(
      config.get<string>('CLERK_ALLOWED_ORIGINS') ?? config.get<string>('CORS_ORIGINS'),
    );
    this.clerkClient = this.secretKey ? createClerkClient({ secretKey: this.secretKey }) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey || this.jwtKey);
  }

  extractSessionToken(request: FastifyRequest): ExtractedClerkToken | null {
    const authorization = request.headers.authorization;
    if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
      const token = authorization.slice('bearer '.length).trim();
      return token ? { token, source: 'authorization' } : null;
    }

    const cookie = request.headers.cookie;
    if (typeof cookie !== 'string') return null;
    for (const part of cookie.split(';')) {
      const [rawName, ...rawValue] = part.trim().split('=');
      if (rawName === '__session') {
        const value = rawValue.join('=');
        return value ? { token: decodeURIComponent(value), source: 'cookie' } : null;
      }
    }
    return null;
  }

  async authenticateRequest(
    request: FastifyRequest,
    options: { upsert?: boolean } = {},
  ): Promise<AuthenticatedUser> {
    const extracted = this.extractSessionToken(request);
    if (!extracted) {
      throw new UnauthorizedException('Thiếu Clerk session token');
    }
    return this.authenticateToken(extracted.token, options);
  }

  async authenticateToken(
    token: string,
    options: { upsert?: boolean } = {},
  ): Promise<AuthenticatedUser> {
    const claims = await this.verifyClaims(token);
    const clerkUserId = claims.sub;
    if (!clerkUserId) {
      throw new UnauthorizedException('Clerk token không hợp lệ');
    }

    const existing = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: USER_AUTH_SELECT,
    });
    if (existing) return this.toAuthenticatedUser(existing);
    if (!options.upsert) {
      throw new UnauthorizedException('Tài khoản Vivu chưa được liên kết Clerk');
    }

    const profile = (await this.fetchClerkProfile(clerkUserId)) ?? this.profileFromClaims(claims);
    return this.upsertClerkUserProfile(profile);
  }

  async syncCurrentUser(request: FastifyRequest): Promise<AuthenticatedUser> {
    return this.authenticateRequest(request, { upsert: true });
  }

  async upsertClerkUserProfile(profile: ClerkUserProfile): Promise<AuthenticatedUser> {
    const clerkUserId = profile.clerkUserId.trim();
    const email = normalizeEmail(profile.email);
    if (!clerkUserId) {
      throw new BadRequestException('Thiếu Clerk user id');
    }
    if (!email) {
      throw new BadRequestException('Clerk user chưa có email chính');
    }

    const name = normalizeName(profile.name, email);
    const avatarUrl = normalizeNullable(profile.avatarUrl);

    const byClerk = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: USER_AUTH_SELECT,
    });
    if (byClerk) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      const emailAvailable = !emailOwner || emailOwner.id === byClerk.id;
      const updated = await this.prisma.user.update({
        where: { id: byClerk.id },
        data: {
          ...(emailAvailable ? { email } : {}),
          name,
          avatarUrl,
          deletedAt: null,
        },
        select: USER_AUTH_SELECT,
      });
      if (!emailAvailable) {
        this.logger.warn(`Skipped Clerk email sync because email is owned by user ${emailOwner.id}`);
      }
      return this.toAuthenticatedUser(updated);
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email },
      select: USER_AUTH_SELECT,
    });
    if (byEmail) {
      if (byEmail.clerkUserId && byEmail.clerkUserId !== clerkUserId) {
        throw new ConflictException('Email đã được liên kết với Clerk user khác');
      }
      const linked = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          clerkUserId,
          name,
          avatarUrl,
          deletedAt: null,
        },
        select: USER_AUTH_SELECT,
      });
      return this.toAuthenticatedUser(linked);
    }

    const created = await this.prisma.user.create({
      data: {
        clerkUserId,
        email,
        name,
        avatarUrl,
        passwordHash: null,
      },
      select: USER_AUTH_SELECT,
    });
    return this.toAuthenticatedUser(created);
  }

  async markClerkUserDeleted(clerkUserId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { clerkUserId },
      data: { deletedAt: new Date() },
    });
  }

  private async verifyClaims(token: string): Promise<ClerkClaims> {
    if (!this.isConfigured()) {
      throw new UnauthorizedException('Clerk chưa được cấu hình');
    }
    try {
      return (await verifyToken(token, {
        secretKey: this.secretKey,
        jwtKey: this.jwtKey,
        authorizedParties: this.allowedOrigins.length > 0 ? this.allowedOrigins : undefined,
      })) as ClerkClaims;
    } catch {
      throw new UnauthorizedException('Clerk token không hợp lệ');
    }
  }

  private async fetchClerkProfile(clerkUserId: string): Promise<ClerkUserProfile | null> {
    if (!this.clerkClient) return null;
    try {
      const user = await this.clerkClient.users.getUser(clerkUserId);
      return profileFromBackendUser(user);
    } catch {
      this.logger.warn(`Unable to fetch Clerk profile for user ${clerkUserId}`);
      return null;
    }
  }

  private profileFromClaims(claims: ClerkClaims): ClerkUserProfile {
    const first = typeof claims.given_name === 'string' ? claims.given_name : '';
    const last = typeof claims.family_name === 'string' ? claims.family_name : '';
    const joinedName = [first, last].filter(Boolean).join(' ').trim();
    return {
      clerkUserId: claims.sub ?? '',
      email:
        typeof claims.email === 'string'
          ? claims.email
          : typeof claims.email_address === 'string'
            ? claims.email_address
            : null,
      name: typeof claims.name === 'string' ? claims.name : joinedName || null,
      avatarUrl: typeof claims.picture === 'string' ? claims.picture : null,
    };
  }

  private toAuthenticatedUser(user: VivuUserRow): AuthenticatedUser {
    if (user.deletedAt) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }
    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
    };
  }
}

export function profileFromBackendUser(user: ClerkBackendUser): ClerkUserProfile {
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  return {
    clerkUserId: user.id,
    email,
    name: user.fullName ?? user.username ?? null,
    avatarUrl: user.imageUrl || null,
  };
}

export function profileFromWebhookData(data: unknown): ClerkUserProfile {
  const raw = (data ?? {}) as {
    id?: string;
    email_addresses?: Array<{ id?: string; email_address?: string }>;
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    image_url?: string | null;
  };
  const primary =
    raw.email_addresses?.find((email) => email.id === raw.primary_email_address_id) ??
    raw.email_addresses?.[0];
  const joinedName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
  return {
    clerkUserId: raw.id ?? '',
    email: primary?.email_address ?? null,
    name: joinedName || raw.username || null,
    avatarUrl: raw.image_url ?? null,
  };
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeEmail(value: string | null): string | null {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function normalizeName(value: string | null, email: string): string {
  const name = value?.trim();
  return name || email.split('@')[0] || 'Vivu user';
}

function normalizeNullable(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

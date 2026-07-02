import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 7;
const RESET_TTL_MINUTES = 30;
const BCRYPT_ROUNDS = 12;
const INVALID_LOGIN_MESSAGE = 'Email hoặc mật khẩu không đúng';

interface LoginFailureBucket {
  count: number;
  resetAt: number;
  lockedUntil: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  bio?: string | null;
  location?: string | null;
  createdAt?: Date;
}

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  bio: true,
  location: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly production: boolean;
  private readonly loginMaxFailures: number;
  private readonly loginLockoutWindowMs: number;
  private readonly loginFailures = new Map<string, LoginFailureBucket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set. Add it to apps/api/.env');
    }
    this.accessSecret = secret;
    this.production = config.get<string>('NODE_ENV') === 'production';
    this.loginMaxFailures = positiveInteger(config.get<string>('AUTH_LOGIN_MAX_FAILURES'), 5);
    this.loginLockoutWindowMs = positiveInteger(
      config.get<string>('AUTH_LOGIN_LOCKOUT_WINDOW_MS'),
      15 * 60_000,
    );
  }

  async register(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, name: input.name.trim(), passwordHash },
      select: USER_PUBLIC_SELECT,
    });
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const email = input.email.trim().toLowerCase();
    this.assertLoginNotLocked(email);

    const found = await this.prisma.user.findUnique({ where: { email } });
    if (!found || found.deletedAt || !found.passwordHash) {
      this.recordLoginFailure(email);
      throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);
    }
    const ok = await bcrypt.compare(input.password, found.passwordHash);
    if (!ok) {
      this.recordLoginFailure(email);
      throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);
    }
    this.clearLoginFailures(email);
    const user: PublicUser = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      avatarUrl: found.avatarUrl,
      bio: found.bio,
      location: found.location,
      createdAt: found.createdAt,
    };
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!row) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (row.revokedAt) {
      // Reuse detected — kill the whole chain for that user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Phát hiện refresh token đã bị thu hồi — vui lòng đăng nhập lại',
      );
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
      select: { ...USER_PUBLIC_SELECT, deletedAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (user.deletedAt) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }
    // Rotate: revoke old, issue new.
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  async forgotPassword(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user) {
      // Do not leak account existence — succeed silently.
      this.logger.log(
        `Password reset requested for unknown email hash=${this.loginFailureKey(normalized)}`,
      );
      return;
    }
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
      },
    });
    // Stub for email delivery in local/dev only. Never log reset tokens in production.
    if (this.production) {
      this.logger.log(`Password reset token created for user ${user.id}`);
    } else {
      this.logger.warn(`Password reset link (DEV ONLY): /dat-lai-mat-khau?token=${token}`);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản này chưa có mật khẩu nội bộ');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    input: { name?: string; bio?: string; location?: string; avatarUrl?: string },
  ): Promise<PublicUser> {
    const data: {
      name?: string;
      bio?: string | null;
      location?: string | null;
      avatarUrl?: string | null;
    } = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.bio !== undefined) data.bio = input.bio.trim() || null;
    if (input.location !== undefined) data.location = input.location.trim() || null;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl.trim() || null;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_SELECT,
    });
    return user;
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản này chưa có mật khẩu nội bộ');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }
    // Cascade is set on most relations; fall back to manual cleanup for the few
    // that aren't (RefreshToken, PasswordResetToken).
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }

  async getStats(userId: string): Promise<{
    reviews: number;
    favorites: number;
    collections: number;
  }> {
    const [reviews, favorites, collections] = await this.prisma.$transaction([
      this.prisma.review.count({ where: { userId, status: 'visible' } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.collection.count({ where: { userId } }),
    ]);
    return { reviews, favorites, collections };
  }

  private async issueTokens(user: PublicUser): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: ACCESS_TTL,
    });
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  private assertLoginNotLocked(email: string): void {
    const key = this.loginFailureKey(email);
    const bucket = this.loginFailures.get(key);
    if (!bucket) return;

    const now = Date.now();
    if (bucket.lockedUntil > now) {
      throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);
    }
    if (bucket.resetAt <= now) {
      this.loginFailures.delete(key);
    }
  }

  private recordLoginFailure(email: string): void {
    const key = this.loginFailureKey(email);
    const now = Date.now();
    const bucket = this.loginFailures.get(key);
    const activeBucket = bucket && bucket.resetAt > now ? bucket : undefined;
    const nextCount = activeBucket ? activeBucket.count + 1 : 1;
    const lockedUntil = nextCount >= this.loginMaxFailures ? now + this.loginLockoutWindowMs : 0;
    this.pruneLoginFailures(now);
    this.loginFailures.set(key, {
      count: nextCount,
      resetAt: activeBucket?.resetAt ?? now + this.loginLockoutWindowMs,
      lockedUntil,
    });
  }

  private clearLoginFailures(email: string): void {
    this.loginFailures.delete(this.loginFailureKey(email));
  }

  private loginFailureKey(email: string): string {
    return createHash('sha256')
      .update(this.accessSecret)
      .update(':login:')
      .update(email)
      .digest('hex');
  }

  private pruneLoginFailures(now: number): void {
    if (this.loginFailures.size < 5000) return;
    for (const [key, bucket] of this.loginFailures) {
      if (bucket.resetAt <= now && bucket.lockedUntil <= now) {
        this.loginFailures.delete(key);
      }
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

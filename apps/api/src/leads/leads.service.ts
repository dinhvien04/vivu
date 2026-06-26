import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadSource, LeadStatus, Prisma } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { hashRequestIp, hashUserAgent, positiveInteger } from '../common/request-fingerprint';
import { TurnstileService } from '../common/turnstile.service';
import { sanitizeText, sanitizeRequiredText } from '../common/sanitize';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { ListLeadsQueryDto } from './dto/list-leads.query.dto';

interface RateBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class LeadsService {
  private readonly hourlyLimit: number;
  private readonly hashSecret: string;
  private readonly buckets = new Map<string, RateBucket>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
    private readonly turnstile: TurnstileService,
  ) {
    this.hourlyLimit = positiveInteger(config.get<string>('LEADS_RATE_LIMIT_PER_HOUR'), 20);
    this.hashSecret =
      config.get<string>('ABUSE_HASH_SECRET') ??
      config.get<string>('AI_QUOTA_HASH_SECRET') ??
      config.get<string>('JWT_ACCESS_SECRET') ??
      'vivu-local-dev-leads-secret';
  }

  async create(dto: CreateLeadDto, request: FastifyRequest, user?: AuthenticatedUser) {
    if (dto.website?.trim()) {
      return { ok: true, spam: true };
    }

    await this.turnstile.verify(dto.turnstileToken, request);

    const ipHash = hashRequestIp(request, this.hashSecret);
    this.consumeHourly(ipHash);

    const lead = await this.prisma.lead.create({
      data: {
        name: sanitizeRequiredText(dto.name),
        phoneOrZalo: sanitizeRequiredText(dto.phoneOrZalo),
        email: sanitizeText(dto.email),
        interestedPlaceSlug: sanitizeText(dto.interestedPlaceSlug),
        interestedPlaceName: sanitizeText(dto.interestedPlaceName),
        area: sanitizeText(dto.area),
        travelDate: dto.travelDate ? new Date(dto.travelDate) : null,
        peopleCount: dto.peopleCount ?? null,
        budget: sanitizeText(dto.budget),
        note: sanitizeText(dto.note),
        source: (dto.source ?? 'other') as LeadSource,
        ipHash,
        userAgentHash: hashUserAgent(request, this.hashSecret),
        userId: user?.id,
      },
      select: { id: true },
    });
    return { ok: true, id: lead.id };
  }

  async list(query: ListLeadsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.LeadWhereInput = {};
    if (query.status) where.status = query.status as LeadStatus;
    if (query.source) where.source = query.source as LeadSource;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phoneOrZalo: { contains: q, mode: 'insensitive' } },
        { interestedPlaceName: { contains: q, mode: 'insensitive' } },
        { interestedPlaceSlug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: leadSelect(),
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data: rows, meta: { page, pageSize, total } };
  }

  async get(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: leadSelect() });
    if (!lead) throw new NotFoundException('Không tìm thấy lead.');
    return { data: lead };
  }

  async updateStatus(id: string, status: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status: status as LeadStatus },
      select: leadSelect(),
    });
    return { data: lead };
  }

  async updateNote(id: string, internalNote?: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { internalNote: internalNote?.trim() || null },
      select: leadSelect(),
    });
    return { data: lead };
  }

  private consumeHourly(key: string): void {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + 3_600_000 });
      return;
    }
    current.count += 1;
    if (current.count > this.hourlyLimit) {
      throw new HttpException(
        'Bạn đã gửi quá nhiều yêu cầu tư vấn. Vui lòng thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

function leadSelect() {
  return {
    id: true,
    name: true,
    phoneOrZalo: true,
    email: true,
    interestedPlaceSlug: true,
    interestedPlaceName: true,
    area: true,
    travelDate: true,
    peopleCount: true,
    budget: true,
    note: true,
    source: true,
    status: true,
    internalNote: true,
    estimatedValue: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.LeadSelect;
}

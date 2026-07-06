import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageKeyType } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import { RATE_LIMITER_STORE, type RateLimiterStore } from '../../common/rate-limiter.store';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiPipelineInput } from '../types/ai.types';

interface QuotaIdentity {
  keyType: AiUsageKeyType;
  keyHash: string;
}

export interface AiQuotaResult extends QuotaIdentity {
  aiRequests: number;
  imageUploads: number;
  dailyQuota: number;
}

@Injectable()
export class AiQuotaService {
  private readonly anonDailyQuota: number;
  private readonly userDailyQuota: number;
  private readonly perMinuteLimit: number;
  private readonly hashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
    @Inject(RATE_LIMITER_STORE) private readonly rateLimiter: RateLimiterStore,
  ) {
    this.anonDailyQuota = positiveInteger(config.get<string>('AI_DAILY_QUOTA_ANON'), 20);
    this.userDailyQuota = positiveInteger(config.get<string>('AI_DAILY_QUOTA_USER'), 100);
    this.perMinuteLimit = positiveInteger(config.get<string>('AI_RATE_LIMIT_PER_MINUTE'), 10);
    this.hashSecret =
      config.get<string>('ABUSE_HASH_SECRET') ??
      config.get<string>('AI_QUOTA_HASH_SECRET') ??
      config.get<string>('JWT_ACCESS_SECRET') ??
      'vivu-local-dev-ai-quota-secret';
  }

  async consume(request: FastifyRequest, input: AiPipelineInput): Promise<AiQuotaResult> {
    const identity = this.buildIdentity(request, input.sessionId);
    await this.consumeMinute(identity);

    const dailyQuota =
      identity.keyType === AiUsageKeyType.user ? this.userDailyQuota : this.anonDailyQuota;
    const date = utcDateOnly(new Date());
    const imageIncrement = input.image ? 1 : 0;

    const row = await this.prisma.aiUsage.upsert({
      where: {
        keyType_keyHash_date: {
          keyType: identity.keyType,
          keyHash: identity.keyHash,
          date,
        },
      },
      update: {
        aiRequests: { increment: 1 },
        imageUploads: { increment: imageIncrement },
      },
      create: {
        keyType: identity.keyType,
        keyHash: identity.keyHash,
        date,
        aiRequests: 1,
        imageUploads: imageIncrement,
      },
      select: {
        keyType: true,
        keyHash: true,
        aiRequests: true,
        imageUploads: true,
      },
    });

    if (row.aiRequests > dailyQuota) {
      throw new HttpException(
        'Bạn đã dùng hết lượt hỏi AI hôm nay. Vui lòng quay lại vào ngày mai.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return {
      keyType: row.keyType,
      keyHash: row.keyHash,
      aiRequests: row.aiRequests,
      imageUploads: row.imageUploads,
      dailyQuota,
    };
  }

  buildIdentity(request: FastifyRequest, sessionId?: string): QuotaIdentity {
    const userId = getAuthenticatedUserId(request);
    if (userId) {
      return {
        keyType: AiUsageKeyType.user,
        keyHash: this.hashKey(`user:${userId}`),
      };
    }

    const ip = getClientIp(request);
    if (sessionId) {
      return {
        keyType: AiUsageKeyType.ip_session,
        keyHash: this.hashKey(`ip_session:${ip}:${sessionId}`),
      };
    }

    return {
      keyType: AiUsageKeyType.ip,
      keyHash: this.hashKey(`ip:${ip}`),
    };
  }

  private async consumeMinute(identity: QuotaIdentity): Promise<void> {
    const key = `ai-minute:${identity.keyType}:${identity.keyHash}`;
    const allowed = await this.rateLimiter.incrementAndCheck(key, this.perMinuteLimit, 60);
    if (!allowed) {
      throw new HttpException(
        'Bạn đang gửi yêu cầu AI quá nhanh. Vui lòng thử lại sau ít phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private hashKey(value: string): string {
    return createHash('sha256').update(this.hashSecret).update(':').update(value).digest('hex');
  }
}

function getAuthenticatedUserId(request: FastifyRequest): string | undefined {
  const maybeUser = (request as FastifyRequest & { user?: { id?: unknown; sub?: unknown } }).user;
  const value = maybeUser?.id ?? maybeUser?.sub;
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return firstForwarded?.split(',')[0]?.trim() || request.ip || 'unknown';
}

function utcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

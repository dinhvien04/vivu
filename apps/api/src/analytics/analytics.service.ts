import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { hashWithSecret } from '../common/request-fingerprint';
import type { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly hashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.hashSecret =
      config.get<string>('AI_QUOTA_HASH_SECRET') ??
      config.get<string>('JWT_ACCESS_SECRET') ??
      'vivu-local-dev-analytics-secret';
  }

  async track(dto: CreateAnalyticsEventDto, user?: AuthenticatedUser) {
    const sessionHash = dto.sessionId
      ? hashWithSecret(`session:${dto.sessionId}`, this.hashSecret)
      : undefined;
    await this.prisma.analyticsEvent.create({
      data: {
        type: dto.type as AnalyticsEventType,
        placeSlug: dto.placeSlug?.trim() || null,
        userId: user?.id,
        sessionHash,
        metadata: sanitizeMetadata(dto.metadata),
      },
    });
    return { ok: true };
  }
}

function sanitizeMetadata(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 20)) {
    if (typeof raw === 'string') out[key] = raw.slice(0, 200);
    else if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw;
    else if (typeof raw === 'boolean' || raw === null) out[key] = raw;
  }
  return out;
}

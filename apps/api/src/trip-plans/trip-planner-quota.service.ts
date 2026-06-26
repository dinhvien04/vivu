import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageKeyType } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  getClientIp,
  hashWithSecret,
  positiveInteger,
  utcDateOnly,
} from '../common/request-fingerprint';

@Injectable()
export class TripPlannerQuotaService {
  private readonly anonDailyQuota: number;
  private readonly userDailyQuota: number;
  private readonly hashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.anonDailyQuota = positiveInteger(config.get<string>('TRIP_PLANNER_DAILY_QUOTA_ANON'), 5);
    this.userDailyQuota = positiveInteger(config.get<string>('TRIP_PLANNER_DAILY_QUOTA_USER'), 20);
    this.hashSecret =
      config.get<string>('ABUSE_HASH_SECRET') ??
      config.get<string>('AI_QUOTA_HASH_SECRET') ??
      config.get<string>('JWT_ACCESS_SECRET') ??
      'vivu-local-dev-trip-planner-secret';
  }

  async consume(request: FastifyRequest, user?: AuthenticatedUser): Promise<void> {
    const identity = user
      ? {
          keyType: AiUsageKeyType.user,
          keyHash: hashWithSecret(`user:${user.id}`, this.hashSecret),
        }
      : {
          keyType: AiUsageKeyType.ip,
          keyHash: hashWithSecret(`ip:${getClientIp(request)}`, this.hashSecret),
        };
    const dailyQuota = user ? this.userDailyQuota : this.anonDailyQuota;
    const row = await this.prisma.aiUsage.upsert({
      where: {
        keyType_keyHash_date: {
          keyType: identity.keyType,
          keyHash: identity.keyHash,
          date: utcDateOnly(new Date()),
        },
      },
      update: { tripPlanRequests: { increment: 1 } },
      create: {
        keyType: identity.keyType,
        keyHash: identity.keyHash,
        date: utcDateOnly(new Date()),
        tripPlanRequests: 1,
      },
      select: { tripPlanRequests: true },
    });

    if (row.tripPlanRequests > dailyQuota) {
      throw new HttpException(
        'Bạn đã dùng hết lượt tạo lịch trình AI hôm nay. Vui lòng quay lại vào ngày mai.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

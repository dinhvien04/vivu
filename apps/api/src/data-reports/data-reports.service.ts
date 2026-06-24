import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataReportStatus, DataReportType, Prisma } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { hashRequestIp, positiveInteger } from '../common/request-fingerprint';
import { TurnstileService } from '../common/turnstile.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDataReportDto } from './dto/create-data-report.dto';
import type { ListDataReportsQueryDto } from './dto/list-data-reports.query.dto';

interface RateBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class DataReportsService {
  private readonly hourlyLimit: number;
  private readonly hashSecret: string;
  private readonly buckets = new Map<string, RateBucket>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
    private readonly turnstile: TurnstileService,
  ) {
    this.hourlyLimit = positiveInteger(config.get<string>('DATA_REPORT_RATE_LIMIT_PER_HOUR'), 10);
    this.hashSecret =
      config.get<string>('ABUSE_HASH_SECRET') ??
      config.get<string>('AI_QUOTA_HASH_SECRET') ??
      config.get<string>('JWT_ACCESS_SECRET') ??
      'vivu-local-dev-data-reports-secret';
  }

  async create(dto: CreateDataReportDto, request: FastifyRequest) {
    if (dto.website?.trim()) {
      return { ok: true, spam: true };
    }

    await this.turnstile.verify(dto.turnstileToken, request);
    this.consumeHourly(hashRequestIp(request, this.hashSecret));

    const row = await this.prisma.dataReport.create({
      data: {
        placeSlug: dto.placeSlug.trim(),
        type: dto.type as DataReportType,
        message: dto.message.trim(),
        contact: dto.contact?.trim() || null,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  }

  async list(query: ListDataReportsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.DataReportWhereInput = {};
    if (query.status) where.status = query.status as DataReportStatus;
    if (query.type) where.type = query.type as DataReportType;
    if (query.placeSlug) where.placeSlug = { contains: query.placeSlug, mode: 'insensitive' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dataReport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataReport.count({ where }),
    ]);
    return { data: rows, meta: { page, pageSize, total } };
  }

  async updateStatus(id: string, status: string) {
    const row = await this.prisma.dataReport
      .update({
        where: { id },
        data: { status: status as DataReportStatus },
      })
      .catch(() => null);
    if (!row) throw new NotFoundException('Không tìm thấy báo lỗi dữ liệu.');
    return { data: row };
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
        'Bạn đã gửi quá nhiều báo lỗi dữ liệu. Vui lòng thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

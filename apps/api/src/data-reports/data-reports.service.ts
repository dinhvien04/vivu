import { Injectable, NotFoundException } from '@nestjs/common';
import { DataReportStatus, DataReportType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDataReportDto } from './dto/create-data-report.dto';
import type { ListDataReportsQueryDto } from './dto/list-data-reports.query.dto';

@Injectable()
export class DataReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDataReportDto) {
    if (dto.website?.trim()) {
      return { ok: true, spam: true };
    }
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
}

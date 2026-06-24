import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { CreateDataReportDto } from './dto/create-data-report.dto';
import { DataReportsService } from './data-reports.service';

const DATA_REPORT_RATE_LIMIT_PER_HOUR = positiveInteger(
  process.env.DATA_REPORT_RATE_LIMIT_PER_HOUR,
  10,
);

@ApiTags('data-reports')
@Controller('data-reports')
export class DataReportsController {
  constructor(private readonly reports: DataReportsService) {}

  @Post()
  @Throttle({ default: { ttl: 3_600_000, limit: DATA_REPORT_RATE_LIMIT_PER_HOUR } })
  create(@Body() dto: CreateDataReportDto, @Req() request: FastifyRequest) {
    return this.reports.create(dto, request);
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

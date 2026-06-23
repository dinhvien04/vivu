import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateDataReportDto } from './dto/create-data-report.dto';
import { DataReportsService } from './data-reports.service';

@ApiTags('data-reports')
@Controller('data-reports')
export class DataReportsController {
  constructor(private readonly reports: DataReportsService) {}

  @Post()
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  create(@Body() dto: CreateDataReportDto) {
    return this.reports.create(dto);
  }
}

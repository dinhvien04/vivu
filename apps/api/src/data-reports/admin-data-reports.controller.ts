import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DataReportsService } from './data-reports.service';
import { ListDataReportsQueryDto, UpdateDataReportStatusDto } from './dto/list-data-reports.query.dto';

@ApiTags('admin/data-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/data-reports')
export class AdminDataReportsController {
  constructor(private readonly reports: DataReportsService) {}

  @Get()
  list(@Query() query: ListDataReportsQueryDto) {
    return this.reports.list(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDataReportStatusDto) {
    return this.reports.updateStatus(id, dto.status);
  }
}

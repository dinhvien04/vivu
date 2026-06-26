import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DataReportsService } from './data-reports.service';
import {
  ListDataReportsQueryDto,
  UpdateDataReportStatusDto,
} from './dto/list-data-reports.query.dto';

@ApiTags('admin/data-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/data-reports')
export class AdminDataReportsController {
  constructor(
    private readonly reports: DataReportsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  list(@Query() query: ListDataReportsQueryDto) {
    return this.reports.list(query);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDataReportStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.reports.updateStatus(id, dto.status);
    await this.audit.record({
      actorId: user.id,
      action: 'data_report.update_status',
      entityType: 'data_report',
      entityId: id,
      metadata: { status: dto.status },
    });
    return result;
  }
}

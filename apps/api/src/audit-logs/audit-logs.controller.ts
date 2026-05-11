import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs.query.dto';
import { AuditLogsService, type ListAuditLogsResult } from './audit-logs.service';

@ApiTags('admin/audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly svc: AuditLogsService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto): Promise<ListAuditLogsResult> {
    return this.svc.list(query);
  }
}

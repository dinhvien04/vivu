import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ListLeadsQueryDto } from './dto/list-leads.query.dto';
import { UpdateLeadNoteDto, UpdateLeadStatusDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('admin/leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(
    private readonly leads: LeadsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  list(@Query() query: ListLeadsQueryDto) {
    return this.leads.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.leads.updateStatus(id, dto.status);
    await this.audit.record({
      actorId: user.id,
      action: 'lead.update_status',
      entityType: 'lead',
      entityId: id,
      metadata: { status: dto.status },
    });
    return result;
  }

  @Patch(':id/note')
  async updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateLeadNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.leads.updateNote(id, dto.internalNote);
    await this.audit.record({
      actorId: user.id,
      action: 'lead.update_note',
      entityType: 'lead',
      entityId: id,
      metadata: { hasNote: Boolean(dto.internalNote) },
    });
    return result;
  }
}

import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListLeadsQueryDto } from './dto/list-leads.query.dto';
import { UpdateLeadNoteDto, UpdateLeadStatusDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('admin/leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query() query: ListLeadsQueryDto) {
    return this.leads.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leads.get(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leads.updateStatus(id, dto.status);
  }

  @Patch(':id/note')
  updateNote(@Param('id') id: string, @Body() dto: UpdateLeadNoteDto) {
    return this.leads.updateNote(id, dto.internalNote);
  }
}

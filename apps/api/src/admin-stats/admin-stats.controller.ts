import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminStatsService, type AdminStats } from './admin-stats.service';

@ApiTags('admin/stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly svc: AdminStatsService) {}

  @Get()
  async snapshot(): Promise<{ data: AdminStats }> {
    const data = await this.svc.snapshot();
    return { data };
  }
}

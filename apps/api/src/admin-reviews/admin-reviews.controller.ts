import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Paginated, Review } from '@vivu/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ListReviewsQueryDto } from '../reviews/dto/list-reviews.query.dto';
import { AdminReviewsService } from './admin-reviews.service';

@ApiTags('admin/reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(
    private readonly svc: AdminReviewsService,
    private readonly audit: AuditLogsService,
  ) {}

  @Get()
  list(@Query() query: ListReviewsQueryDto): Promise<Paginated<Review>> {
    return this.svc.list(query);
  }

  @Post(':id/hide')
  async hide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'hidden');
    await this.audit.record({
      actorId: user.id,
      action: 'review.hide',
      entityType: 'review',
      entityId: data.id,
    });
    return { data };
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'visible');
    await this.audit.record({
      actorId: user.id,
      action: 'review.restore',
      entityType: 'review',
      entityId: data.id,
    });
    return { data };
  }

  @Post(':id/report')
  async report(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'reported');
    await this.audit.record({
      actorId: user.id,
      action: 'review.report',
      entityType: 'review',
      entityId: data.id,
    });
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.svc.remove(id);
    await this.audit.record({
      actorId: user.id,
      action: 'review.delete',
      entityType: 'review',
      entityId: id,
    });
  }
}

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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ListReviewsQueryDto } from '../reviews/dto/list-reviews.query.dto';
import { AdminReviewsService } from './admin-reviews.service';

@ApiTags('admin/reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly svc: AdminReviewsService) {}

  @Get()
  list(@Query() query: ListReviewsQueryDto): Promise<Paginated<Review>> {
    return this.svc.list(query);
  }

  @Post(':id/hide')
  async hide(@Param('id') id: string): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'hidden');
    return { data };
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'visible');
    return { data };
  }

  @Post(':id/report')
  async report(@Param('id') id: string): Promise<{ data: Review }> {
    const data = await this.svc.setStatus(id, 'reported');
    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.svc.remove(id);
  }
}

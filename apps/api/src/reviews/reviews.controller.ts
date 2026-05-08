import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Paginated, Review } from '@vivu/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews.query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  /** Public: list visible reviews of a place (by id or slug). */
  @Get('places/:idOrSlug/reviews')
  list(
    @Param('idOrSlug') idOrSlug: string,
    @Query() query: ListReviewsQueryDto,
  ): Promise<Paginated<Review>> {
    return this.svc.listForPlace(idOrSlug, query);
  }

  /** Auth: create a review for a place (id or slug). */
  @Post('places/:idOrSlug/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Review }> {
    const data = await this.svc.create(idOrSlug, user.id, dto);
    return { data };
  }

  /** Auth: list my reviews. */
  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listMine(
    @Query() query: ListReviewsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Paginated<Review>> {
    return this.svc.listForUser(user.id, query);
  }

  /** Auth (owner only): edit my review. */
  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: Review }> {
    const data = await this.svc.update(id, user.id, dto);
    return { data };
  }

  /** Auth (owner or admin): delete a review. */
  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.svc.remove(id, user.id, user.role);
  }
}

import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';

@Module({
  imports: [ReviewsModule],
  controllers: [AdminReviewsController],
  providers: [AdminReviewsService],
})
export class AdminReviewsModule {}

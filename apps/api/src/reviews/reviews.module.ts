import { Module } from '@nestjs/common';
import { PlaceRatingService } from './place-rating.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PlaceRatingService],
  exports: [ReviewsService, PlaceRatingService],
})
export class ReviewsModule {}

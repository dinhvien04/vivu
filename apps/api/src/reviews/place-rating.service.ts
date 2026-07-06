import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaceRatingService {
  constructor(private readonly prisma: PrismaService) {}

  async syncPlaceRating(placeId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { placeId, status: 'visible' },
      _count: { _all: true },
      _avg: { rating: true },
    });
    const ratingCount = agg._count._all;
    const ratingAvg =
      ratingCount > 0 && agg._avg.rating
        ? Math.round(agg._avg.rating * 100) / 100
        : 0;
    await this.prisma.place.update({
      where: { id: placeId },
      data: { ratingCount, ratingAvg },
    });
  }
}
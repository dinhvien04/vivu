import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Prisma,
  Review as PrismaReview,
  ReviewStatus,
  User as PrismaUser,
} from '@prisma/client';
import type { Paginated, Review } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceRatingService } from '../reviews/place-rating.service';
import { ListReviewsQueryDto } from '../reviews/dto/list-reviews.query.dto';

type ReviewWithRelations = PrismaReview & {
  user: Pick<PrismaUser, 'id' | 'name' | 'avatarUrl'>;
  place: { id: string; slug: string; titleVi: string };
};

const INCLUDE = {
  user: { select: { id: true, name: true, avatarUrl: true } },
  place: { select: { id: true, slug: true, titleVi: true } },
} as const;

function toApi(r: ReviewWithRelations): Review {
  return {
    id: r.id,
    placeId: r.placeId,
    rating: r.rating,
    content: r.content,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: { id: r.user.id, name: r.user.name, avatarUrl: r.user.avatarUrl },
    place: r.place,
  };
}

@Injectable()
export class AdminReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly placeRating: PlaceRatingService,
  ) {}

  async list(query: ListReviewsQueryDto): Promise<Paginated<Review>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReviewWhereInput = {};
    if (query.status) where.status = query.status;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data: rows.map((r) => toApi(r as ReviewWithRelations)),
      meta: { page, pageSize, total },
    };
  }

  async setStatus(reviewId: string, status: ReviewStatus): Promise<Review> {
    try {
      const r = await this.prisma.review.update({
        where: { id: reviewId },
        data: { status },
        include: INCLUDE,
      });
      await this.placeRating.syncPlaceRating(r.placeId);
      return toApi(r as ReviewWithRelations);
    } catch (e) {
      if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2025') {
        throw new NotFoundException('Không tìm thấy đánh giá');
      }
      throw e;
    }
  }

  async remove(reviewId: string): Promise<void> {
    try {
      const existing = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { placeId: true },
      });
      if (!existing) throw new NotFoundException('Không tìm thấy đánh giá');
      await this.prisma.review.delete({ where: { id: reviewId } });
      await this.placeRating.syncPlaceRating(existing.placeId);
    } catch (e) {
      if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2025') {
        throw new NotFoundException('Không tìm thấy đánh giá');
      }
      throw e;
    }
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Review as PrismaReview, User as PrismaUser } from '@prisma/client';
import type { Paginated, Review } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews.query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

type ReviewWithRelations = PrismaReview & {
  user: Pick<PrismaUser, 'id' | 'name' | 'avatarUrl'>;
  place?: { id: string; slug: string; titleVi: string };
};

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

const REVIEW_INCLUDE_WITH_PLACE = {
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
    user: {
      id: r.user.id,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
    },
    ...(r.place ? { place: r.place } : {}),
  };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find a place by id or slug. */
  private async resolvePlaceId(idOrSlug: string): Promise<string> {
    const place = await this.prisma.place.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');
    return place.id;
  }

  async listForPlace(idOrSlug: string, query: ListReviewsQueryDto): Promise<Paginated<Review>> {
    const placeId = await this.resolvePlaceId(idOrSlug);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReviewWhereInput = { placeId, status: 'visible' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: REVIEW_INCLUDE,
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data: rows.map((r) => toApi(r as ReviewWithRelations)),
      meta: { page, pageSize, total },
    };
  }

  async create(idOrSlug: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    const placeId = await this.resolvePlaceId(idOrSlug);
    const r = await this.prisma.review.create({
      data: {
        placeId,
        userId,
        rating: dto.rating,
        content: dto.content,
        status: 'visible',
      },
      include: REVIEW_INCLUDE,
    });
    return toApi(r as ReviewWithRelations);
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto): Promise<Review> {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy đánh giá');
    if (existing.userId !== userId) {
      throw new ForbiddenException('Bạn không phải tác giả của đánh giá này');
    }
    const data: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.content !== undefined) data.content = dto.content;
    const r = await this.prisma.review.update({
      where: { id: reviewId },
      data,
      include: REVIEW_INCLUDE,
    });
    return toApi(r as ReviewWithRelations);
  }

  async remove(reviewId: string, userId: string, role: string): Promise<void> {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy đánh giá');
    const isAdmin = role === 'admin' || role === 'editor';
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xoá đánh giá này');
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  async listForUser(userId: string, query: ListReviewsQueryDto): Promise<Paginated<Review>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReviewWhereInput = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: REVIEW_INCLUDE_WITH_PLACE,
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data: rows.map((r) => toApi(r as ReviewWithRelations)),
      meta: { page, pageSize, total },
    };
  }
}

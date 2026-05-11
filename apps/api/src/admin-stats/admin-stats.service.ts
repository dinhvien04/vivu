import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminStats {
  /** Total places of any status (draft / published / archived). */
  totalPlaces: number;
  /** Total reviews of any status (visible / hidden / reported). */
  totalReviews: number;
  /**
   * Distinct users who created at least one review / question / answer within
   * the active-window (default: last 30 days).
   */
  activeUsers: number;
  /** ISO timestamp the snapshot was computed at. */
  computedAt: string;
}

const ACTIVE_WINDOW_DAYS = 30;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(): Promise<AdminStats> {
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);

    const [totalPlaces, totalReviews, recentReviewers, recentQuestioners, recentAnswerers] =
      await this.prisma.$transaction([
        this.prisma.place.count(),
        this.prisma.review.count(),
        this.prisma.review.findMany({
          where: { createdAt: { gte: since } },
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.question.findMany({
          where: { createdAt: { gte: since } },
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.answer.findMany({
          where: { createdAt: { gte: since } },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);

    const unique = new Set<string>();
    for (const r of recentReviewers) unique.add(r.userId);
    for (const q of recentQuestioners) unique.add(q.userId);
    for (const a of recentAnswerers) unique.add(a.userId);

    return {
      totalPlaces,
      totalReviews,
      activeUsers: unique.size,
      computedAt: new Date().toISOString(),
    };
  }
}

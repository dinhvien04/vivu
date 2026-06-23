import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  totalTripPlans: number;
  totalLeads: number;
  aiRequestsToday: number;
  tripPlansToday: number;
  leadsByStatus: Array<{ status: string; count: number }>;
  topPlacesViewed: Array<{ placeSlug: string; count: number }>;
  topSearchQueries: Array<{ query: string; count: number }>;
}

const ACTIVE_WINDOW_DAYS = 30;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(): Promise<AdminStats> {
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      totalPlaces,
      totalReviews,
      totalTripPlans,
      totalLeads,
      aiUsageToday,
      tripPlansToday,
      recentReviewers,
      recentQuestioners,
      recentAnswerers,
      leadsByStatus,
      topPlacesViewedRaw,
      recentSearchEvents,
    ] = await this.prisma.$transaction([
      this.prisma.place.count(),
      this.prisma.review.count(),
      this.prisma.tripPlan.count(),
      this.prisma.lead.count(),
      this.prisma.aiUsage.aggregate({
        where: { date: today },
        _sum: { aiRequests: true, tripPlanRequests: true },
      }),
      this.prisma.tripPlan.count({ where: { createdAt: { gte: today } } }),
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
      this.prisma.lead.findMany({
        select: { status: true },
        take: 10_000,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { type: 'place_view', placeSlug: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 2_000,
        select: { placeSlug: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { type: 'search_performed' },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { metadata: true },
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
      totalTripPlans,
      totalLeads,
      aiRequestsToday: aiUsageToday._sum.aiRequests ?? 0,
      tripPlansToday,
      leadsByStatus: countLeadStatuses(leadsByStatus),
      topPlacesViewed: countPlaceViews(
        topPlacesViewedRaw.filter((row): row is { placeSlug: string } => Boolean(row.placeSlug)),
      ).slice(0, 5),
      topSearchQueries: extractSearchQueries(recentSearchEvents),
      computedAt: new Date().toISOString(),
    };
  }
}

function countLeadStatuses(rows: Array<{ status: string }>): Array<{ status: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function countPlaceViews(
  rows: Array<{ placeSlug: string }>,
): Array<{ placeSlug: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.placeSlug, (counts.get(row.placeSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([placeSlug, count]) => ({ placeSlug, count }))
    .sort((a, b) => b.count - a.count);
}

function extractSearchQueries(
  rows: Array<{ metadata: Prisma.JsonValue | null }>,
): Array<{ query: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.metadata || typeof row.metadata !== 'object') continue;
    const query = (row.metadata as { q?: unknown }).q;
    if (typeof query !== 'string' || !query.trim()) continue;
    counts.set(query, (counts.get(query) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

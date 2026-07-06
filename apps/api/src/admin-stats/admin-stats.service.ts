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
  newLeads: number;
  planningLeads: number;
  newDataReports: number;
  resolvedDataReports7d: number;
  aiFeedbackIssues: number;
  missingContextEvents: number;
  leadsByStatus: Array<{ status: string; count: number }>;
  topPlacesViewed: Array<{ placeSlug: string; count: number }>;
  topLeadPlaces: Array<{ placeSlug: string; count: number }>;
  topSearchQueries: Array<{ query: string; count: number }>;
}

const ACTIVE_WINDOW_DAYS = 30;

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(): Promise<AdminStats> {
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
    const since7d = new Date(Date.now() - 7 * 86_400_000);

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
      leadsByStatusRaw,
      topLeadPlacesRaw,
      topPlacesViewedRaw,
      newDataReports,
      resolvedDataReports7d,
      recentSearchEvents,
      recentAiFeedback,
      missingContextEvents,
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
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.lead.groupBy({
        by: ['interestedPlaceSlug'],
        where: { interestedPlaceSlug: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { interestedPlaceSlug: 'desc' } },
        take: 5,
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['placeSlug'],
        where: { type: 'place_view', placeSlug: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { placeSlug: 'desc' } },
        take: 5,
      }),
      this.prisma.dataReport.count({ where: { status: 'new' } }),
      this.prisma.dataReport.count({
        where: { status: 'resolved', updatedAt: { gte: since7d } },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { type: 'search_performed' },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { metadata: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          type: { in: ['ai_feedback_submitted', 'trip_plan_feedback_submitted'] },
          createdAt: { gte: since7d },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: { metadata: true },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          type: { in: ['ai_missing_context', 'trip_plan_missing_data'] },
          createdAt: { gte: since7d },
        },
      }),
    ]);

    const unique = new Set<string>();
    for (const r of recentReviewers) unique.add(r.userId);
    for (const q of recentQuestioners) unique.add(q.userId);
    for (const a of recentAnswerers) unique.add(a.userId);

    const leadStatusCounts = leadsByStatusRaw.map((row) => ({
      status: row.status,
      count: countAll(row._count),
    }));

    return {
      totalPlaces,
      totalReviews,
      activeUsers: unique.size,
      totalTripPlans,
      totalLeads,
      aiRequestsToday: aiUsageToday._sum.aiRequests ?? 0,
      tripPlansToday,
      newLeads: leadStatusCounts.find((item) => item.status === 'new')?.count ?? 0,
      planningLeads: leadStatusCounts.find((item) => item.status === 'planning')?.count ?? 0,
      newDataReports,
      resolvedDataReports7d,
      aiFeedbackIssues: countFeedbackIssues(recentAiFeedback),
      missingContextEvents,
      leadsByStatus: leadStatusCounts,
      topPlacesViewed: topPlacesViewedRaw
        .filter((row) => Boolean(row.placeSlug))
        .map((row) => ({
          placeSlug: row.placeSlug as string,
          count: countAll(row._count),
        })),
      topLeadPlaces: topLeadPlacesRaw
        .filter((row) => Boolean(row.interestedPlaceSlug))
        .map((row) => ({
          placeSlug: row.interestedPlaceSlug as string,
          count: countAll(row._count),
        })),
      topSearchQueries: extractSearchQueries(recentSearchEvents),
      computedAt: new Date().toISOString(),
    };
  }
}

function countAll(
  value:
    | true
    | {
        _all?: number;
      }
    | undefined,
): number {
  if (!value || value === true) return 0;
  return value._all ?? 0;
}

function countFeedbackIssues(rows: Array<{ metadata: Prisma.JsonValue | null }>): number {
  let count = 0;
  for (const row of rows) {
    if (!row.metadata || typeof row.metadata !== 'object') continue;
    const value = (row.metadata as { value?: unknown }).value;
    if (value === 'wrong' || value === 'missing_info') count += 1;
  }
  return count;
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

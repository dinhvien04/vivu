import { AdminStatsService } from './admin-stats.service';
import type { PrismaService } from '../prisma/prisma.service';

function build(parts: {
  totalPlaces?: number;
  totalReviews?: number;
  totalTripPlans?: number;
  totalLeads?: number;
  aiRequestsToday?: number;
  tripPlansToday?: number;
  leads?: Array<{ status: string }>;
  newDataReports?: number;
  resolvedDataReports7d?: number;
  placeViews?: Array<{ placeSlug: string | null }>;
  leadPlaces?: Array<{ interestedPlaceSlug: string | null }>;
  searchEvents?: Array<{ metadata: unknown }>;
  feedbackEvents?: Array<{ metadata: unknown }>;
  missingContextEvents?: number;
  reviewers?: Array<{ userId: string }>;
  questioners?: Array<{ userId: string }>;
  answerers?: Array<{ userId: string }>;
}) {
  const reviewFindMany = jest.fn().mockResolvedValue(parts.reviewers ?? []);
  const questionFindMany = jest.fn().mockResolvedValue(parts.questioners ?? []);
  const answerFindMany = jest.fn().mockResolvedValue(parts.answerers ?? []);
  const tripPlanCount = jest
    .fn()
    .mockResolvedValueOnce(parts.totalTripPlans ?? 0)
    .mockResolvedValueOnce(parts.tripPlansToday ?? 0);
  const analyticsEventFindMany = jest
    .fn()
    .mockResolvedValueOnce(parts.placeViews ?? [])
    .mockResolvedValueOnce(parts.searchEvents ?? [])
    .mockResolvedValueOnce(parts.feedbackEvents ?? []);
  const analyticsEventCount = jest.fn().mockResolvedValue(parts.missingContextEvents ?? 0);
  const dataReportCount = jest
    .fn()
    .mockResolvedValueOnce(parts.newDataReports ?? 0)
    .mockResolvedValueOnce(parts.resolvedDataReports7d ?? 0);
  const prisma = {
    place: { count: jest.fn().mockResolvedValue(parts.totalPlaces ?? 0) },
    review: {
      count: jest.fn().mockResolvedValue(parts.totalReviews ?? 0),
      findMany: reviewFindMany,
    },
    tripPlan: {
      count: tripPlanCount,
    },
    lead: {
      count: jest.fn().mockResolvedValue(parts.totalLeads ?? 0),
      findMany: jest
        .fn()
        .mockResolvedValueOnce(parts.leads ?? [])
        .mockResolvedValueOnce(parts.leadPlaces ?? []),
    },
    dataReport: {
      count: dataReportCount,
    },
    aiUsage: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: {
          aiRequests: parts.aiRequestsToday ?? 0,
          tripPlanRequests: parts.tripPlansToday ?? 0,
        },
      }),
    },
    analyticsEvent: {
      findMany: analyticsEventFindMany,
      count: analyticsEventCount,
    },
    question: { findMany: questionFindMany },
    answer: { findMany: answerFindMany },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const service = new AdminStatsService(prisma as unknown as PrismaService);
  return {
    service,
    prisma,
    reviewFindMany,
    questionFindMany,
    answerFindMany,
    tripPlanCount,
    analyticsEventFindMany,
    analyticsEventCount,
    dataReportCount,
  };
}

describe('AdminStatsService.snapshot', () => {
  it('returns 0 across the board when DB is empty', async () => {
    const { service } = build({});
    const out = await service.snapshot();
    expect(out.totalPlaces).toBe(0);
    expect(out.totalReviews).toBe(0);
    expect(out.activeUsers).toBe(0);
    expect(out.totalTripPlans).toBe(0);
    expect(out.totalLeads).toBe(0);
    expect(out.aiRequestsToday).toBe(0);
    expect(out.tripPlansToday).toBe(0);
    expect(out.newLeads).toBe(0);
    expect(out.planningLeads).toBe(0);
    expect(out.newDataReports).toBe(0);
    expect(out.resolvedDataReports7d).toBe(0);
    expect(out.aiFeedbackIssues).toBe(0);
    expect(out.missingContextEvents).toBe(0);
    expect(out.leadsByStatus).toEqual([]);
    expect(out.topPlacesViewed).toEqual([]);
    expect(out.topLeadPlaces).toEqual([]);
    expect(out.topSearchQueries).toEqual([]);
  });

  it('forwards counts from prisma', async () => {
    const { service } = build({
      totalPlaces: 42,
      totalReviews: 100,
      totalTripPlans: 8,
      totalLeads: 5,
      aiRequestsToday: 12,
      tripPlansToday: 2,
      newDataReports: 3,
      resolvedDataReports7d: 4,
      missingContextEvents: 6,
    });
    const out = await service.snapshot();
    expect(out.totalPlaces).toBe(42);
    expect(out.totalReviews).toBe(100);
    expect(out.totalTripPlans).toBe(8);
    expect(out.totalLeads).toBe(5);
    expect(out.aiRequestsToday).toBe(12);
    expect(out.tripPlansToday).toBe(2);
    expect(out.newDataReports).toBe(3);
    expect(out.resolvedDataReports7d).toBe(4);
    expect(out.missingContextEvents).toBe(6);
  });

  it('returns ISO timestamp for computedAt', async () => {
    const { service } = build({});
    const out = await service.snapshot();
    expect(out.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('counts a single user once across reviewers / questioners / answerers', async () => {
    const { service } = build({
      reviewers: [{ userId: 'u1' }],
      questioners: [{ userId: 'u1' }],
      answerers: [{ userId: 'u1' }],
    });
    const out = await service.snapshot();
    expect(out.activeUsers).toBe(1);
  });

  it('counts distinct users across the three sources', async () => {
    const { service } = build({
      reviewers: [{ userId: 'u1' }, { userId: 'u2' }],
      questioners: [{ userId: 'u3' }],
      answerers: [{ userId: 'u2' }, { userId: 'u4' }],
    });
    const out = await service.snapshot();
    expect(out.activeUsers).toBe(4);
  });

  it('filters by a 30-day window (passes since to findMany)', async () => {
    const { service, reviewFindMany } = build({});
    const before = Date.now();
    await service.snapshot();
    const after = Date.now();
    const where = reviewFindMany.mock.calls[0][0].where;
    expect(where.createdAt.gte).toBeInstanceOf(Date);
    const sinceMs = (where.createdAt.gte as Date).getTime();
    // Window should be roughly now - 30d.
    const thirtyDays = 30 * 86_400_000;
    expect(sinceMs).toBeGreaterThanOrEqual(before - thirtyDays - 10);
    expect(sinceMs).toBeLessThanOrEqual(after - thirtyDays + 10);
  });

  it('uses distinct: ["userId"] when querying recent contributors', async () => {
    const { service, reviewFindMany, questionFindMany, answerFindMany } = build({});
    await service.snapshot();
    expect(reviewFindMany.mock.calls[0][0].distinct).toEqual(['userId']);
    expect(questionFindMany.mock.calls[0][0].distinct).toEqual(['userId']);
    expect(answerFindMany.mock.calls[0][0].distinct).toEqual(['userId']);
  });

  it('aggregates lead statuses, top place views and search queries', async () => {
    const { service } = build({
      leads: [{ status: 'new' }, { status: 'new' }, { status: 'planning' }],
      leadPlaces: [
        { interestedPlaceSlug: 'ky-co' },
        { interestedPlaceSlug: 'ky-co' },
        { interestedPlaceSlug: 'bien-ho' },
        { interestedPlaceSlug: null },
      ],
      placeViews: [
        { placeSlug: 'bien-ho' },
        { placeSlug: 'bien-ho' },
        { placeSlug: 'ky-co' },
        { placeSlug: null },
      ],
      searchEvents: [
        { metadata: { q: 'bien ho' } },
        { metadata: { q: 'bien ho' } },
        { metadata: { q: 'ky co' } },
        { metadata: { other: 'ignored' } },
      ],
      feedbackEvents: [
        { metadata: { value: 'wrong' } },
        { metadata: { value: 'missing_info' } },
        { metadata: { value: 'helpful' } },
      ],
    });

    const out = await service.snapshot();

    expect(out.leadsByStatus).toEqual([
      { status: 'new', count: 2 },
      { status: 'planning', count: 1 },
    ]);
    expect(out.newLeads).toBe(2);
    expect(out.planningLeads).toBe(1);
    expect(out.topPlacesViewed).toEqual([
      { placeSlug: 'bien-ho', count: 2 },
      { placeSlug: 'ky-co', count: 1 },
    ]);
    expect(out.topLeadPlaces).toEqual([
      { placeSlug: 'ky-co', count: 2 },
      { placeSlug: 'bien-ho', count: 1 },
    ]);
    expect(out.topSearchQueries).toEqual([
      { query: 'bien ho', count: 2 },
      { query: 'ky co', count: 1 },
    ]);
    expect(out.aiFeedbackIssues).toBe(2);
  });
});

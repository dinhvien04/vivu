import { AdminStatsService } from './admin-stats.service';
import type { PrismaService } from '../prisma/prisma.service';

function build(parts: {
  totalPlaces?: number;
  totalReviews?: number;
  reviewers?: Array<{ userId: string }>;
  questioners?: Array<{ userId: string }>;
  answerers?: Array<{ userId: string }>;
}) {
  const reviewFindMany = jest.fn().mockResolvedValue(parts.reviewers ?? []);
  const questionFindMany = jest.fn().mockResolvedValue(parts.questioners ?? []);
  const answerFindMany = jest.fn().mockResolvedValue(parts.answerers ?? []);
  const prisma = {
    place: { count: jest.fn().mockResolvedValue(parts.totalPlaces ?? 0) },
    review: {
      count: jest.fn().mockResolvedValue(parts.totalReviews ?? 0),
      findMany: reviewFindMany,
    },
    question: { findMany: questionFindMany },
    answer: { findMany: answerFindMany },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const service = new AdminStatsService(prisma as unknown as PrismaService);
  return { service, prisma, reviewFindMany, questionFindMany, answerFindMany };
}

describe('AdminStatsService.snapshot', () => {
  it('returns 0 across the board when DB is empty', async () => {
    const { service } = build({});
    const out = await service.snapshot();
    expect(out.totalPlaces).toBe(0);
    expect(out.totalReviews).toBe(0);
    expect(out.activeUsers).toBe(0);
  });

  it('forwards counts from prisma', async () => {
    const { service } = build({ totalPlaces: 42, totalReviews: 100 });
    const out = await service.snapshot();
    expect(out.totalPlaces).toBe(42);
    expect(out.totalReviews).toBe(100);
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
});

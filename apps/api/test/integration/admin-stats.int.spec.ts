/**
 * Integration test cho `AdminStatsService.snapshot` — verify với DB thật rằng:
 *
 * - `totalPlaces` đếm cả draft + published + archived.
 * - `totalReviews` đếm cả visible + hidden + reported.
 * - `activeUsers` là số distinct user trong 30 ngày qua, hợp nhất từ reviews +
 *   questions + answers (không trùng).
 * - User chỉ hoạt động ngoài cửa sổ 30 ngày KHÔNG bị tính là active.
 */
import { AdminStatsService } from '../../src/admin-stats/admin-stats.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { disconnectPrisma, getPrisma, truncateAll } from './prisma-helper';

describe('AdminStatsService.snapshot — integration', () => {
  let prisma: PrismaService;
  let service: AdminStatsService;

  beforeAll(async () => {
    prisma = getPrisma() as PrismaService;
    service = new AdminStatsService(prisma);
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('trả zero khi DB rỗng', async () => {
    const snap = await service.snapshot();
    expect(snap).toMatchObject({
      totalPlaces: 0,
      totalReviews: 0,
      activeUsers: 0,
    });
    expect(snap.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('đếm tất cả status (draft + published + archived)', async () => {
    const region = await prisma.region.create({
      data: { slug: 'r', nameVi: 'R', nameEn: 'R' },
    });
    for (const status of ['draft', 'published', 'archived'] as const) {
      await prisma.place.create({
        data: {
          slug: `p-${status}`,
          titleVi: status,
          summaryVi: 's',
          regionId: region.id,
          status,
        },
      });
    }
    const snap = await service.snapshot();
    expect(snap.totalPlaces).toBe(3);
  });

  it('activeUsers: dedupe khi 1 user có nhiều activity', async () => {
    const region = await prisma.region.create({
      data: { slug: 'r', nameVi: 'R', nameEn: 'R' },
    });
    const place = await prisma.place.create({
      data: {
        slug: 'p1',
        titleVi: 't',
        summaryVi: 's',
        regionId: region.id,
        status: 'published',
      },
    });
    const u = await prisma.user.create({
      data: { email: 'a@b.test', passwordHash: 'x', name: 'A' },
    });
    // Cùng user u → 1 review + 1 question + 1 answer = 1 activeUser.
    await prisma.review.create({
      data: { userId: u.id, placeId: place.id, rating: 4, content: 'ok' },
    });
    const q = await prisma.question.create({
      data: { userId: u.id, placeId: place.id, content: 'Có gì hay?' },
    });
    await prisma.answer.create({
      data: { userId: u.id, questionId: q.id, content: 'Đẹp lắm' },
    });
    const snap = await service.snapshot();
    expect(snap.activeUsers).toBe(1);
  });

  it('activeUsers: hợp 3 nguồn (review + question + answer) thành tập user duy nhất', async () => {
    const region = await prisma.region.create({
      data: { slug: 'r', nameVi: 'R', nameEn: 'R' },
    });
    const place = await prisma.place.create({
      data: {
        slug: 'p1',
        titleVi: 't',
        summaryVi: 's',
        regionId: region.id,
        status: 'published',
      },
    });
    const [u1, u2, u3] = await Promise.all([
      prisma.user.create({ data: { email: 'u1@x.test', passwordHash: 'x', name: 'U1' } }),
      prisma.user.create({ data: { email: 'u2@x.test', passwordHash: 'x', name: 'U2' } }),
      prisma.user.create({ data: { email: 'u3@x.test', passwordHash: 'x', name: 'U3' } }),
    ]);
    await prisma.review.create({
      data: { userId: u1.id, placeId: place.id, rating: 5, content: 'ok' },
    });
    const q = await prisma.question.create({
      data: { userId: u2.id, placeId: place.id, content: '?' },
    });
    await prisma.answer.create({ data: { userId: u3.id, questionId: q.id, content: '!' } });

    const snap = await service.snapshot();
    expect(snap.activeUsers).toBe(3);
  });

  it('activeUsers: review ngoài cửa sổ 30 ngày KHÔNG được tính', async () => {
    const region = await prisma.region.create({
      data: { slug: 'r', nameVi: 'R', nameEn: 'R' },
    });
    const place = await prisma.place.create({
      data: {
        slug: 'p1',
        titleVi: 't',
        summaryVi: 's',
        regionId: region.id,
        status: 'published',
      },
    });
    const oldU = await prisma.user.create({
      data: { email: 'old@x.test', passwordHash: 'x', name: 'Old' },
    });
    // Review cách đây 31 ngày.
    const past = new Date(Date.now() - 31 * 86_400_000);
    await prisma.review.create({
      data: {
        userId: oldU.id,
        placeId: place.id,
        rating: 4,
        content: 'old',
        createdAt: past,
      },
    });
    const snap = await service.snapshot();
    expect(snap.activeUsers).toBe(0);
  });

  it('totalReviews đếm cả visible/hidden/reported', async () => {
    const region = await prisma.region.create({
      data: { slug: 'r', nameVi: 'R', nameEn: 'R' },
    });
    const place = await prisma.place.create({
      data: {
        slug: 'p1',
        titleVi: 't',
        summaryVi: 's',
        regionId: region.id,
        status: 'published',
      },
    });
    const u = await prisma.user.create({
      data: { email: 'a@x.test', passwordHash: 'x', name: 'A' },
    });
    for (const status of ['visible', 'hidden', 'reported'] as const) {
      await prisma.review.create({
        data: { userId: u.id, placeId: place.id, rating: 3, content: 'ok', status },
      });
    }
    const snap = await service.snapshot();
    expect(snap.totalReviews).toBe(3);
  });
});

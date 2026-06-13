/**
 * Unit tests for PlacesService.listNearby — exercises the PostGIS raw query +
 * downstream enrichment (rating aggregation, ordering by distance).
 */
import { PlacesService } from './places.service';
import type { PrismaService } from '../prisma/prisma.service';

function makePlace(id: string, slug: string) {
  return {
    id,
    locationKey: null,
    slug,
    titleVi: `Place ${id}`,
    titleEn: null,
    summaryVi: null,
    summaryEn: null,
    descriptionVi: null,
    descriptionEn: null,
    regionId: 'r1',
    region: {
      id: 'r1',
      slug: 'mien-bac',
      nameVi: 'Miền Bắc',
      nameEn: 'Northern',
      parentId: null,
    },
    province: 'Gia Lai',
    aliases: [],
    address: null,
    lat: 21.0,
    lng: 105.8,
    bestSeasons: [],
    status: 'published',
    heroImageUrl: null as string | null,
    heroImageS3Key: null as string | null,
    qdrantPlaceSlug: null,
    isAiReady: false,
    photos: [],
    categories: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };
}

function build({
  rawRows = [] as Array<{ id: string; distance_m: number }>,
  places = [] as ReturnType<typeof makePlace>[],
  ratings = [] as Array<{ placeId: string; _count: { _all: number }; _avg: { rating: number } }>,
}) {
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue(rawRows),
    place: {
      findMany: jest.fn().mockResolvedValue(places),
    },
    review: {
      groupBy: jest.fn().mockResolvedValue(ratings),
    },
  };
  const s3 = { getPresignedGetUrl: jest.fn() };
  const service = new PlacesService(prisma as unknown as PrismaService, s3 as never);
  return { service, prisma, s3 };
}

describe('PlacesService.listNearby', () => {
  it('returns [] when the raw query yields no rows', async () => {
    const { service, prisma } = build({ rawRows: [] });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 10,
      limit: 10,
    });
    expect(out).toEqual([]);
    // Skips findMany + groupBy when there is nothing to enrich.
    expect(prisma.place.findMany).not.toHaveBeenCalled();
    expect(prisma.review.groupBy).not.toHaveBeenCalled();
  });

  it('preserves the distance order returned by ST_DWithin', async () => {
    const rawRows = [
      { id: 'p2', distance_m: 200 },
      { id: 'p1', distance_m: 800 },
      { id: 'p3', distance_m: 1500 },
    ];
    // Note: Prisma's findMany does NOT preserve `IN (...)` order — we shuffle
    // to verify the service re-sorts using distanceById.
    const places = [makePlace('p1', 's-1'), makePlace('p3', 's-3'), makePlace('p2', 's-2')];
    const { service } = build({ rawRows, places });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 10,
    });
    expect(out.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
  });

  it('converts meters from the raw query to km (1dp) on the response', async () => {
    const rawRows = [{ id: 'p1', distance_m: 1234 }];
    const places = [makePlace('p1', 's-1')];
    const { service } = build({ rawRows, places });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 10,
    });
    // 1234 m → 1.234 km → rounded to 1 dp = 1.2
    expect(out[0]?.distanceKm).toBeCloseTo(1.2, 1);
  });

  it('clamps limit to a maximum of 50', async () => {
    const { service, prisma } = build({ rawRows: [] });
    await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 9999,
    });
    const passed = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
    // The Prisma.sql tag is an object containing `values`. The final value is
    // the LIMIT clause — assert it's clamped to 50.
    expect(passed.values).toContain(50);
  });

  it('clamps limit to a minimum of 1', async () => {
    const { service, prisma } = build({ rawRows: [] });
    await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 0,
    });
    const passed = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
    expect(passed.values).toContain(1);
  });

  it('passes radiusKm × 1000 (meters) to the raw query', async () => {
    const { service, prisma } = build({ rawRows: [] });
    await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 7.5,
      limit: 5,
    });
    const passed = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
    expect(passed.values).toContain(7500);
  });

  it('attaches rating { count, average } from review.groupBy', async () => {
    const rawRows = [{ id: 'p1', distance_m: 500 }];
    const places = [makePlace('p1', 's-1')];
    const ratings = [{ placeId: 'p1', _count: { _all: 3 }, _avg: { rating: 4.566 } }];
    const { service } = build({ rawRows, places, ratings });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 10,
    });
    expect(out[0]?.rating).toEqual({ count: 3, average: 4.57 });
  });

  it('defaults rating to { count: 0, average: 0 } when no reviews', async () => {
    const rawRows = [{ id: 'p1', distance_m: 100 }];
    const places = [makePlace('p1', 's-1')];
    const { service } = build({ rawRows, places, ratings: [] });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 10,
    });
    expect(out[0]?.rating).toEqual({ count: 0, average: 0 });
  });

  it('does not skip enrichment when excludeSlug is given (filter is in SQL)', async () => {
    const rawRows = [{ id: 'p2', distance_m: 300 }];
    const places = [makePlace('p2', 's-2')];
    const { service } = build({ rawRows, places });
    const out = await service.listNearby({
      lat: 21,
      lng: 105.8,
      radiusKm: 5,
      limit: 10,
      excludeSlug: 's-1',
    });
    expect(out.map((p) => p.id)).toEqual(['p2']);
  });
});

describe('PlacesService.list', () => {
  it('paginates in Prisma and omits gallery photos from list responses', async () => {
    const place = makePlace('p1', 's-1');
    place.heroImageS3Key = 'GIA_LAI/image/hero.jpg';
    const prisma = {
      place: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...place,
            photos: undefined,
          },
        ]),
        count: jest.fn().mockResolvedValue(73),
      },
      review: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };
    const s3 = {
      getPresignedGetUrl: jest.fn().mockResolvedValue('https://signed.example/hero.jpg'),
    };
    const service = new PlacesService(prisma as unknown as PrismaService, s3 as never);

    const result = await service.list({ page: 2, pageSize: 12 } as never);

    expect(prisma.place.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'published',
          OR: [{ heroImageUrl: { not: null } }, { heroImageS3Key: { not: null } }],
        }),
        skip: 12,
        take: 12,
        include: {
          region: true,
          categories: { include: { category: true } },
        },
      }),
    );
    expect(result.meta).toEqual({ page: 2, pageSize: 12, total: 73 });
    expect(result.data[0]?.photos).toBeUndefined();
    expect(result.data[0]?.heroImageUrl).toBe('https://signed.example/hero.jpg');
  });

  it('keeps image filtering when a search query is provided', async () => {
    const prisma = {
      place: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      review: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new PlacesService(
      prisma as unknown as PrismaService,
      { getPresignedGetUrl: jest.fn() } as never,
    );

    await service.list({ q: 'Biển Hồ' } as never);

    expect(prisma.place.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ heroImageUrl: { not: null } }, { heroImageS3Key: { not: null } }],
          AND: [
            {
              OR: expect.arrayContaining([
                { titleVi: { contains: 'Biển Hồ', mode: 'insensitive' } },
                { locationKey: { contains: 'BIEN_HO', mode: 'insensitive' } },
              ]),
            },
          ],
        }),
      }),
    );
  });
});

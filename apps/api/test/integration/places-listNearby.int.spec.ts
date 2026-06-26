/**
 * Integration test cho `PlacesService.listNearby` — verify SQL ST_DWithin thật
 * trong PostGIS hoạt động đúng:
 *
 * - Trigger `place_geo_sync` cập nhật cột `geo` khi insert/update lat/lng.
 * - GIST index `Place_geo_gist_idx` không phá ordering.
 * - Bán kính tính bằng meters, ordering distance ASC.
 * - `status != 'published'` bị loại.
 * - `excludeSlug` loại đúng 1 row.
 * - Map `distanceKm` tròn 1 chữ số thập phân.
 *
 * Seed: 4 địa điểm thật xung quanh Hà Nội với khoảng cách đã biết, dùng
 * Haversine để cross-check.
 */
import { PlacesService } from '../../src/places/places.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { disconnectPrisma, getPrisma, truncateAll } from './prisma-helper';

// Helper: haversine reference distance (km) for assertion sanity checks.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

describe('PlacesService.listNearby — integration (PostGIS)', () => {
  let prisma: PrismaService;
  let service: PlacesService;

  // Reference point: Hồ Hoàn Kiếm.
  const ORIGIN = { lat: 21.0285, lng: 105.8542 };

  beforeAll(async () => {
    prisma = getPrisma() as PrismaService;
    service = new PlacesService(prisma);
  });

  beforeEach(async () => {
    await truncateAll();

    // 1 region.
    const region = await prisma.region.create({
      data: { slug: 'mien-bac', nameVi: 'Miền Bắc', nameEn: 'North' },
    });

    // 4 places: Hoàn Kiếm (~0km), Lăng Bác (~2km), Hồ Tây (~5km), Hạ Long (~150km).
    const seed = [
      { slug: 'ho-hoan-kiem', titleVi: 'Hồ Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
      { slug: 'lang-bac', titleVi: 'Lăng Chủ Tịch', lat: 21.0368, lng: 105.8345 },
      { slug: 'ho-tay', titleVi: 'Hồ Tây', lat: 21.0589, lng: 105.8205 },
      { slug: 'vinh-ha-long', titleVi: 'Vịnh Hạ Long', lat: 20.9101, lng: 107.1839 },
    ];
    for (const p of seed) {
      await prisma.place.create({
        data: {
          slug: p.slug,
          titleVi: p.titleVi,
          titleEn: null,
          summaryVi: 'sum',
          regionId: region.id,
          lat: p.lat,
          lng: p.lng,
          status: 'published',
          heroImageUrl: `https://images.example/${p.slug}.jpg`,
        },
      });
    }

    // 1 draft place very close to origin — phải bị loại khỏi result.
    await prisma.place.create({
      data: {
        slug: 'draft-place',
        titleVi: 'Draft',
        summaryVi: 'sum',
        regionId: region.id,
        lat: 21.029,
        lng: 105.855,
        status: 'draft',
      },
    });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('trả các place trong bán kính, đã sắp theo distance ASC', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 10, limit: 10 });
    expect(out.map((p) => p.slug)).toEqual(['ho-hoan-kiem', 'lang-bac', 'ho-tay']);
    expect(out[0]?.distanceKm).toBeLessThan(0.1);
    expect(out[1]?.distanceKm).toBeGreaterThan(out[0]!.distanceKm);
    expect(out[2]?.distanceKm).toBeGreaterThan(out[1]!.distanceKm);
  });

  it('khoảng cách trả về (km, 1dp) sai số <2% so với Haversine reference cho điểm >5km', async () => {
    // Với điểm gần (<5km) tròn 1 chữ số sau dấu phẩy gây relative error lớn
    // (vd 0.054→0.1), nên chỉ kiểm với điểm xa hơn. PostGIS ST_Distance dùng
    // WGS84 spheroid chính xác hơn Haversine sphere — chênh tuyệt đối có thể
    // lên 0.2-0.3km trên 150km. Test này verify cùng order of magnitude.
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 200, limit: 10 });
    for (const p of out) {
      const expected = haversineKm(ORIGIN.lat, ORIGIN.lng, p.geo!.lat, p.geo!.lng);
      if (expected < 5) continue;
      const relErr = Math.abs(p.distanceKm - expected) / expected;
      expect(relErr).toBeLessThan(0.02);
    }
  });

  it('loại bỏ place có status != "published"', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 1, limit: 10 });
    expect(out.map((p) => p.slug)).not.toContain('draft-place');
  });

  it('respect radiusKm — bán kính 3km không trả Hồ Tây (5km) hay Hạ Long', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 3, limit: 10 });
    const slugs = out.map((p) => p.slug);
    expect(slugs).toContain('ho-hoan-kiem');
    expect(slugs).toContain('lang-bac');
    expect(slugs).not.toContain('ho-tay');
    expect(slugs).not.toContain('vinh-ha-long');
  });

  it('respect bán kính lớn (200km) — Hạ Long được trả ở cuối list', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 200, limit: 10 });
    expect(out.map((p) => p.slug)).toEqual([
      'ho-hoan-kiem',
      'lang-bac',
      'ho-tay',
      'vinh-ha-long',
    ]);
    expect(out[3]?.distanceKm).toBeGreaterThan(100);
    expect(out[3]?.distanceKm).toBeLessThan(200);
  });

  it('excludeSlug loại đúng 1 row khỏi result', async () => {
    const out = await service.listNearby({
      ...ORIGIN,
      radiusKm: 10,
      limit: 10,
      excludeSlug: 'ho-hoan-kiem',
    });
    expect(out.map((p) => p.slug)).toEqual(['lang-bac', 'ho-tay']);
  });

  it('respect limit', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 200, limit: 2 });
    expect(out).toHaveLength(2);
    expect(out.map((p) => p.slug)).toEqual(['ho-hoan-kiem', 'lang-bac']);
  });

  it('clamp limit 0 → 1', async () => {
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 200, limit: 0 });
    expect(out).toHaveLength(1);
    expect(out[0]?.slug).toBe('ho-hoan-kiem');
  });

  it('trả [] khi không có place nào trong bán kính', async () => {
    const farAway = { lat: 0, lng: 0 };
    const out = await service.listNearby({ ...farAway, radiusKm: 100, limit: 10 });
    expect(out).toEqual([]);
  });

  it('trigger place_geo_sync cập nhật geo khi update lat/lng', async () => {
    // Update Hồ Hoàn Kiếm → Đà Nẵng (xa origin).
    await prisma.place.update({
      where: { slug: 'ho-hoan-kiem' },
      data: { lat: 16.0544, lng: 108.2022 },
    });
    const out = await service.listNearby({ ...ORIGIN, radiusKm: 3, limit: 10 });
    expect(out.map((p) => p.slug)).not.toContain('ho-hoan-kiem');
  });
});

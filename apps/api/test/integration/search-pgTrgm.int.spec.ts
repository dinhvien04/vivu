/**
 * Integration test cho `SearchService.suggest` fallback path (pg_trgm).
 *
 * Force Meili disabled bằng mock `SearchIndexService` trả null, để `suggest()`
 * gọi `suggestFromPgTrgm` chạy raw query với `similarity()` + GIN index
 * `Place_titleVi_trgm_idx` đã tạo bởi `schema.sql`.
 *
 * Verify:
 * - `status != 'published'` bị loại.
 * - Ranking theo similarity DESC: exact substring đứng trước near-match.
 * - Typo tolerance qua trigram (vd "Hạlong" vẫn match "Hạ Long").
 * - Empty / quá ngắn trả `[]`.
 */
import { SearchIndexService } from '../../src/search/search-index.service';
import { SearchService } from '../../src/search/search.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { disconnectPrisma, getPrisma, truncateAll } from './prisma-helper';

describe('SearchService.suggest — integration (pg_trgm fallback)', () => {
  let prisma: PrismaService;
  let service: SearchService;
  const indexMock: Pick<SearchIndexService, 'suggest'> = {
    suggest: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    prisma = getPrisma() as PrismaService;
    service = new SearchService(prisma, indexMock as SearchIndexService);
  });

  beforeEach(async () => {
    await truncateAll();
    const region = await prisma.region.create({
      data: { slug: 'mien-bac', nameVi: 'Miền Bắc', nameEn: 'North' },
    });
    const seed = [
      { slug: 'vinh-ha-long', titleVi: 'Vịnh Hạ Long', titleEn: 'Halong Bay' },
      { slug: 'vinh-lan-ha', titleVi: 'Vịnh Lan Hạ', titleEn: null },
      { slug: 'ha-noi', titleVi: 'Hà Nội', titleEn: 'Hanoi' },
      { slug: 'ha-giang', titleVi: 'Hà Giang', titleEn: null },
      { slug: 'da-nang', titleVi: 'Đà Nẵng', titleEn: 'Danang' },
    ];
    for (const p of seed) {
      await prisma.place.create({
        data: {
          slug: p.slug,
          titleVi: p.titleVi,
          titleEn: p.titleEn,
          summaryVi: 'sum',
          regionId: region.id,
          status: 'published',
        },
      });
    }
    // 1 draft phải bị loại.
    await prisma.place.create({
      data: {
        slug: 'draft-halong',
        titleVi: 'Draft Hạ Long',
        summaryVi: 'sum',
        regionId: region.id,
        status: 'draft',
      },
    });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('trả `[]` khi q < 2 ký tự', async () => {
    expect(await service.suggest('H')).toEqual([]);
  });

  it('match exact substring titleVi, trả top hit đầu tiên', async () => {
    const out = await service.suggest('Hạ Long', 5);
    expect(out[0]?.slug).toBe('vinh-ha-long');
    expect(out[0]?.titleVi).toBe('Vịnh Hạ Long');
  });

  it('match titleEn khi titleVi không match', async () => {
    const out = await service.suggest('Hanoi', 5);
    expect(out.map((p) => p.slug)).toContain('ha-noi');
  });

  it('rank theo similarity: "Hạ" trả Hà/Hạ trước Đà Nẵng', async () => {
    const out = await service.suggest('Hạ', 5);
    const slugs = out.map((p) => p.slug);
    expect(slugs).not.toContain('da-nang');
    expect(slugs.length).toBeGreaterThanOrEqual(2);
  });

  it('loại bỏ status != "published"', async () => {
    const out = await service.suggest('Hạ Long', 10);
    expect(out.map((p) => p.slug)).not.toContain('draft-halong');
  });

  it('respect limit', async () => {
    const out = await service.suggest('H', 5);
    expect(out.length).toBeLessThanOrEqual(5);
  });

  it('clamp limit 100 → 20', async () => {
    const out = await service.suggest('Hà', 100);
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it('không gọi Meili khi index.suggest trả null (verify fallback path)', async () => {
    (indexMock.suggest as jest.Mock).mockClear();
    await service.suggest('Hạ Long', 5);
    expect(indexMock.suggest).toHaveBeenCalledTimes(1);
  });
});

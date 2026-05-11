import { SearchService } from './search.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { SearchIndexService } from './search-index.service';

interface MockPrisma {
  $queryRaw: jest.Mock;
}
interface MockIndex {
  suggest: jest.Mock;
}

function build(overrides: Partial<{ rawResult: unknown[]; meiliResult: unknown }> = {}) {
  const prisma: MockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue(overrides.rawResult ?? []),
  };
  const index: MockIndex = {
    suggest: jest.fn().mockResolvedValue(overrides.meiliResult ?? null),
  };
  const service = new SearchService(
    prisma as unknown as PrismaService,
    index as unknown as SearchIndexService,
  );
  return { service, prisma, index };
}

describe('SearchService.suggest', () => {
  it('returns [] when query is shorter than 2 chars', async () => {
    const { service, prisma, index } = build();
    expect(await service.suggest('a')).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(index.suggest).not.toHaveBeenCalled();
  });

  it('returns [] when query is only whitespace', async () => {
    const { service, prisma, index } = build();
    expect(await service.suggest('   ')).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(index.suggest).not.toHaveBeenCalled();
  });

  it('trims whitespace before length check (3 spaces + "ha" → length 2 passes)', async () => {
    const { service, index } = build();
    await service.suggest('   ha');
    expect(index.suggest).toHaveBeenCalledWith('ha', expect.any(Number));
  });

  it('returns Meili result directly when non-null (no DB call)', async () => {
    const meiliHit = [
      {
        id: 'p1',
        slug: 'p-1',
        titleVi: 'Núi Bà Đen',
        titleEn: null,
        address: null,
        heroImageUrl: null,
      },
    ];
    const { service, prisma, index } = build({ meiliResult: meiliHit });
    const out = await service.suggest('Núi');
    expect(out).toEqual(meiliHit);
    expect(index.suggest).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('falls back to pg_trgm when Meili returns null', async () => {
    const pgRows = [
      {
        id: 'p2',
        slug: 'p-2',
        titleVi: 'Vịnh Hạ Long',
        titleEn: 'Halong Bay',
        address: 'Quảng Ninh',
        heroImageUrl: null,
      },
    ];
    const { service, prisma, index } = build({ meiliResult: null, rawResult: pgRows });
    const out = await service.suggest('Hạ');
    expect(out).toEqual(pgRows);
    expect(index.suggest).toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('falls back to pg_trgm and returns empty when DB has no matches', async () => {
    const { service, prisma } = build({ meiliResult: null, rawResult: [] });
    expect(await service.suggest('zzzzz')).toEqual([]);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('uses default limit=8 when not provided', async () => {
    const { service, index } = build({ meiliResult: [] });
    await service.suggest('Sài');
    expect(index.suggest).toHaveBeenCalledWith('Sài', 8);
  });

  it('respects an explicit limit when in range', async () => {
    const { service, index } = build({ meiliResult: [] });
    await service.suggest('Sài', 5);
    expect(index.suggest).toHaveBeenCalledWith('Sài', 5);
  });

  it('clamps limit to a max of 20', async () => {
    const { service, index } = build({ meiliResult: [] });
    await service.suggest('Sài', 999);
    expect(index.suggest).toHaveBeenCalledWith('Sài', 20);
  });

  it('clamps limit to a min of 1', async () => {
    const { service, index } = build({ meiliResult: [] });
    await service.suggest('Sài', 0);
    expect(index.suggest).toHaveBeenCalledWith('Sài', 1);
  });

  it('clamps negative limit to 1', async () => {
    const { service, index } = build({ meiliResult: [] });
    await service.suggest('Sài', -5);
    expect(index.suggest).toHaveBeenCalledWith('Sài', 1);
  });
});

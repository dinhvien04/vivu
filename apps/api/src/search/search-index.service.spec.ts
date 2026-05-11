/**
 * Unit tests for SearchIndexService. We mock the `meilisearch` package so the
 * tests run without a real Meili instance and can exercise the disable/error
 * paths deterministically.
 */
import { MeiliSearch } from 'meilisearch';
import type { ConfigService } from '@nestjs/config';
import { SearchIndexService } from './search-index.service';
import type { PrismaService } from '../prisma/prisma.service';

jest.mock('meilisearch');

function makeConfig(map: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => map[key]),
  } as unknown as ConfigService;
}

function makeIndexMock() {
  return {
    addDocuments: jest.fn().mockResolvedValue({ taskUid: 1 }),
    deleteDocument: jest.fn().mockResolvedValue({ taskUid: 2 }),
    deleteAllDocuments: jest.fn().mockResolvedValue({ taskUid: 3 }),
    updateSettings: jest.fn().mockResolvedValue({ taskUid: 4 }),
    search: jest.fn().mockResolvedValue({ hits: [] }),
  };
}

function makeMeili(index = makeIndexMock(), createIndexResult: 'ok' | 'throw' = 'ok') {
  return {
    index: jest.fn().mockReturnValue(index),
    createIndex:
      createIndexResult === 'ok'
        ? jest.fn().mockResolvedValue({ taskUid: 0 })
        : jest.fn().mockRejectedValue(new Error('index already exists')),
  };
}

function makePrisma(place: unknown = null): PrismaService {
  return {
    place: {
      findUnique: jest.fn().mockResolvedValue(place),
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService;
}

const MeiliCtor = MeiliSearch as unknown as jest.Mock;

beforeEach(() => {
  MeiliCtor.mockReset();
});

describe('SearchIndexService — disabled (no MEILI_HOST)', () => {
  it('isEnabled() returns false', () => {
    const svc = new SearchIndexService(makeConfig({}), makePrisma());
    expect(svc.isEnabled()).toBe(false);
  });

  it('onApplicationBootstrap is a no-op', async () => {
    const svc = new SearchIndexService(makeConfig({}), makePrisma());
    await expect(svc.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(MeiliCtor).not.toHaveBeenCalled();
  });

  it('indexPlace is a no-op', async () => {
    const svc = new SearchIndexService(makeConfig({}), makePrisma());
    await expect(svc.indexPlace('p1')).resolves.toBeUndefined();
  });

  it('removePlace is a no-op', async () => {
    const svc = new SearchIndexService(makeConfig({}), makePrisma());
    await expect(svc.removePlace('p1')).resolves.toBeUndefined();
  });

  it('suggest returns null so caller can fall back', async () => {
    const svc = new SearchIndexService(makeConfig({}), makePrisma());
    expect(await svc.suggest('Hạ', 5)).toBeNull();
  });
});

describe('SearchIndexService — enabled (MEILI_HOST set)', () => {
  it('isEnabled() returns true', () => {
    MeiliCtor.mockImplementation(() => makeMeili());
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    expect(svc.isEnabled()).toBe(true);
    expect(MeiliCtor).toHaveBeenCalledWith({
      host: 'http://localhost:7700',
      apiKey: undefined,
    });
  });

  it('passes apiKey to the client when configured', () => {
    MeiliCtor.mockImplementation(() => makeMeili());
    new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700', MEILI_API_KEY: 'secret' }),
      makePrisma(),
    );
    expect(MeiliCtor).toHaveBeenCalledWith({
      host: 'http://localhost:7700',
      apiKey: 'secret',
    });
  });

  it('uses MEILI_INDEX_PLACES override when set', async () => {
    const index = makeIndexMock();
    const client = makeMeili(index);
    MeiliCtor.mockImplementation(() => client);
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700', MEILI_INDEX_PLACES: 'custom' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    expect(client.createIndex).toHaveBeenCalledWith('custom', { primaryKey: 'id' });
  });

  it('defaults index name to "places" when not configured', async () => {
    const index = makeIndexMock();
    const client = makeMeili(index);
    MeiliCtor.mockImplementation(() => client);
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    expect(client.createIndex).toHaveBeenCalledWith('places', { primaryKey: 'id' });
  });

  it('bootstrap is idempotent — only ensures index once', async () => {
    const index = makeIndexMock();
    const client = makeMeili(index);
    MeiliCtor.mockImplementation(() => client);
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    await svc.onApplicationBootstrap();
    expect(client.createIndex).toHaveBeenCalledTimes(1);
    expect(index.updateSettings).toHaveBeenCalledTimes(1);
  });

  it('updateSettings is called with the expected schema', async () => {
    const index = makeIndexMock();
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    expect(index.updateSettings).toHaveBeenCalledWith({
      searchableAttributes: ['titleVi', 'titleEn', 'address'],
      filterableAttributes: ['status', 'regionSlug'],
      sortableAttributes: ['updatedAt'],
    });
  });

  it('swallows "createIndex already exists" errors and still updates settings', async () => {
    const index = makeIndexMock();
    const client = makeMeili(index, 'throw');
    MeiliCtor.mockImplementation(() => client);
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    expect(index.updateSettings).toHaveBeenCalled();
    expect(svc.isEnabled()).toBe(true);
  });

  it('disables the client when bootstrap throws on updateSettings', async () => {
    const index = makeIndexMock();
    index.updateSettings.mockRejectedValueOnce(new Error('boom'));
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.onApplicationBootstrap();
    expect(svc.isEnabled()).toBe(false);
  });

  it('indexPlace pushes the document with toDocument shape', async () => {
    const index = makeIndexMock();
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const updatedAt = new Date('2026-04-01T00:00:00Z');
    const prisma = makePrisma({
      id: 'p1',
      slug: 'nui-ba-den',
      titleVi: 'Núi Bà Đen',
      titleEn: 'Ba Den Mountain',
      address: 'Tây Ninh',
      heroImageUrl: 'https://cdn/img.jpg',
      status: 'published',
      updatedAt,
      region: { slug: 'dong-nam-bo' },
    });
    const svc = new SearchIndexService(makeConfig({ MEILI_HOST: 'http://localhost:7700' }), prisma);
    await svc.indexPlace('p1');
    expect(index.addDocuments).toHaveBeenCalledWith(
      [
        {
          id: 'p1',
          slug: 'nui-ba-den',
          titleVi: 'Núi Bà Đen',
          titleEn: 'Ba Den Mountain',
          address: 'Tây Ninh',
          heroImageUrl: 'https://cdn/img.jpg',
          regionSlug: 'dong-nam-bo',
          status: 'published',
          updatedAt: updatedAt.getTime(),
        },
      ],
      { primaryKey: 'id' },
    );
  });

  it('indexPlace short-circuits when place not found', async () => {
    const index = makeIndexMock();
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(null),
    );
    await svc.indexPlace('missing');
    expect(index.addDocuments).not.toHaveBeenCalled();
  });

  it('indexPlace swallows Meili errors (best-effort)', async () => {
    const index = makeIndexMock();
    index.addDocuments.mockRejectedValueOnce(new Error('meili down'));
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const prisma = makePrisma({
      id: 'p1',
      slug: 's',
      titleVi: 't',
      titleEn: null,
      address: null,
      heroImageUrl: null,
      status: 'published',
      updatedAt: new Date(),
      region: { slug: 'r' },
    });
    const svc = new SearchIndexService(makeConfig({ MEILI_HOST: 'http://localhost:7700' }), prisma);
    await expect(svc.indexPlace('p1')).resolves.toBeUndefined();
  });

  it('removePlace calls deleteDocument with the id', async () => {
    const index = makeIndexMock();
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await svc.removePlace('p1');
    expect(index.deleteDocument).toHaveBeenCalledWith('p1');
  });

  it('removePlace swallows Meili errors', async () => {
    const index = makeIndexMock();
    index.deleteDocument.mockRejectedValueOnce(new Error('500'));
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    await expect(svc.removePlace('p1')).resolves.toBeUndefined();
  });

  it('suggest filters to status=published and maps hits to public shape', async () => {
    const index = makeIndexMock();
    index.search.mockResolvedValueOnce({
      hits: [
        {
          id: 'p1',
          slug: 's-1',
          titleVi: 'A',
          titleEn: null,
          address: null,
          heroImageUrl: null,
          extraNoise: 'should-be-stripped',
        },
      ],
    });
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    const out = await svc.suggest('A', 5);
    expect(index.search).toHaveBeenCalledWith(
      'A',
      expect.objectContaining({
        limit: 5,
        filter: ['status = published'],
      }),
    );
    expect(out).toEqual([
      {
        id: 'p1',
        slug: 's-1',
        titleVi: 'A',
        titleEn: null,
        address: null,
        heroImageUrl: null,
      },
    ]);
  });

  it('suggest returns null on Meili error so caller falls back', async () => {
    const index = makeIndexMock();
    index.search.mockRejectedValueOnce(new Error('connection refused'));
    MeiliCtor.mockImplementation(() => makeMeili(index));
    const svc = new SearchIndexService(
      makeConfig({ MEILI_HOST: 'http://localhost:7700' }),
      makePrisma(),
    );
    expect(await svc.suggest('Hạ', 5)).toBeNull();
  });
});

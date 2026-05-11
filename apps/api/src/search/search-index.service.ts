import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, type Index } from 'meilisearch';
import type { Place as PrismaPlace } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface IndexedPlace {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  address: string | null;
  heroImageUrl: string | null;
  regionSlug: string | null;
  status: string;
  updatedAt: number;
}

/**
 * Manages the MeiliSearch `places` index. Wraps the official client and
 * exposes idempotent methods used by admin-places mutations and the public
 * /search/suggest endpoint.
 *
 * If `MEILI_HOST` is unset (e.g. in a snapshot without docker-compose), the
 * service short-circuits to no-ops so the API still boots — search falls
 * back to the pg_trgm path inside SearchService.
 */
@Injectable()
export class SearchIndexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchIndexService.name);
  private readonly indexName: string;
  private client: MeiliSearch | null = null;
  private bootstrapped = false;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.indexName = config.get<string>('MEILI_INDEX_PLACES') ?? 'places';
    const host = config.get<string>('MEILI_HOST');
    const apiKey = config.get<string>('MEILI_API_KEY');
    if (host) {
      this.client = new MeiliSearch({ host, apiKey });
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Lazily ensure the index exists and has the right settings. Idempotent —
   * safe to call from `onApplicationBootstrap` and from `reindexAll`.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.client || this.bootstrapped) return;
    try {
      await this.ensureIndex();
      this.bootstrapped = true;
    } catch (e) {
      // Don't crash the app if Meili is unreachable — log and disable.
      this.logger.warn(`MeiliSearch bootstrap failed (${(e as Error).message}); disabling.`);
      this.client = null;
    }
  }

  private async getIndex(): Promise<Index | null> {
    if (!this.client) return null;
    try {
      return this.client.index(this.indexName);
    } catch {
      return null;
    }
  }

  private async ensureIndex(): Promise<void> {
    if (!this.client) return;
    const index = this.client.index(this.indexName);
    // Ensure the index exists. createIndex is idempotent if the index already
    // exists (it returns an error which we swallow).
    try {
      await this.client.createIndex(this.indexName, { primaryKey: 'id' });
    } catch {
      /* index already exists */
    }
    await index.updateSettings({
      searchableAttributes: ['titleVi', 'titleEn', 'address'],
      filterableAttributes: ['status', 'regionSlug'],
      sortableAttributes: ['updatedAt'],
    });
  }

  private toDocument(place: PrismaPlace & { region?: { slug: string } | null }): IndexedPlace {
    return {
      id: place.id,
      slug: place.slug,
      titleVi: place.titleVi,
      titleEn: place.titleEn,
      address: place.address,
      heroImageUrl: place.heroImageUrl,
      regionSlug: place.region?.slug ?? null,
      status: place.status,
      updatedAt: place.updatedAt.getTime(),
    };
  }

  /** Push a single place document to the index. Best-effort. */
  async indexPlace(placeId: string): Promise<void> {
    const index = await this.getIndex();
    if (!index) return;
    try {
      const place = await this.prisma.place.findUnique({
        where: { id: placeId },
        include: { region: true },
      });
      if (!place) return;
      await index.addDocuments([this.toDocument(place)], { primaryKey: 'id' });
    } catch (e) {
      this.logger.warn(`MeiliSearch indexPlace(${placeId}) failed: ${(e as Error).message}`);
    }
  }

  /** Remove a single place from the index. Best-effort. */
  async removePlace(placeId: string): Promise<void> {
    const index = await this.getIndex();
    if (!index) return;
    try {
      await index.deleteDocument(placeId);
    } catch (e) {
      this.logger.warn(`MeiliSearch removePlace(${placeId}) failed: ${(e as Error).message}`);
    }
  }

  /**
   * Typeahead search via Meili. Returns null when Meili is disabled or
   * unreachable, so the caller can fall back to pg_trgm.
   */
  async suggest(
    q: string,
    limit: number,
  ): Promise<Array<{
    id: string;
    slug: string;
    titleVi: string;
    titleEn: string | null;
    address: string | null;
    heroImageUrl: string | null;
  }> | null> {
    const index = await this.getIndex();
    if (!index) return null;
    try {
      const result = await index.search<IndexedPlace>(q, {
        limit,
        filter: ['status = published'],
        attributesToRetrieve: ['id', 'slug', 'titleVi', 'titleEn', 'address', 'heroImageUrl'],
      });
      return result.hits.map((h) => ({
        id: h.id,
        slug: h.slug,
        titleVi: h.titleVi,
        titleEn: h.titleEn,
        address: h.address,
        heroImageUrl: h.heroImageUrl,
      }));
    } catch (e) {
      this.logger.warn(`MeiliSearch suggest failed: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Full rebuild: clear the index then push every `published` place. Useful
   * after migrating data or changing the document schema. Run with
   * `pnpm --filter @vivu/api ts-node prisma/reindex-meili.ts` (separate
   * script, not exposed via HTTP).
   */
  async reindexAll(): Promise<{ indexed: number } | null> {
    const index = await this.getIndex();
    if (!index) return null;
    await this.ensureIndex();
    const places = await this.prisma.place.findMany({
      where: { status: 'published' },
      include: { region: true },
    });
    if (places.length === 0) {
      await index.deleteAllDocuments();
      return { indexed: 0 };
    }
    await index.deleteAllDocuments();
    await index.addDocuments(
      places.map((p) => this.toDocument(p)),
      { primaryKey: 'id' },
    );
    return { indexed: places.length };
  }
}

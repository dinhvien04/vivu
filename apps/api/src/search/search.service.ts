import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLIC_PROVINCE } from '../common/public-scope';
import { PrismaService } from '../prisma/prisma.service';
import { SearchIndexService } from './search-index.service';

export interface SuggestPlace {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  address: string | null;
  heroImageUrl: string | null;
}

interface SuggestRow {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string | null;
  address: string | null;
  heroImageUrl: string | null;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly index: SearchIndexService,
  ) {}

  /**
   * Typeahead suggestions. If MeiliSearch is configured + reachable, ranks
   * via Meili (typo-tolerant, weighted). Otherwise falls back to pg_trgm
   * `similarity()` ranking + ILIKE matching using the
   * `Place_titleVi_trgm_idx` GIN index.
   *
   * Always restricts to `status = 'published'` and returns a small projection
   * (no relations) — caller renders dropdown rows so we keep the payload
   * lightweight.
   */
  async suggest(q: string, limit = 8): Promise<SuggestPlace[]> {
    const trimmed = q.trim();
    if (trimmed.length < 2) return [];

    const safeLimit = Math.min(Math.max(limit, 1), 20);

    const fromMeili = await this.index.suggest(trimmed, safeLimit);
    if (fromMeili !== null) return fromMeili;

    return this.suggestFromPgTrgm(trimmed, safeLimit);
  }

  private async suggestFromPgTrgm(trimmed: string, safeLimit: number): Promise<SuggestPlace[]> {
    const pattern = `%${trimmed}%`;
    const rows = await this.prisma.$queryRaw<SuggestRow[]>(Prisma.sql`
      SELECT
        "id",
        "slug",
        "titleVi",
        "titleEn",
        "address",
        "heroImageUrl"
      FROM "Place"
      WHERE "status"::text = 'published'
        AND LOWER("province") = LOWER(${PUBLIC_PROVINCE})
        AND ("heroImageUrl" IS NOT NULL OR "heroImageS3Key" IS NOT NULL)
        AND (
          "titleVi" ILIKE ${pattern}
          OR COALESCE("titleEn", '') ILIKE ${pattern}
        )
      ORDER BY
        GREATEST(
          similarity("titleVi", ${trimmed}),
          similarity(COALESCE("titleEn", ''), ${trimmed})
        ) DESC,
        "updatedAt" DESC
      LIMIT ${safeLimit}
    `);

    return rows;
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Typeahead suggestions. Uses pg_trgm `similarity()` to rank — the
   * `Place_titleVi_trgm_idx` GIN index makes this fast even on the title
   * column. Falls back implicitly to ILIKE-style matching when trigram
   * similarity is zero (e.g. very short queries).
   *
   * Always restricts to `status = 'published'` and returns a small projection
   * (no relations) — caller renders dropdown rows so we keep the payload
   * lightweight.
   */
  async suggest(q: string, limit = 8): Promise<SuggestPlace[]> {
    const trimmed = q.trim();
    if (trimmed.length < 2) return [];

    const safeLimit = Math.min(Math.max(limit, 1), 20);
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

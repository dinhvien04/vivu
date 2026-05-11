import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Place as PrismaPlace,
  Photo as PrismaPhoto,
  Region as PrismaRegion,
} from '@prisma/client';
import type { Paginated, Place } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

type PlaceWithRelations = PrismaPlace & {
  region: PrismaRegion;
  photos: PrismaPhoto[];
  categories: {
    category: { id: string; slug: string; nameVi: string; nameEn: string; icon: string | null };
  }[];
};

function toApiPlace(p: PlaceWithRelations): Place {
  return {
    id: p.id,
    slug: p.slug,
    titleVi: p.titleVi,
    titleEn: p.titleEn,
    summaryVi: p.summaryVi,
    summaryEn: p.summaryEn,
    descriptionVi: p.descriptionVi,
    descriptionEn: p.descriptionEn,
    regionId: p.regionId,
    region: {
      id: p.region.id,
      slug: p.region.slug,
      nameVi: p.region.nameVi,
      nameEn: p.region.nameEn,
      parentId: p.region.parentId,
    },
    address: p.address,
    geo: p.lat !== null && p.lng !== null ? { lat: p.lat, lng: p.lng } : null,
    bestSeasons: p.bestSeasons,
    status: p.status,
    heroImageUrl: p.heroImageUrl,
    photos: p.photos.map((ph) => ({
      id: ph.id,
      url: ph.url,
      publicId: ph.publicId,
      width: ph.width,
      height: ph.height,
      alt: ph.alt,
      position: ph.position,
      isCover: ph.isCover,
    })),
    categories: p.categories.map((c) => ({
      id: c.category.id,
      slug: c.category.slug,
      nameVi: c.category.nameVi,
      nameEn: c.category.nameEn,
      icon: c.category.icon,
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPlacesQueryDto): Promise<Paginated<Place>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PlaceWhereInput = {
      status: 'published',
    };

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { titleVi: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { summaryVi: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.region) {
      where.region = { slug: query.region };
    }

    if (query.category) {
      where.categories = {
        some: { category: { slug: query.category } },
      };
    }

    if (query.season) {
      where.bestSeasons = { has: query.season };
    }

    const orderBy: Prisma.PlaceOrderByWithRelationInput =
      query.sort === 'name' ? { titleVi: 'asc' } : { updatedAt: 'desc' };

    // Fetch the rows for the page (pre-rating filter) then aggregate ratings + apply minRating.
    const rows = await this.prisma.place.findMany({
      where,
      orderBy,
      include: {
        region: true,
        photos: { orderBy: { position: 'asc' } },
        categories: { include: { category: true } },
      },
    });

    const placeIds = rows.map((p) => p.id);
    const ratingByPlaceId = new Map<string, { count: number; average: number }>();
    if (placeIds.length > 0) {
      const grouped = await this.prisma.review.groupBy({
        by: ['placeId'],
        where: { placeId: { in: placeIds }, status: 'visible' },
        _count: { _all: true },
        _avg: { rating: true },
      });
      for (const g of grouped) {
        ratingByPlaceId.set(g.placeId, {
          count: g._count._all,
          average: g._avg.rating ? Math.round(g._avg.rating * 100) / 100 : 0,
        });
      }
    }

    let enriched = rows.map((p) => {
      const out = toApiPlace(p as PlaceWithRelations);
      out.rating = ratingByPlaceId.get(p.id) ?? { count: 0, average: 0 };
      return out;
    });

    if (query.minRating !== undefined) {
      const threshold = query.minRating;
      enriched = enriched.filter((p) => (p.rating?.average ?? 0) >= threshold);
    }

    const total = enriched.length;
    const paged = enriched.slice(skip, skip + pageSize);

    return {
      data: paged,
      meta: { page, pageSize, total },
    };
  }

  async findBySlug(slug: string): Promise<Place | null> {
    const place = await this.prisma.place.findUnique({
      where: { slug },
      include: {
        region: true,
        photos: { orderBy: { position: 'asc' } },
        categories: { include: { category: true } },
      },
    });

    if (!place || place.status !== 'published') {
      return null;
    }

    const agg = await this.prisma.review.aggregate({
      where: { placeId: place.id, status: 'visible' },
      _count: { _all: true },
      _avg: { rating: true },
    });
    const out = toApiPlace(place as PlaceWithRelations);
    out.rating = {
      count: agg._count._all,
      average: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
    };
    return out;
  }

  /**
   * Return places near a coordinate using PostGIS `ST_DWithin` over the
   * `geo geography(Point, 4326)` column (kept in sync with lat/lng by the
   * `place_geo_sync` trigger declared in schema.sql). The GIST index
   * `Place_geo_gist_idx` makes radius filtering fast even on large datasets.
   * `excludeSlug` lets the place-detail page exclude itself from results.
   */
  async listNearby(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    limit: number;
    excludeSlug?: string;
  }): Promise<Array<Place & { distanceKm: number }>> {
    const { lat, lng, radiusKm, limit, excludeSlug } = params;
    const radiusMeters = radiusKm * 1000;
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const excludeFilter =
      excludeSlug !== undefined ? Prisma.sql`AND "slug" <> ${excludeSlug}` : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<Array<{ id: string; distance_m: number }>>(Prisma.sql`
      SELECT
        "id",
        ST_Distance(
          "geo",
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM "Place"
      WHERE "status"::text = 'published'
        AND "geo" IS NOT NULL
        AND ST_DWithin(
          "geo",
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${excludeFilter}
      ORDER BY distance_m ASC
      LIMIT ${safeLimit}
    `);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const distanceById = new Map<string, number>();
    for (const r of rows) {
      distanceById.set(r.id, Number(r.distance_m) / 1000);
    }

    const places = await this.prisma.place.findMany({
      where: { id: { in: ids } },
      include: {
        region: true,
        photos: { orderBy: { position: 'asc' } },
        categories: { include: { category: true } },
      },
    });

    const grouped = await this.prisma.review.groupBy({
      by: ['placeId'],
      where: { placeId: { in: ids }, status: 'visible' },
      _count: { _all: true },
      _avg: { rating: true },
    });
    const ratingByPlaceId = new Map<string, { count: number; average: number }>();
    for (const g of grouped) {
      ratingByPlaceId.set(g.placeId, {
        count: g._count._all,
        average: g._avg.rating ? Math.round(g._avg.rating * 100) / 100 : 0,
      });
    }

    // Reorder by the distance returned from the raw query (Prisma findMany
    // does not preserve `IN (...)` order).
    const placeById = new Map(places.map((p) => [p.id, p]));
    const ordered = ids
      .map((id) => placeById.get(id))
      .filter((p): p is (typeof places)[number] => p !== undefined);

    return ordered.map((place) => {
      const api = toApiPlace(place as PlaceWithRelations);
      api.rating = ratingByPlaceId.get(place.id) ?? { count: 0, average: 0 };
      const distanceKm = distanceById.get(place.id) ?? 0;
      return { ...api, distanceKm: Math.round(distanceKm * 10) / 10 };
    });
  }
}

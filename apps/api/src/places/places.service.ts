import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Place as PrismaPlace,
  Photo as PrismaPhoto,
  Region as PrismaRegion,
} from '@prisma/client';
import type { Paginated, Place, PlaceImage } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

type PlaceWithRelations = PrismaPlace & {
  region: PrismaRegion;
  photos: PrismaPhoto[];
  categories: {
    category: { id: string; slug: string; nameVi: string; nameEn: string; icon: string | null };
  }[];
};

const PUBLIC_PROVINCE = 'Gia Lai';

function toApiPlace(p: PlaceWithRelations): Place {
  return {
    id: p.id,
    locationKey: p.locationKey,
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
    province: p.province,
    aliases: p.aliases,
    address: p.address,
    geo: p.lat !== null && p.lng !== null ? { lat: p.lat, lng: p.lng } : null,
    bestSeasons: p.bestSeasons,
    status: p.status,
    heroImageUrl: p.heroImageUrl,
    heroImageS3Key: p.heroImageS3Key,
    qdrantPlaceSlug: p.qdrantPlaceSlug,
    isAiReady: p.isAiReady,
    photos: p.photos.map((ph) => ({
      id: ph.id,
      url: ph.url,
      s3Key: ph.s3Key,
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

function isS3Url(value: string): boolean {
  return value.startsWith('s3://');
}

function appendWhereAnd(where: Prisma.PlaceWhereInput, condition: Prisma.PlaceWhereInput): void {
  const current = where.AND;
  const conditions = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...conditions, condition];
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async list(query: ListPlacesQueryDto): Promise<Paginated<Place>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PlaceWhereInput = {
      status: 'published',
      province: { equals: PUBLIC_PROVINCE, mode: 'insensitive' },
    };

    if (query.hasHeroImage === false) {
      appendWhereAnd(where, { heroImageUrl: null, heroImageS3Key: null });
    } else {
      appendWhereAnd(where, {
        OR: [{ heroImageUrl: { not: null } }, { heroImageS3Key: { not: null } }],
      });
    }

    if (query.q) {
      const q = query.q.trim();
      const locationKeyQuery = q
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/đ/gi, 'd')
        .replace(/[^\p{L}\p{N}]+/gu, '_')
        .toUpperCase();
      appendWhereAnd(where, {
        OR: [
          { titleVi: { contains: q, mode: 'insensitive' } },
          { titleEn: { contains: q, mode: 'insensitive' } },
          { locationKey: { contains: locationKeyQuery, mode: 'insensitive' } },
        ],
      });
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

    if (query.hasGeo === true) {
      appendWhereAnd(where, { lat: { not: null }, lng: { not: null } });
    } else if (query.hasGeo === false) {
      appendWhereAnd(where, { OR: [{ lat: null }, { lng: null }] });
    }

    const orderBy: Prisma.PlaceOrderByWithRelationInput =
      query.sort === 'name' ? { titleVi: 'asc' } : { updatedAt: 'desc' };

    const filtersByRating = query.minRating !== undefined;
    const [rows, unfilteredTotal] = await Promise.all([
      this.prisma.place.findMany({
        where,
        orderBy,
        skip: filtersByRating ? undefined : skip,
        take: filtersByRating ? undefined : pageSize,
        include: {
          region: true,
          categories: { include: { category: true } },
        },
      }),
      filtersByRating ? Promise.resolve(0) : this.prisma.place.count({ where }),
    ]);

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

    let enriched = await Promise.all(
      rows.map(async (p) => {
        const out = toApiPlace({ ...p, photos: [] } as PlaceWithRelations);
        out.photos = undefined;
        out.rating = ratingByPlaceId.get(p.id) ?? { count: 0, average: 0 };
        return this.withPresignedMedia(out);
      }),
    );

    if (query.minRating !== undefined) {
      const threshold = query.minRating;
      enriched = enriched.filter((p) => (p.rating?.average ?? 0) >= threshold);
    }

    const total = filtersByRating ? enriched.length : unfilteredTotal;
    const paged = filtersByRating ? enriched.slice(skip, skip + pageSize) : enriched;

    return {
      data: paged,
      meta: { page, pageSize, total },
    };
  }

  async findBySlug(slug: string): Promise<Place | null> {
    const [place, agg] = await Promise.all([
      this.prisma.place.findUnique({
        where: { slug },
        include: {
          region: true,
          photos: { orderBy: { position: 'asc' } },
          categories: { include: { category: true } },
        },
      }),
      this.prisma.review.aggregate({
        where: {
          status: 'visible',
          place: {
            slug,
            status: 'published',
            province: { equals: PUBLIC_PROVINCE, mode: 'insensitive' },
          },
        },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);

    if (
      !place ||
      place.status !== 'published' ||
      place.province.toLocaleLowerCase('vi') !== PUBLIC_PROVINCE.toLocaleLowerCase('vi')
    ) {
      return null;
    }

    const out = toApiPlace(place as PlaceWithRelations);
    out.rating = {
      count: agg._count._all,
      average: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
    };
    return this.withPresignedMedia(out);
  }

  async listImages(slug: string): Promise<PlaceImage[] | null> {
    const place = await this.prisma.place.findUnique({
      where: { slug },
      select: {
        status: true,
        province: true,
        titleVi: true,
        heroImageS3Key: true,
        photos: {
          where: { s3Key: { not: null } },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            s3Key: true,
            alt: true,
            position: true,
            isCover: true,
          },
        },
      },
    });

    if (
      !place ||
      place.status !== 'published' ||
      place.province.toLocaleLowerCase('vi') !== PUBLIC_PROVINCE.toLocaleLowerCase('vi')
    ) {
      return null;
    }

    const images = new Map<string, PlaceImage>();
    const addImage = async (params: {
      id: string;
      s3Key: string;
      alt: string | null;
      position: number;
      isCover: boolean;
    }) => {
      if (images.has(params.s3Key)) return;
      images.set(params.s3Key, {
        id: params.id,
        s3Key: params.s3Key,
        url: await this.s3.getPresignedGetUrl(params.s3Key),
        alt: params.alt,
        position: params.position,
        isCover: params.isCover,
      });
    };

    if (place.heroImageS3Key) {
      await addImage({
        id: 'hero',
        s3Key: place.heroImageS3Key,
        alt: place.titleVi,
        position: -1,
        isCover: true,
      });
    }

    for (const photo of place.photos) {
      if (!photo.s3Key) continue;
      await addImage({
        id: photo.id,
        s3Key: photo.s3Key,
        alt: photo.alt,
        position: photo.position,
        isCover: photo.isCover,
      });
    }

    return [...images.values()].sort((a, b) => a.position - b.position);
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
        AND LOWER("province") = LOWER(${PUBLIC_PROVINCE})
        AND ("heroImageUrl" IS NOT NULL OR "heroImageS3Key" IS NOT NULL)
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

    return Promise.all(
      ordered.map(async (place) => {
        const api = toApiPlace(place as PlaceWithRelations);
        api.rating = ratingByPlaceId.get(place.id) ?? { count: 0, average: 0 };
        const distanceKm = distanceById.get(place.id) ?? 0;
        const out = await this.withPresignedMedia(api);
        return { ...out, distanceKm: Math.round(distanceKm * 10) / 10 };
      }),
    );
  }

  private async withPresignedMedia(place: Place): Promise<Place> {
    const next: Place = {
      ...place,
      photos: place.photos ? [...place.photos] : place.photos,
    };

    if (!next.heroImageUrl && next.heroImageS3Key) {
      next.heroImageUrl = await this.s3.getPresignedGetUrl(next.heroImageS3Key);
    }

    if (next.photos) {
      next.photos = await Promise.all(
        next.photos.map(async (photo) => {
          if (!photo.s3Key || !isS3Url(photo.url)) return photo;
          return {
            ...photo,
            url: await this.s3.getPresignedGetUrl(photo.s3Key),
          };
        }),
      );
    }

    return next;
  }
}

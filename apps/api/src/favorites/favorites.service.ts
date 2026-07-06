import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Place as PrismaPlace,
  Photo as PrismaPhoto,
  Region as PrismaRegion,
} from '@prisma/client';
import type { Place } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';

type PlaceWithRelations = PrismaPlace & {
  region: PrismaRegion;
  photos: PrismaPhoto[];
};

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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function isS3Url(value: string): boolean {
  return value.startsWith('s3://');
}

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async add(userId: string, placeId: string): Promise<{ favorited: true }> {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');

    try {
      await this.prisma.favorite.create({
        data: { userId, placeId },
      });
    } catch (e) {
      // Unique constraint = already favorited; treat as idempotent
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return { favorited: true };
      }
      throw e;
    }
    return { favorited: true };
  }

  async remove(userId: string, placeId: string): Promise<void> {
    try {
      await this.prisma.favorite.delete({
        where: { userId_placeId: { userId, placeId } },
      });
    } catch (e) {
      // Not found = treat as idempotent (already not a favorite)
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return;
      }
      throw e;
    }
  }

  async status(userId: string, placeId: string): Promise<{ favorited: boolean }> {
    const row = await this.prisma.favorite.findUnique({
      where: { userId_placeId: { userId, placeId } },
      select: { userId: true },
    });
    return { favorited: row !== null };
  }

  async listForUser(userId: string): Promise<Place[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        place: {
          include: {
            region: true,
            photos: { orderBy: { position: 'asc' } },
          },
        },
      },
    });
    const places = rows
      .filter((r) => r.place.status === 'published')
      .map((r) => toApiPlace(r.place));
    return Promise.all(places.map((place) => this.withPresignedMedia(place)));
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

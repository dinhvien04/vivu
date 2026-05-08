import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Collection as PrismaCollection,
  CollectionItem as PrismaCollectionItem,
  Photo as PrismaPhoto,
  Place as PrismaPlace,
  Region as PrismaRegion,
} from '@prisma/client';
import type { Collection, CollectionItem, Place } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';
import type { AddCollectionItemDto } from './dto/add-item.dto';
import type { CreateCollectionDto } from './dto/create-collection.dto';
import type { UpdateCollectionDto } from './dto/update-collection.dto';

type PlaceForItem = PrismaPlace & {
  region: PrismaRegion;
  photos: PrismaPhoto[];
};

type CollectionWithCount = PrismaCollection & {
  _count: { items: number };
};

type CollectionWithItems = PrismaCollection & {
  _count: { items: number };
  items: (PrismaCollectionItem & { place: PlaceForItem })[];
};

function toApiPlace(p: PlaceForItem): Place {
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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function toApiCollection(c: CollectionWithCount): Collection {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    description: c.description,
    isPublic: c.isPublic,
    coverUrl: c.coverUrl,
    itemsCount: c._count.items,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toApiCollectionWithItems(c: CollectionWithItems): Collection {
  const out = toApiCollection(c);
  const items: CollectionItem[] = c.items.map((it) => ({
    placeId: it.placeId,
    position: it.position,
    note: it.note,
    place: toApiPlace(it.place),
  }));
  out.items = items;
  return out;
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Collection[]> {
    const rows = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return rows.map(toApiCollection);
  }

  async create(userId: string, dto: CreateCollectionDto): Promise<Collection> {
    const row = await this.prisma.collection.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        isPublic: dto.isPublic ?? false,
      },
      include: { _count: { select: { items: true } } },
    });
    return toApiCollection(row);
  }

  async getOwned(userId: string, id: string): Promise<Collection> {
    const row = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: [{ position: 'asc' }],
          include: {
            place: {
              include: {
                region: true,
                photos: { orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy sổ tay');
    if (row.userId !== userId) {
      throw new ForbiddenException('Sổ tay này không thuộc về bạn');
    }
    return toApiCollectionWithItems(row);
  }

  async update(userId: string, id: string, dto: UpdateCollectionDto): Promise<Collection> {
    await this.assertOwner(userId, id);
    const data: Prisma.CollectionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) {
      data.description = dto.description ? dto.description.trim() : null;
    }
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    const row = await this.prisma.collection.update({
      where: { id },
      data,
      include: { _count: { select: { items: true } } },
    });
    return toApiCollection(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwner(userId, id);
    await this.prisma.collection.delete({ where: { id } });
  }

  async addItem(
    userId: string,
    collectionId: string,
    dto: AddCollectionItemDto,
  ): Promise<Collection> {
    await this.assertOwner(userId, collectionId);

    // Resolve place by id or slug.
    const place = await this.prisma.place.findFirst({
      where: {
        OR: [{ id: dto.placeIdOrSlug }, { slug: dto.placeIdOrSlug }],
      },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');

    // Compute next position (max + 1).
    const last = await this.prisma.collectionItem.findFirst({
      where: { collectionId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPos = (last?.position ?? -1) + 1;

    try {
      await this.prisma.collectionItem.create({
        data: {
          collectionId,
          placeId: place.id,
          position: nextPos,
          note: dto.note?.trim() ?? null,
        },
      });
    } catch (e) {
      // Composite PK collision = already in collection; treat as idempotent.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
        throw e;
      }
    }

    // Touch updatedAt on parent so list ordering reflects activity.
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return this.getOwned(userId, collectionId);
  }

  async removeItem(userId: string, collectionId: string, placeId: string): Promise<void> {
    await this.assertOwner(userId, collectionId);
    try {
      await this.prisma.collectionItem.delete({
        where: { collectionId_placeId: { collectionId, placeId } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return; // idempotent
      }
      throw e;
    }
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });
  }

  private async assertOwner(userId: string, id: string): Promise<void> {
    const row = await this.prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy sổ tay');
    if (row.userId !== userId) {
      throw new ForbiddenException('Sổ tay này không thuộc về bạn');
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Photo as PrismaPhoto,
  Place as PrismaPlace,
  Region as PrismaRegion,
} from '@prisma/client';
import type { Paginated, Photo, Place } from '@vivu/types';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ListPlacesQueryDto } from '../places/dto/list-places.query.dto';
import { SearchIndexService } from '../search/search-index.service';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

type PlaceWithRelations = PrismaPlace & {
  region: PrismaRegion;
  photos: PrismaPhoto[];
  categories: {
    category: { id: string; slug: string; nameVi: string; nameEn: string; icon: string | null };
  }[];
};

const FULL_INCLUDE = {
  region: true,
  photos: { orderBy: { position: 'asc' } },
  categories: { include: { category: true } },
} as const;

function appendWhereAnd(where: Prisma.PlaceWhereInput, condition: Prisma.PlaceWhereInput): void {
  const current = where.AND;
  const conditions = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...conditions, condition];
}

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

@Injectable()
export class AdminPlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly index: SearchIndexService,
  ) {}

  async list(query: ListPlacesQueryDto): Promise<Paginated<Place>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PlaceWhereInput = {};
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { titleVi: { contains: q, mode: 'insensitive' } },
        { titleEn: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.region) where.region = { slug: query.region };
    if (query.category) where.categories = { some: { category: { slug: query.category } } };
    if (query.season) where.bestSeasons = { has: query.season };
    if (query.hasGeo === true) {
      appendWhereAnd(where, { lat: { not: null }, lng: { not: null } });
    } else if (query.hasGeo === false) {
      appendWhereAnd(where, { OR: [{ lat: null }, { lng: null }] });
    }

    const orderBy: Prisma.PlaceOrderByWithRelationInput =
      query.sort === 'name' ? { titleVi: 'asc' } : { updatedAt: 'desc' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.place.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: FULL_INCLUDE,
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      data: rows.map((p) => toApiPlace(p as PlaceWithRelations)),
      meta: { page, pageSize, total },
    };
  }

  async findBySlug(slug: string): Promise<Place> {
    const p = await this.prisma.place.findUnique({
      where: { slug },
      include: FULL_INCLUDE,
    });
    if (!p) throw new NotFoundException(`Không tìm thấy địa điểm: ${slug}`);
    return toApiPlace(p as PlaceWithRelations);
  }

  async create(dto: CreatePlaceDto): Promise<Place> {
    await this.assertRegion(dto.regionId);
    if (dto.categoryIds?.length) {
      await this.assertCategories(dto.categoryIds);
    }

    try {
      const created = await this.prisma.place.create({
        data: {
          slug: dto.slug,
          titleVi: dto.titleVi,
          titleEn: dto.titleEn ?? null,
          summaryVi: dto.summaryVi ?? null,
          summaryEn: dto.summaryEn ?? null,
          descriptionVi: dto.descriptionVi ?? null,
          descriptionEn: dto.descriptionEn ?? null,
          regionId: dto.regionId,
          address: dto.address ?? null,
          lat: dto.geo?.lat ?? null,
          lng: dto.geo?.lng ?? null,
          bestSeasons: dto.bestSeasons ?? [],
          status: dto.status ?? 'draft',
          heroImageUrl: dto.heroImageUrl ?? null,
          categories: dto.categoryIds?.length
            ? {
                create: dto.categoryIds.map((id) => ({ categoryId: id })),
              }
            : undefined,
        },
        include: FULL_INCLUDE,
      });
      await this.index.indexPlace(created.id);
      return toApiPlace(created as PlaceWithRelations);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Slug "${dto.slug}" đã tồn tại`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdatePlaceDto): Promise<Place> {
    const existing = await this.prisma.place.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Không tìm thấy địa điểm');

    if (dto.regionId !== undefined) {
      await this.assertRegion(dto.regionId);
    }
    if (dto.categoryIds !== undefined && dto.categoryIds.length > 0) {
      await this.assertCategories(dto.categoryIds);
    }

    const data: Prisma.PlaceUpdateInput = {};
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.titleVi !== undefined) data.titleVi = dto.titleVi;
    if (dto.titleEn !== undefined) data.titleEn = dto.titleEn || null;
    if (dto.summaryVi !== undefined) data.summaryVi = dto.summaryVi || null;
    if (dto.summaryEn !== undefined) data.summaryEn = dto.summaryEn || null;
    if (dto.descriptionVi !== undefined) data.descriptionVi = dto.descriptionVi || null;
    if (dto.descriptionEn !== undefined) data.descriptionEn = dto.descriptionEn || null;
    if (dto.regionId !== undefined) data.region = { connect: { id: dto.regionId } };
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.geo !== undefined) {
      data.lat = dto.geo?.lat ?? null;
      data.lng = dto.geo?.lng ?? null;
    }
    if (dto.bestSeasons !== undefined) data.bestSeasons = { set: dto.bestSeasons };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.heroImageUrl !== undefined) data.heroImageUrl = dto.heroImageUrl || null;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.categoryIds !== undefined) {
          // Replace existing category links
          await tx.placeCategory.deleteMany({ where: { placeId: id } });
          if (dto.categoryIds.length > 0) {
            await tx.placeCategory.createMany({
              data: dto.categoryIds.map((cid) => ({ placeId: id, categoryId: cid })),
              skipDuplicates: true,
            });
          }
        }
        return tx.place.update({
          where: { id },
          data,
          include: FULL_INCLUDE,
        });
      });
      await this.index.indexPlace(updated.id);
      return toApiPlace(updated as PlaceWithRelations);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Slug "${dto.slug}" đã tồn tại`);
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.place.delete({ where: { id } });
      await this.index.removePlace(id);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy địa điểm');
      }
      throw e;
    }
  }

  async setStatus(id: string, status: 'published' | 'draft' | 'archived'): Promise<Place> {
    try {
      const p = await this.prisma.place.update({
        where: { id },
        data: { status },
        include: FULL_INCLUDE,
      });
      if (status === 'published') {
        await this.index.indexPlace(p.id);
      } else {
        await this.index.removePlace(p.id);
      }
      return toApiPlace(p as PlaceWithRelations);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Không tìm thấy địa điểm');
      }
      throw e;
    }
  }

  async addPhoto(placeId: string, dto: AddPhotoDto): Promise<Photo> {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');

    const last = await this.prisma.photo.findFirst({
      where: { placeId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    if (dto.isCover) {
      await this.prisma.photo.updateMany({
        where: { placeId, isCover: true },
        data: { isCover: false },
      });
    }

    const created = await this.prisma.photo.create({
      data: {
        placeId,
        url: dto.url,
        publicId: dto.publicId ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        alt: dto.alt ?? null,
        position,
        isCover: dto.isCover ?? false,
      },
    });

    return {
      id: created.id,
      url: created.url,
      s3Key: created.s3Key,
      publicId: created.publicId,
      width: created.width,
      height: created.height,
      alt: created.alt,
      position: created.position,
      isCover: created.isCover,
    };
  }

  async removePhoto(placeId: string, photoId: string): Promise<void> {
    const photo = await this.prisma.photo.findFirst({
      where: { id: photoId, placeId },
      select: { id: true, publicId: true },
    });
    if (!photo) throw new NotFoundException('Không tìm thấy ảnh');
    await this.prisma.photo.delete({ where: { id: photoId } });
    if (photo.publicId) {
      await this.cloudinary.destroy(photo.publicId);
    }
  }

  private async assertRegion(regionId: string): Promise<void> {
    const r = await this.prisma.region.findUnique({
      where: { id: regionId },
      select: { id: true },
    });
    if (!r) throw new BadRequestException(`Region "${regionId}" không tồn tại`);
  }

  private async assertCategories(ids: string[]): Promise<void> {
    const found = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const missing = ids.filter((id) => !found.some((f) => f.id === id));
      throw new BadRequestException(`Category không tồn tại: ${missing.join(', ')}`);
    }
  }
}

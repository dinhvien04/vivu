import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Category } from '@vivu/types';
import { AsyncTtlCache } from '../common/async-ttl-cache';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  private readonly cache: AsyncTtlCache<Category[]>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cache = new AsyncTtlCache(
      Number(config.get<string>('REFERENCE_DATA_CACHE_TTL_MS') ?? 5 * 60 * 1000),
    );
  }

  async list(): Promise<Category[]> {
    return this.cache.get(async () => {
      const rows = await this.prisma.category.findMany({
        orderBy: { nameVi: 'asc' },
      });
      return rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        nameVi: c.nameVi,
        nameEn: c.nameEn,
        icon: c.icon,
      }));
    });
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Region } from '@vivu/types';
import { AsyncTtlCache } from '../common/async-ttl-cache';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  private readonly cache: AsyncTtlCache<Region[]>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cache = new AsyncTtlCache(
      Number(config.get<string>('REFERENCE_DATA_CACHE_TTL_MS') ?? 5 * 60 * 1000),
    );
  }

  async list(): Promise<Region[]> {
    return this.cache.get(async () => {
      const rows = await this.prisma.region.findMany({
        orderBy: [{ parentId: 'asc' }, { nameVi: 'asc' }],
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        nameVi: r.nameVi,
        nameEn: r.nameEn,
        parentId: r.parentId,
      }));
    });
  }
}

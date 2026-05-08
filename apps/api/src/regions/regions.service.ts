import { Injectable } from '@nestjs/common';
import type { Region } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Region[]> {
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
  }
}

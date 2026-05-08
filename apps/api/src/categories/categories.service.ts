import { Injectable } from '@nestjs/common';
import type { Category } from '@vivu/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Category[]> {
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
  }
}

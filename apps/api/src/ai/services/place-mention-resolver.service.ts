import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ResolvedPlaceMention {
  slug: string;
  name: string;
}

@Injectable()
export class PlaceMentionResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(message: string): Promise<ResolvedPlaceMention | null> {
    const normalizedMessage = ` ${normalize(message)} `;
    const places = await this.prisma.place.findMany({
      where: {
        status: 'published',
        province: { equals: 'Gia Lai', mode: 'insensitive' },
      },
      select: {
        slug: true,
        titleVi: true,
        titleEn: true,
        aliases: true,
      },
    });

    let best: (ResolvedPlaceMention & { length: number }) | null = null;
    for (const place of places) {
      const names = [place.titleVi, place.titleEn, ...place.aliases].filter(
        (value): value is string => Boolean(value?.trim()),
      );
      for (const name of names) {
        const normalizedName = normalize(name);
        if (
          normalizedName.length < 3 ||
          !normalizedMessage.includes(` ${normalizedName} `) ||
          (best && best.length >= normalizedName.length)
        ) {
          continue;
        }
        best = { slug: place.slug, name: place.titleVi, length: normalizedName.length };
      }
    }

    return best ? { slug: best.slug, name: best.name } : null;
  }
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

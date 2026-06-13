import type { PrismaService } from '../../prisma/prisma.service';
import { PlaceMentionResolverService } from './place-mention-resolver.service';

describe('PlaceMentionResolverService', () => {
  it('resolves a Vietnamese place name without requiring diacritics', async () => {
    const prisma = {
      place: {
        findMany: jest.fn().mockResolvedValue([
          {
            slug: 'bien-ho',
            titleVi: 'Biển Hồ',
            titleEn: null,
            aliases: ['Hồ Tơ Nưng'],
          },
          {
            slug: 'bien-ho-che',
            titleVi: 'Biển Hồ Chè',
            titleEn: null,
            aliases: [],
          },
        ]),
      },
    };
    const resolver = new PlaceMentionResolverService(prisma as unknown as PrismaService);

    await expect(resolver.resolve('Bien Ho Gia Lai co gi dep?')).resolves.toEqual({
      slug: 'bien-ho',
      name: 'Biển Hồ',
    });
  });

  it('prefers the longest matching place name', async () => {
    const prisma = {
      place: {
        findMany: jest.fn().mockResolvedValue([
          {
            slug: 'bien-ho',
            titleVi: 'Biển Hồ',
            titleEn: null,
            aliases: [],
          },
          {
            slug: 'bien-ho-che',
            titleVi: 'Biển Hồ Chè',
            titleEn: null,
            aliases: [],
          },
        ]),
      },
    };
    const resolver = new PlaceMentionResolverService(prisma as unknown as PrismaService);

    await expect(resolver.resolve('Biển Hồ Chè có gì đẹp?')).resolves.toEqual({
      slug: 'bien-ho-che',
      name: 'Biển Hồ Chè',
    });
  });
});

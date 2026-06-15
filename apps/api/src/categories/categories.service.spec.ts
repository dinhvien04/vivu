import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  it('caches concurrent list requests', async () => {
    const prisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c1',
            slug: 'bien-dao',
            nameVi: 'Biển đảo',
            nameEn: 'Beaches and islands',
            icon: 'beach_access',
          },
        ]),
      },
    };
    const config = {
      get: jest.fn().mockReturnValue('300000'),
    } as unknown as ConfigService;
    const service = new CategoriesService(prisma as unknown as PrismaService, config);

    const [first, second] = await Promise.all([service.list(), service.list()]);

    expect(first).toEqual(second);
    expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
  });
});

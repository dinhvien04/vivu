import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { RegionsService } from './regions.service';

describe('RegionsService', () => {
  it('caches concurrent list requests', async () => {
    const prisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'r1',
            slug: 'gia-lai',
            nameVi: 'Gia Lai',
            nameEn: 'Gia Lai',
            parentId: null,
          },
        ]),
      },
    };
    const config = {
      get: jest.fn().mockReturnValue('300000'),
    } as unknown as ConfigService;
    const service = new RegionsService(prisma as unknown as PrismaService, config);

    const [first, second] = await Promise.all([service.list(), service.list()]);

    expect(first).toEqual(second);
    expect(prisma.region.findMany).toHaveBeenCalledTimes(1);
  });
});

import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  it('presigns S3 media when listing favorites', async () => {
    const prisma = {
      favorite: {
        findMany: jest.fn().mockResolvedValue([
          {
            place: {
              id: 'p1',
              locationKey: null,
              slug: 'bien-ho',
              titleVi: 'Biển Hồ',
              titleEn: null,
              summaryVi: null,
              summaryEn: null,
              descriptionVi: null,
              descriptionEn: null,
              regionId: 'r1',
              province: 'Gia Lai',
              aliases: [],
              address: null,
              lat: null,
              lng: null,
              bestSeasons: [],
              status: 'published',
              heroImageUrl: null,
              heroImageS3Key: 'places/bien-ho/cover.jpg',
              qdrantPlaceSlug: null,
              isAiReady: false,
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              region: {
                id: 'r1',
                slug: 'gia-lai',
                nameVi: 'Gia Lai',
                nameEn: 'Gia Lai',
                parentId: null,
              },
              photos: [
                {
                  id: 'ph1',
                  url: 's3://bucket/places/bien-ho/1.jpg',
                  s3Key: 'places/bien-ho/1.jpg',
                  publicId: null,
                  width: null,
                  height: null,
                  alt: null,
                  position: 0,
                  isCover: true,
                },
              ],
            },
          },
        ]),
      },
    };
    const s3 = {
      getPresignedGetUrl: jest
        .fn()
        .mockResolvedValueOnce('https://signed.example/cover')
        .mockResolvedValueOnce('https://signed.example/photo'),
    };
    const service = new FavoritesService(prisma as never, s3 as never);
    const out = await service.listForUser('user-1');

    expect(out).toHaveLength(1);
    const first = out[0]!;
    expect(first.heroImageUrl).toBe('https://signed.example/cover');
    expect(first.photos?.[0]?.url).toBe('https://signed.example/photo');
  });
});

import { ForbiddenException } from '@nestjs/common';
import { CollectionsService } from './collections.service';

describe('CollectionsService ownership checks', () => {
  it('does not return a collection owned by another user', async () => {
    const prisma = {
      collection: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'collection-1',
          userId: 'user-b',
          _count: { items: 0 },
          items: [],
        }),
      },
    };
    const service = new CollectionsService(prisma as never);

    await expect(service.getOwned('user-a', 'collection-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not delete a collection owned by another user', async () => {
    const prisma = {
      collection: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'user-b' }),
        delete: jest.fn(),
      },
    };
    const service = new CollectionsService(prisma as never);

    await expect(service.remove('user-a', 'collection-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.collection.delete).not.toHaveBeenCalled();
  });

  it('does not add an item to a collection owned by another user', async () => {
    const prisma = {
      collection: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'user-b' }),
      },
      place: { findFirst: jest.fn() },
      collectionItem: { create: jest.fn() },
    };
    const service = new CollectionsService(prisma as never);

    await expect(
      service.addItem('user-a', 'collection-1', { placeIdOrSlug: 'bien-ho' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.place.findFirst).not.toHaveBeenCalled();
    expect(prisma.collectionItem.create).not.toHaveBeenCalled();
  });
});

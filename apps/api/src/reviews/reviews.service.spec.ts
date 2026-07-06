import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService ownership checks', () => {
  it('does not update a review owned by another user', async () => {
    const prisma = {
      review: {
        findUnique: jest.fn().mockResolvedValue({ id: 'review-1', userId: 'user-b' }),
        update: jest.fn().mockResolvedValue({ id: 'review-1', placeId: 'place-1', userId: 'user-b' }),
      },
    };
    const placeRating = { syncPlaceRating: jest.fn().mockResolvedValue(undefined) };
    const service = new ReviewsService(prisma as never, placeRating as never);

    await expect(service.update('review-1', 'user-a', { rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('does not delete a review owned by another user without admin/editor role', async () => {
    const prisma = {
      review: {
        findUnique: jest.fn().mockResolvedValue({ id: 'review-1', userId: 'user-b' }),
        delete: jest.fn(),
      },
    };
    const placeRating = { syncPlaceRating: jest.fn().mockResolvedValue(undefined) };
    const service = new ReviewsService(prisma as never, placeRating as never);

    await expect(service.remove('review-1', 'user-a', 'user')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.review.delete).not.toHaveBeenCalled();
  });

  it('allows admin/editor to delete another user review', async () => {
    const prisma = {
      review: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'review-1', userId: 'user-b', placeId: 'place-1' }),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };
    const placeRating = { syncPlaceRating: jest.fn().mockResolvedValue(undefined) };
    const service = new ReviewsService(prisma as never, placeRating as never);

    await expect(service.remove('review-1', 'user-a', 'admin')).resolves.toBeUndefined();
    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
  });
});

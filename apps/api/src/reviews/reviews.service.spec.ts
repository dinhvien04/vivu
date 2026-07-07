import { ReviewsService } from './reviews.service';

describe('ReviewsService content sanitization', () => {
  it('stores review content as plain text without HTML', async () => {
    const prisma = {
      place: {
        findFirst: jest.fn().mockResolvedValue({ id: 'place-1' }),
      },
      review: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'review-1',
            placeId: data.placeId,
            userId: data.userId,
            rating: data.rating,
            content: data.content,
            status: data.status,
            createdAt: new Date('2026-07-07T00:00:00.000Z'),
            updatedAt: new Date('2026-07-07T00:00:00.000Z'),
            user: { id: 'user-1', name: 'Tester', avatarUrl: null },
          }),
        ),
      },
    };
    const placeRating = { syncPlaceRating: jest.fn().mockResolvedValue(undefined) };
    const service = new ReviewsService(prisma as never, placeRating as never);

    const review = await service.create('my-place', 'user-1', {
      rating: 5,
      content: '<script>alert(1)</script>Great place',
    });

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'Great place',
        }),
      }),
    );
    expect(review.content).toBe('Great place');
  });
});

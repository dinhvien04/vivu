import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TripPlansService } from './trip-plans.service';

function makeService(prisma: unknown) {
  return new TripPlansService(prisma as never, {} as never, {} as never);
}

describe('TripPlansService sharing', () => {
  it('returns only public-safe fields for shared itineraries', async () => {
    const shared = {
      id: 'plan-1',
      title: 'Two days in Gia Lai',
      output: {
        title: 'Two days in Gia Lai',
        summary: 'Public summary',
        days: [],
        generalTips: [],
        missingDataNote: null,
      },
      shareId: 'share-1',
      isPublic: true,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    };
    const prisma = {
      tripPlan: {
        findFirst: jest.fn().mockResolvedValue(shared),
      },
    };

    await expect(makeService(prisma).getShared('share-1')).resolves.toEqual({ data: shared });

    const query = prisma.tripPlan.findFirst.mock.calls[0][0];
    expect(query.where).toEqual({ shareId: 'share-1', isPublic: true });
    expect(query.select).toEqual({
      id: true,
      title: true,
      output: true,
      shareId: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    });
    expect(query.select).not.toHaveProperty('userId');
    expect(query.select).not.toHaveProperty('input');
    expect(query.select).not.toHaveProperty('user');
    expect(query.select).not.toHaveProperty('email');
    expect(query.select).not.toHaveProperty('phone');
  });

  it('returns 404 for revoked or missing shared itineraries', async () => {
    const prisma = {
      tripPlan: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    await expect(makeService(prisma).getShared('old-share')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('revokes a shared itinerary for the owner', async () => {
    const prisma = {
      tripPlan: {
        findUnique: jest.fn().mockResolvedValue({ id: 'plan-1', userId: 'user-1' }),
        update: jest.fn().mockResolvedValue({
          id: 'plan-1',
          title: 'Two days in Gia Lai',
          shareId: null,
          isPublic: false,
        }),
      },
    };

    await expect(makeService(prisma).unshare('user-1', 'plan-1')).resolves.toEqual({
      data: {
        id: 'plan-1',
        title: 'Two days in Gia Lai',
        shareId: null,
        isPublic: false,
      },
    });
    expect(prisma.tripPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { shareId: null, isPublic: false },
      select: { id: true, title: true, shareId: true, isPublic: true },
    });
  });

  it('blocks a non-owner from revoking a shared itinerary', async () => {
    const prisma = {
      tripPlan: {
        findUnique: jest.fn().mockResolvedValue({ id: 'plan-1', userId: 'owner-1' }),
        update: jest.fn(),
      },
    };

    await expect(makeService(prisma).unshare('user-1', 'plan-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.tripPlan.update).not.toHaveBeenCalled();
  });

  it('returns 404 before revoking a missing itinerary', async () => {
    const prisma = {
      tripPlan: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };

    await expect(makeService(prisma).unshare('user-1', 'plan-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.tripPlan.update).not.toHaveBeenCalled();
  });
});

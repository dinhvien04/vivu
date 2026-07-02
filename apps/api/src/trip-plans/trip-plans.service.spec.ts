import { ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { GenerateTripPlanDto } from './dto/generate-trip-plan.dto';
import { TripPlansService } from './trip-plans.service';

function makeService(prisma: unknown, aiText: unknown = {}, quota: unknown = {}) {
  return new TripPlansService(
    prisma as never,
    aiText as never,
    {
      consume: jest.fn().mockResolvedValue(undefined),
      ...(quota as object),
    } as never,
  );
}

describe('TripPlansService generation', () => {
  it('generates a plan through the text provider and stores sanitized output', async () => {
    const aiText = {
      generateTripPlan: jest
        .fn()
        .mockImplementation(
          async (_prompt: string, _options: unknown, transform: (raw: string) => unknown) =>
            transform(
              JSON.stringify({
                title: 'One day in Gia Lai',
                summary: 'A short Vivu plan',
                days: [
                  {
                    day: 1,
                    theme: 'Lake',
                    items: [
                      {
                        timeOfDay: 'morning',
                        placeName: 'Bien Ho',
                        placeSlug: 'bien-ho',
                        reason: 'Scenic',
                        suggestedDuration: '2h',
                        travelNote: 'Go early',
                        tips: ['Bring water'],
                      },
                    ],
                    foodSuggestions: [],
                    notes: [],
                  },
                ],
                generalTips: [],
                missingDataNote: null,
              }),
            ),
        ),
    };
    const prisma = prismaForGenerate();

    await expect(
      makeService(prisma, aiText).generate(validDto(), {} as never),
    ).resolves.toMatchObject({
      data: {
        id: 'plan-1',
        title: 'One day in Gia Lai',
        output: {
          title: 'One day in Gia Lai',
          days: [{ items: [{ placeSlug: 'bien-ho' }] }],
        },
      },
    });

    expect(aiText.generateTripPlan).toHaveBeenCalledWith(
      expect.stringContaining('VIVU_PLACES'),
      expect.objectContaining({
        temperature: 0.15,
        maxOutputTokens: expect.any(Number),
        responseMimeType: 'application/json',
      }),
      expect.any(Function),
    );
    expect(prisma.tripPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'One day in Gia Lai',
          places: { create: [{ placeId: 'place-1', position: 0 }] },
        }),
      }),
    );
  });

  it('does not store a plan when the text provider returns a friendly credit error', async () => {
    const aiText = {
      generateTripPlan: jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException('Tài khoản AI đã hết credit.')),
    };
    const prisma = prismaForGenerate();

    await expect(makeService(prisma, aiText).generate(validDto(), {} as never)).rejects.toThrow(
      'Tài khoản AI đã hết credit.',
    );

    expect(prisma.tripPlan.create).not.toHaveBeenCalled();
  });
});

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

  it('blocks a non-owner from sharing an itinerary', async () => {
    const prisma = {
      tripPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plan-1',
          userId: 'owner-1',
          title: 'Owner plan',
          shareId: null,
          isPublic: false,
        }),
        update: jest.fn(),
      },
    };

    await expect(makeService(prisma).share('user-1', 'plan-1')).rejects.toBeInstanceOf(
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

function validDto(): GenerateTripPlanDto {
  return {
    area: 'all',
    days: 1,
    peopleCount: 2,
    transport: 'xe_may',
    interests: ['nature'],
    budget: 'medium',
    note: '',
    locale: 'vi',
  };
}

function prismaForGenerate() {
  return {
    place: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'place-1',
          slug: 'bien-ho',
          titleVi: 'Bien Ho',
          titleEn: null,
          summaryVi: 'Lake in Gia Lai',
          summaryEn: null,
          address: null,
          lat: null,
          lng: null,
          categories: [],
          isAiReady: true,
          region: null,
        },
      ]),
    },
    tripPlan: {
      create: jest.fn().mockResolvedValue({
        id: 'plan-1',
        title: 'One day in Gia Lai',
        shareId: null,
        isPublic: false,
      }),
    },
  };
}

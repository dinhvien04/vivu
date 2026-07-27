import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QaService } from './qa.service';

describe('QaService', () => {
  it('rejects questions for unpublished places', async () => {
    const prisma = {
      place: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new QaService(prisma as never);

    await expect(
      service.createQuestion('draft-place', 'user-1', { content: 'Có gì hay?' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores sanitized plain-text question content', async () => {
    const prisma = {
      place: {
        findFirst: jest.fn().mockResolvedValue({ id: 'place-1' }),
      },
      question: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'q-1',
            placeId: data.placeId,
            userId: data.userId,
            content: data.content,
            createdAt: new Date('2026-07-07T00:00:00.000Z'),
            user: { id: 'user-1', name: 'Tester', avatarUrl: null },
            place: { id: 'place-1', slug: 'place', titleVi: 'Place' },
            answers: [],
          }),
        ),
      },
    };
    const service = new QaService(prisma as never);

    const question = await service.createQuestion('place', 'user-1', {
      content: '<script>alert(1)</script>Có wifi không?',
    });

    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: 'Có wifi không?' }),
      }),
    );
    expect(question.content).toBe('Có wifi không?');
  });

  it('rejects answers that sanitize to empty content', async () => {
    const prisma = {
      question: {
        findUnique: jest.fn().mockResolvedValue({ id: 'q-1' }),
      },
    };
    const service = new QaService(prisma as never);

    await expect(
      service.createAnswer('q-1', 'user-1', { content: '<b></b>' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

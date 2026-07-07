import { NotFoundException } from '@nestjs/common';
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
});

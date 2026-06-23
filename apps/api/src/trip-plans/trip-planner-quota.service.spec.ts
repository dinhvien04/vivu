import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiUsageKeyType } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { TripPlannerQuotaService } from './trip-planner-quota.service';

function makeRequest(ip = '203.0.113.10'): FastifyRequest {
  return {
    ip,
    headers: {},
  } as FastifyRequest;
}

describe('TripPlannerQuotaService', () => {
  it('allows anonymous requests within the daily quota', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({ tripPlanRequests: 5 }),
      },
    };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new TripPlannerQuotaService(prisma as never, config as unknown as ConfigService);

    await expect(service.consume(makeRequest())).resolves.toBeUndefined();

    expect(prisma.aiUsage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ keyType: AiUsageKeyType.ip, tripPlanRequests: 1 }),
        update: { tripPlanRequests: { increment: 1 } },
      }),
    );
  });

  it('throws 429 when the anonymous daily quota is exceeded', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({ tripPlanRequests: 6 }),
      },
    };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new TripPlannerQuotaService(prisma as never, config as unknown as ConfigService);

    let thrown: unknown;
    try {
      await service.consume(makeRequest());
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});

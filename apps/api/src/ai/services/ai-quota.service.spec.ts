import { HttpException } from '@nestjs/common';
import { AiUsageKeyType } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { AiQuotaService } from './ai-quota.service';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

function makeRateLimiter(allowed = true) {
  return {
    incrementAndCheck: jest.fn().mockResolvedValue(allowed),
    peek: jest.fn().mockResolvedValue(0),
    reset: jest.fn().mockResolvedValue(undefined),
  };
}

function anonRequest(): FastifyRequest {
  return {
    headers: { 'x-forwarded-for': '203.0.113.10', 'user-agent': 'VivuTest/1.0' },
    ip: '127.0.0.1',
  } as unknown as FastifyRequest;
}

function authedRequest(userId = 'user-123'): FastifyRequest {
  return {
    headers: { 'x-forwarded-for': '203.0.113.10', 'user-agent': 'VivuTest/1.0' },
    ip: '127.0.0.1',
    user: { id: userId } as AuthenticatedUser,
  } as unknown as FastifyRequest;
}

describe('AiQuotaService', () => {
  it('uses user quota key for logged-in requests', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({
          keyType: AiUsageKeyType.user,
          keyHash: 'hashed-key',
          aiRequests: 1,
          imageUploads: 0,
        }),
      },
    };
    const service = new AiQuotaService(
      prisma as never,
      config({
        AI_DAILY_QUOTA_USER: '100',
        AI_RATE_LIMIT_PER_MINUTE: '10',
        AI_QUOTA_HASH_SECRET: 'unit-test-secret',
      }) as never,
      makeRateLimiter() as never,
    );

    const identity = service.buildIdentity(authedRequest());
    expect(identity.keyType).toBe(AiUsageKeyType.user);

    await service.consume(authedRequest(), { message: 'hello', sessionId: 'new-session' });
    expect(prisma.aiUsage.upsert.mock.calls[0][0].where.keyType_keyHash_date.keyType).toBe(
      AiUsageKeyType.user,
    );
  });

  it('does not use session_id for anonymous quota identity', async () => {
    const service = new AiQuotaService(
      {} as never,
      config({ AI_QUOTA_HASH_SECRET: 'unit-test-secret' }) as never,
      makeRateLimiter() as never,
    );

    const identity = service.buildIdentity(anonRequest());
    expect(identity.keyType).toBe(AiUsageKeyType.ip);
    expect(identity.keyHash).not.toContain('session-abc');
  });

  it('keeps the same anonymous quota when session_id changes', async () => {
    const service = new AiQuotaService(
      {} as never,
      config({ AI_QUOTA_HASH_SECRET: 'unit-test-secret' }) as never,
      makeRateLimiter() as never,
    );

    const first = service.buildIdentity(anonRequest());
    const second = service.buildIdentity(anonRequest());

    expect(first).toEqual(second);
  });

  it('throws 429 when daily quota is exceeded', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({
          keyType: AiUsageKeyType.ip,
          keyHash: 'hashed-key',
          aiRequests: 2,
          imageUploads: 0,
        }),
      },
    };
    const service = new AiQuotaService(
      prisma as never,
      config({
        AI_DAILY_QUOTA_ANON: '1',
        AI_RATE_LIMIT_PER_MINUTE: '10',
      }) as never,
      makeRateLimiter() as never,
    );

    await expect(
      service.consume(anonRequest(), { message: 'hello', sessionId: 'session-1' }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('throws 429 when per-minute limit is exceeded', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn(),
      },
    };
    const service = new AiQuotaService(
      prisma as never,
      config({
        AI_DAILY_QUOTA_ANON: '10',
        AI_RATE_LIMIT_PER_MINUTE: '1',
      }) as never,
      makeRateLimiter(false) as never,
    );

    await expect(service.consume(anonRequest(), { message: 'hello' })).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(prisma.aiUsage.upsert).not.toHaveBeenCalled();
  });
});

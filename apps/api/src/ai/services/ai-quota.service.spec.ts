import { HttpException } from '@nestjs/common';
import { AiUsageKeyType } from '@prisma/client';
import { AiQuotaService } from './ai-quota.service';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

describe('AiQuotaService', () => {
  it('hashes anonymous identity material before persisting usage', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({
          keyType: AiUsageKeyType.ip_session,
          keyHash: 'hashed-key',
          aiRequests: 1,
          imageUploads: 0,
        }),
      },
    };
    const service = new AiQuotaService(
      prisma as never,
      config({
        AI_DAILY_QUOTA_ANON: '10',
        AI_RATE_LIMIT_PER_MINUTE: '10',
        AI_QUOTA_HASH_SECRET: 'unit-test-secret',
      }) as never,
    );

    await service.consume(
      {
        headers: { 'x-forwarded-for': '203.0.113.10' },
        ip: '127.0.0.1',
      } as never,
      { sessionId: 'session-abc', message: 'hello' },
    );

    const upsertArg = prisma.aiUsage.upsert.mock.calls[0][0];
    expect(upsertArg.where.keyType_keyHash_date.keyType).toBe(AiUsageKeyType.ip_session);
    expect(upsertArg.where.keyType_keyHash_date.keyHash).not.toContain('203.0.113.10');
    expect(upsertArg.where.keyType_keyHash_date.keyHash).not.toContain('session-abc');
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
        AI_QUOTA_HASH_SECRET: 'unit-test-secret',
      }) as never,
    );

    await expect(
      service.consume({ headers: {}, ip: '127.0.0.1' } as never, { message: 'hello' }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('throws 429 when minute rate is exceeded before touching the database', async () => {
    const prisma = {
      aiUsage: {
        upsert: jest.fn().mockResolvedValue({
          keyType: AiUsageKeyType.ip,
          keyHash: 'hashed-key',
          aiRequests: 1,
          imageUploads: 0,
        }),
      },
    };
    const service = new AiQuotaService(
      prisma as never,
      config({
        AI_DAILY_QUOTA_ANON: '10',
        AI_RATE_LIMIT_PER_MINUTE: '1',
        AI_QUOTA_HASH_SECRET: 'unit-test-secret',
      }) as never,
    );
    const request = { headers: {}, ip: '127.0.0.1' } as never;

    await service.consume(request, { message: 'first' });
    await expect(service.consume(request, { message: 'second' })).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(prisma.aiUsage.upsert).toHaveBeenCalledTimes(1);
  });
});

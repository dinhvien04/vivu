import type { FastifyRequest } from 'fastify';
import { DataReportsService } from './data-reports.service';

function request(): FastifyRequest {
  return {
    headers: {
      'x-forwarded-for': '203.0.113.20',
      'user-agent': 'jest',
    },
    ip: '203.0.113.20',
  } as unknown as FastifyRequest;
}

function config(overrides: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => overrides[key] ?? (key === 'ABUSE_HASH_SECRET' ? 'secret' : undefined)),
  };
}

describe('DataReportsService', () => {
  it('does not persist honeypot reports', async () => {
    const prisma = { dataReport: { create: jest.fn() } };
    const turnstile = { verify: jest.fn() };
    const service = new DataReportsService(prisma as never, config() as never, turnstile as never);

    await expect(
      service.create(
        {
          placeSlug: 'bien-ho',
          type: 'wrong_description',
          message: 'Bot report',
          website: 'spam.example',
        },
        request(),
      ),
    ).resolves.toEqual({ ok: true, spam: true });
    expect(prisma.dataReport.create).not.toHaveBeenCalled();
    expect(turnstile.verify).not.toHaveBeenCalled();
  });

  it('persists public reports for admin review', async () => {
    const prisma = {
      dataReport: {
        create: jest.fn().mockResolvedValue({ id: 'report-1' }),
      },
    };
    const turnstile = { verify: jest.fn().mockResolvedValue(undefined) };
    const service = new DataReportsService(prisma as never, config() as never, turnstile as never);

    await expect(
      service.create(
        {
          placeSlug: 'bien-ho',
          type: 'wrong_coordinates',
          message: 'Toa do chua dung',
          contact: '0909000000',
        },
        request(),
      ),
    ).resolves.toEqual({ ok: true, id: 'report-1' });

    expect(turnstile.verify).toHaveBeenCalledWith(undefined, expect.any(Object));
    expect(prisma.dataReport.create).toHaveBeenCalledWith({
      data: {
        placeSlug: 'bien-ho',
        type: 'wrong_coordinates',
        message: 'Toa do chua dung',
        contact: '0909000000',
      },
      select: { id: true },
    });
  });

  it('throws 429 when data report hourly rate limit is exceeded', async () => {
    const prisma = {
      dataReport: {
        create: jest.fn().mockResolvedValue({ id: 'report-1' }),
      },
    };
    const turnstile = { verify: jest.fn().mockResolvedValue(undefined) };
    const service = new DataReportsService(
      prisma as never,
      config({ DATA_REPORT_RATE_LIMIT_PER_HOUR: '1' }) as never,
      turnstile as never,
    );
    const dto = {
      placeSlug: 'bien-ho',
      type: 'wrong_description',
      message: 'Noi dung can sua',
    };

    await expect(service.create(dto, request())).resolves.toEqual({ ok: true, id: 'report-1' });
    await expect(service.create(dto, request())).rejects.toMatchObject({ status: 429 });
    expect(prisma.dataReport.create).toHaveBeenCalledTimes(1);
  });
});

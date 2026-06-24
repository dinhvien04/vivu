import type { FastifyRequest } from 'fastify';
import { LeadsService } from './leads.service';

function request(): FastifyRequest {
  return {
    headers: {
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'jest',
    },
    ip: '203.0.113.10',
  } as unknown as FastifyRequest;
}

describe('LeadsService', () => {
  it('does not persist honeypot submissions', async () => {
    const prisma = { lead: { create: jest.fn() } };
    const config = { get: jest.fn((key: string) => (key === 'AI_QUOTA_HASH_SECRET' ? 'secret' : undefined)) };
    const turnstile = { verify: jest.fn() };
    const service = new LeadsService(prisma as never, config as never, turnstile as never);

    await expect(
      service.create(
        {
          name: 'Bot',
          phoneOrZalo: '000',
          website: 'spam.example',
        },
        request(),
      ),
    ).resolves.toEqual({ ok: true, spam: true });
    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(turnstile.verify).not.toHaveBeenCalled();
  });

  it('persists a normal lead without raw ip or user-agent', async () => {
    const prisma = {
      lead: {
        create: jest.fn().mockResolvedValue({ id: 'lead-1' }),
      },
    };
    const config = { get: jest.fn((key: string) => (key === 'AI_QUOTA_HASH_SECRET' ? 'secret' : undefined)) };
    const turnstile = { verify: jest.fn().mockResolvedValue(undefined) };
    const service = new LeadsService(prisma as never, config as never, turnstile as never);

    await expect(
      service.create(
        {
          name: 'Nguyen Van A',
          phoneOrZalo: '0909000000',
          source: 'trip_planner',
          interestedPlaceSlug: 'ky-co',
        },
        request(),
      ),
    ).resolves.toEqual({ ok: true, id: 'lead-1' });

    expect(turnstile.verify).toHaveBeenCalledWith(undefined, expect.any(Object));
    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nguyen Van A',
          phoneOrZalo: '0909000000',
          interestedPlaceSlug: 'ky-co',
          ipHash: expect.any(String),
          userAgentHash: expect.any(String),
        }),
      }),
    );
    const data = prisma.lead.create.mock.calls[0][0].data;
    expect(data.ipHash).not.toContain('203.0.113.10');
    expect(data.userAgentHash).not.toContain('jest');
  });
});

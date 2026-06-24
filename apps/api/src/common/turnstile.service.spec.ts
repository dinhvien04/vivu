import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { TurnstileService } from './turnstile.service';

function config(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function request(): FastifyRequest {
  return {
    headers: {
      'x-forwarded-for': '203.0.113.10',
    },
    ip: '203.0.113.10',
  } as unknown as FastifyRequest;
}

describe('TurnstileService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('skips verification when Turnstile is disabled', async () => {
    const service = new TurnstileService(config({ TURNSTILE_ENABLED: 'false' }));
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(service.verify(undefined, request())).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a token when Turnstile is enabled', async () => {
    const service = new TurnstileService(
      config({ TURNSTILE_ENABLED: 'true', TURNSTILE_SECRET_KEY: 'secret' }),
    );

    await expect(service.verify(undefined, request())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a successful Cloudflare verification response', async () => {
    const service = new TurnstileService(
      config({ TURNSTILE_ENABLED: 'true', TURNSTILE_SECRET_KEY: 'secret' }),
    );
    const fetchMock = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(JSON.stringify({ success: true })),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(service.verify('token', request())).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams),
      }),
    );
  });

  it('rejects an unsuccessful Cloudflare verification response', async () => {
    const service = new TurnstileService(
      config({ TURNSTILE_ENABLED: 'true', TURNSTILE_SECRET_KEY: 'secret' }),
    );
    globalThis.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(
        JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }),
      ),
    }) as unknown as typeof fetch;

    await expect(service.verify('bad-token', request())).rejects.toBeInstanceOf(BadRequestException);
  });
});

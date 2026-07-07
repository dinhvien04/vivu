import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import { TurnstileService } from '../common/turnstile.service';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { OAuthStateService } from './oauth-state.service';

function config(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function request(): FastifyRequest {
  return {
    headers: {
      'x-forwarded-for': '203.0.113.30',
    },
    ip: '203.0.113.30',
  } as unknown as FastifyRequest;
}

describe('AuthController Turnstile', () => {
  it('rejects register without Turnstile token when enabled', async () => {
    const auth = { register: jest.fn() } as unknown as AuthService;
    const turnstile = new TurnstileService(
      config({ TURNSTILE_ENABLED: 'true', TURNSTILE_SECRET_KEY: 'secret' }),
    );
    const oauthState = {} as OAuthStateService;
    const controller = new AuthController(auth, turnstile, oauthState);

    await expect(
      controller.register(
        { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
        request(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('rejects forgot password without Turnstile token when enabled', async () => {
    const auth = { forgotPassword: jest.fn() } as unknown as AuthService;
    const turnstile = new TurnstileService(
      config({ TURNSTILE_ENABLED: 'true', TURNSTILE_SECRET_KEY: 'secret' }),
    );
    const oauthState = {} as OAuthStateService;
    const controller = new AuthController(auth, turnstile, oauthState);

    await expect(
      controller.forgotPassword({ email: 'tester@example.com' }, request()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('does not require Turnstile token when disabled', async () => {
    const auth = {
      register: jest.fn().mockResolvedValue({ ok: true }),
    } as unknown as AuthService;
    const turnstile = new TurnstileService(config({ TURNSTILE_ENABLED: 'false' }));
    const oauthState = {} as OAuthStateService;
    const controller = new AuthController(auth, turnstile, oauthState);

    await expect(
      controller.register(
        { name: 'Tester', email: 'tester@example.com', password: 'Pass1234' },
        request(),
      ),
    ).resolves.toEqual({ ok: true });
    expect(auth.register).toHaveBeenCalled();
  });
});

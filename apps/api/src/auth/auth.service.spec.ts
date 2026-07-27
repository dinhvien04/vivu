import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

function makeRateLimiter() {
  let failCount = 0;
  return {
    incrementAndCheck: jest.fn().mockImplementation(async () => {
      failCount += 1;
      return true;
    }),
    peek: jest.fn().mockImplementation(async () => failCount),
    reset: jest.fn().mockResolvedValue(undefined),
  };
}

function makeService(prisma: unknown, rateLimiter = makeRateLimiter()) {
  const email = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };
  const kv = {
    setJson: jest.fn().mockResolvedValue(undefined),
    getJson: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    prisma as never,
    {} as never,
    email as never,
    rateLimiter as never,
    kv as never,
    config({
      JWT_ACCESS_SECRET: 'unit-test-secret',
      AUTH_LOGIN_MAX_FAILURES: '1',
      AUTH_LOGIN_LOCKOUT_WINDOW_MS: '60000',
      CORS_ORIGINS: 'http://localhost:3000',
    }) as never,
  );
  return { service, rateLimiter, email, kv };
}

describe('AuthService hardening', () => {
  it('locks repeated invalid login attempts before hitting the database again', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const { service } = makeService(prisma);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('exchanges a one-time OAuth code and deletes it afterward', async () => {
    const tokens = {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    };
    const { service, kv } = makeService({});
    kv.getJson.mockResolvedValueOnce(tokens);

    await expect(service.exchangeOAuthCode('abc')).resolves.toEqual(tokens);
    expect(kv.delete).toHaveBeenCalledWith('oauth:abc');
  });
});

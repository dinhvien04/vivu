import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

describe('AuthService hardening', () => {
  it('locks repeated invalid login attempts before hitting the database again', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new AuthService(
      prisma as never,
      {} as never,
      config({
        JWT_ACCESS_SECRET: 'unit-test-secret',
        AUTH_LOGIN_MAX_FAILURES: '1',
        AUTH_LOGIN_LOCKOUT_WINDOW_MS: '60000',
      }) as never,
    );

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });
});

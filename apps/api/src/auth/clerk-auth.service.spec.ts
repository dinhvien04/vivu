import { UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthService } from './clerk-auth.service';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(),
  verifyToken: jest.fn(),
}));

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  };
}

const userRow = {
  id: 'user_1',
  clerkUserId: 'clerk_1',
  email: 'tester@example.com',
  name: 'Tester',
  role: 'user',
  avatarUrl: null,
  bio: null,
  location: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

describe('ClerkAuthService', () => {
  beforeEach(() => {
    jest.mocked(verifyToken).mockReset();
  });

  it('upserts a new Clerk user with the default DB user role', async () => {
    jest.mocked(verifyToken).mockResolvedValue({
      sub: 'clerk_1',
      email: 'tester@example.com',
      name: 'Tester',
    } as never);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValue(userRow),
      },
    };
    const service = new ClerkAuthService(
      prisma as never,
      config({ CLERK_JWT_KEY: 'test-jwt-key' }) as never,
    );

    const user = await service.authenticateToken('clerk-session-token', { upsert: true });

    expect(user.role).toBe('user');
    expect(user.clerkUserId).toBe('clerk_1');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerkUserId: 'clerk_1',
          email: 'tester@example.com',
          passwordHash: null,
        }),
      }),
    );
  });

  it('links an existing email match without overwriting admin/editor role', async () => {
    const existingAdmin = {
      ...userRow,
      email: 'admin@example.com',
      role: 'admin',
      clerkUserId: null,
    };
    const linkedAdmin = { ...existingAdmin, clerkUserId: 'clerk_admin' };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(existingAdmin),
        update: jest.fn().mockResolvedValue(linkedAdmin),
      },
    };
    const service = new ClerkAuthService(prisma as never, config({}) as never);

    const user = await service.upsertClerkUserProfile({
      clerkUserId: 'clerk_admin',
      email: 'admin@example.com',
      name: 'Admin',
      avatarUrl: null,
    });

    expect(user.role).toBe('admin');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ role: expect.anything() }),
      }),
    );
  });

  it('rejects requests without a Clerk session token', async () => {
    const service = new ClerkAuthService({} as never, config({ CLERK_JWT_KEY: 'key' }) as never);

    await expect(
      service.authenticateRequest({ headers: {} } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

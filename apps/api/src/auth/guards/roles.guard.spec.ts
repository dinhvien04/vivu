import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function contextWithRole(role?: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { id: 'user-1', email: 'u@example.com', role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('blocks a normal user from admin/editor guarded routes', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(['admin', 'editor']),
    } as never);

    expect(() => guard.canActivate(contextWithRole('user'))).toThrow(ForbiddenException);
  });

  it('allows an admin user through admin/editor guarded routes', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(['admin', 'editor']),
    } as never);

    expect(guard.canActivate(contextWithRole('admin'))).toBe(true);
  });
});

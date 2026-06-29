import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { firstValueFrom, isObservable } from 'rxjs';
import { ClerkAuthService } from '../clerk-auth.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly clerkAuth: ClerkAuthService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const clerkToken = this.clerkAuth.isConfigured()
      ? this.clerkAuth.extractSessionToken(request)
      : null;

    if (clerkToken) {
      try {
        request.user = await this.clerkAuth.authenticateToken(clerkToken.token);
        return true;
      } catch {
        // Optional auth stays optional; legacy JWT fallback below may still work.
      }
    }

    try {
      const result = super.canActivate(context);
      if (isObservable(result)) {
        await firstValueFrom(result);
      } else {
        await result;
      }
    } catch {
      // Optional auth: invalid or missing JWT should not block public endpoints.
    }
    return true;
  }

  override handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser | undefined {
    return user ?? undefined;
  }
}

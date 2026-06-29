import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { firstValueFrom, isObservable } from 'rxjs';
import { ClerkAuthService } from '../clerk-auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerkAuth: ClerkAuthService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const clerkToken = this.clerkAuth.isConfigured()
      ? this.clerkAuth.extractSessionToken(request)
      : null;

    if (clerkToken) {
      try {
        request.user = await this.clerkAuth.authenticateToken(clerkToken.token, {
          upsert: shouldUpsertClerkUser(request),
        });
        return true;
      } catch (err) {
        // Legacy JWTs also arrive as Authorization: Bearer tokens. If Clerk
        // verification does not match, let Passport try the old JWT strategy.
        if (clerkToken.source !== 'authorization') throw err;
      }
    }

    const result = super.canActivate(context);
    if (isObservable(result)) return firstValueFrom(result);
    return result instanceof Promise ? result : Boolean(result);
  }
}

function shouldUpsertClerkUser(request: FastifyRequest): boolean {
  const url = request.url ?? request.raw.url ?? '';
  return request.method === 'GET' && /\/auth\/me(?:\?|$)/.test(url);
}

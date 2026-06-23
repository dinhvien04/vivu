import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom, isObservable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
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

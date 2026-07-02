import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { next, origin } = request.query;

    const stateObj = {
      next: next || '/',
      origin: origin || 'http://localhost:3000',
    };

    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    return {
      state,
    };
  }
}

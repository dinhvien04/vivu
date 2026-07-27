import { CanActivate, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { isGoogleOAuthConfigured } from '../google-oauth.config';

@Injectable()
export class GoogleOAuthEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (!isGoogleOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'Google OAuth chưa được cấu hình trên server. Liên hệ quản trị viên.',
      );
    }
    return true;
  }
}

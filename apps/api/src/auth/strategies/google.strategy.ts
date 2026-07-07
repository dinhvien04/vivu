import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { readGoogleOAuthEnv } from '../google-oauth.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const env = readGoogleOAuthEnv();
    if (!env) {
      throw new Error('GoogleStrategy registered without Google OAuth configuration');
    }

    super({
      clientID: env.clientId,
      clientSecret: env.clientSecret,
      callbackURL: env.callbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    _req: unknown,
    _accessToken: string,
    _refreshToken: string,
    profile: {
      displayName?: string;
      name?: { familyName?: string; givenName?: string };
      emails?: Array<{ value?: string }>;
      photos?: Array<{ value?: string }>;
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;
    const email = emails?.[0]?.value;

    let displayName = profile.displayName;
    if (name) {
      const parts = [name.familyName, name.givenName].filter(Boolean);
      if (parts.length > 0) {
        displayName = parts.join(' ');
      }
    }

    const user = {
      email,
      name: displayName || 'Người dùng Google',
      avatarUrl: photos?.[0]?.value || null,
    };
    done(null, user);
  }
}

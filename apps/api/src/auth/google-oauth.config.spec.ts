import {
  assertGoogleOAuthEnvConsistency,
  isGoogleOAuthConfigured,
  readGoogleOAuthEnv,
} from './google-oauth.config';

describe('google-oauth.config', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects fully configured Google OAuth env', () => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/v1/auth/google/callback',
    };
    expect(isGoogleOAuthConfigured()).toBe(true);
    expect(readGoogleOAuthEnv()).toEqual({
      clientId: 'id',
      clientSecret: 'secret',
      callbackUrl: 'http://localhost:4000/api/v1/auth/google/callback',
    });
  });

  it('rejects partially configured Google OAuth env', () => {
    process.env = { ...originalEnv };
    process.env.GOOGLE_CLIENT_ID = 'id';
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK_URL;
    expect(() => assertGoogleOAuthEnvConsistency()).toThrow(/partially configured/i);
  });
});

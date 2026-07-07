export interface GoogleOAuthEnv {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

const GOOGLE_OAUTH_ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
] as const;

export function readGoogleOAuthEnv(): GoogleOAuthEnv | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (!clientId || !clientSecret || !callbackUrl) {
    return null;
  }
  return { clientId, clientSecret, callbackUrl };
}

export function isGoogleOAuthConfigured(): boolean {
  return readGoogleOAuthEnv() !== null;
}

export function missingGoogleOAuthEnvKeys(): string[] {
  return GOOGLE_OAUTH_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

/** Reject partially configured Google OAuth to avoid confusing runtime failures. */
export function assertGoogleOAuthEnvConsistency(): void {
  const missing = missingGoogleOAuthEnvKeys();
  if (missing.length > 0 && missing.length < GOOGLE_OAUTH_ENV_KEYS.length) {
    throw new Error(
      'Google OAuth is partially configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL together, or leave all three unset.',
    );
  }
}

export interface GoogleOAuthEnv {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

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

/** Reject partially configured Google OAuth to avoid confusing runtime failures. */
export function assertGoogleOAuthEnvConsistency(): void {
  const values = [
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    process.env.GOOGLE_CALLBACK_URL?.trim(),
  ];
  const present = values.filter(Boolean).length;
  if (present > 0 && present < 3) {
    throw new Error(
      'Google OAuth is partially configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL together, or leave all three unset.',
    );
  }
}

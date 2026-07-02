import { NextRequest, NextResponse } from 'next/server';
import { setRefreshCookie } from '../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const next = searchParams.get('next') || '/';

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ message: 'Missing tokens from Google callback' }, { status: 400 });
  }

  // Set the refresh token in httpOnly cookie
  await setRefreshCookie(refreshToken);

  // We redirect back to the app page. 
  // We can pass the accessToken via query param so the frontend auth provider can extract it immediately,
  // or redirect to a landing page. But wait, since our auth-provider checks the session via auth.refresh() 
  // on load, redirecting directly to `next` works, but it causes a slight delay because it has to call /api/auth/refresh.
  // Wait, let's see. If we redirect to `next`, the auth-provider will automatically fetch the new session.
  // This is completely clean and doesn't expose the accessToken in the browser history!
  // Let's redirect directly to `next`.
  const baseUrl = new URL(req.url).origin;
  const redirectUrl = new URL(next, baseUrl).toString();

  return NextResponse.redirect(redirectUrl);
}

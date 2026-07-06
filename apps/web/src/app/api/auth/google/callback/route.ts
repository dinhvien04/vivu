import { NextRequest, NextResponse } from 'next/server';
import { callApi, setRefreshCookie } from '../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.json({ message: 'Missing OAuth exchange code' }, { status: 400 });
  }

  const { status, body } = await callApi('/auth/oauth/exchange', {
    body: { code },
  });

  if (status !== 200 || !body || typeof body !== 'object') {
    return NextResponse.json(
      { message: 'OAuth exchange failed' },
      { status: status >= 400 ? status : 502 },
    );
  }

  const tokens = body as { accessToken?: string; refreshToken?: string };
  if (!tokens.refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token from OAuth exchange' }, { status: 502 });
  }

  await setRefreshCookie(tokens.refreshToken);

  const baseUrl = new URL(req.url).origin;
  const redirectUrl = new URL(next, baseUrl).toString();
  return NextResponse.redirect(redirectUrl);
}
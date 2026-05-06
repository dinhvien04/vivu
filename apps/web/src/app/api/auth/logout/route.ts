import { NextResponse } from 'next/server';
import { callApi, clearRefreshCookie, readRefreshCookie } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const refreshToken = readRefreshCookie();
  if (refreshToken) {
    await callApi('/auth/logout', { body: { refreshToken } }).catch(() => undefined);
  }
  clearRefreshCookie();
  return NextResponse.json({ ok: true }, { status: 200 });
}

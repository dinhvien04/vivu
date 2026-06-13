import { NextResponse } from 'next/server';
import {
  callApi,
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const refreshToken = readRefreshCookie();
  if (!refreshToken) return new NextResponse(null, { status: 204 });

  const { status, body } = await callApi('/auth/refresh', {
    body: { refreshToken },
  });
  if (status !== 200) {
    clearRefreshCookie();
    return NextResponse.json(body ?? { message: 'Phiên hết hạn' }, { status });
  }
  if (body && typeof body === 'object' && 'accessToken' in body && 'refreshToken' in body) {
    const tokens = body as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    setRefreshCookie(tokens.refreshToken);
    return NextResponse.json(
      {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      { status: 200 },
    );
  }
  clearRefreshCookie();
  return NextResponse.json({ message: 'Phiên không hợp lệ' }, { status: 401 });
}

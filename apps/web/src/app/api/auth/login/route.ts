import { NextResponse } from 'next/server';
import { callApi, setRefreshCookie, type ApiAuthSuccess } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/login', { body });
  if (status === 200 && data && typeof data === 'object' && 'tokens' in data) {
    const ok = data as ApiAuthSuccess;
    setRefreshCookie(ok.tokens.refreshToken);
    return NextResponse.json(
      {
        user: ok.user,
        accessToken: ok.tokens.accessToken,
        expiresIn: ok.tokens.expiresIn,
      },
      { status },
    );
  }
  return NextResponse.json(data ?? { message: 'Đăng nhập thất bại' }, { status });
}

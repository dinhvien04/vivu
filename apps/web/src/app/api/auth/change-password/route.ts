import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice('bearer '.length)
    : undefined;
  if (!bearer) {
    return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/change-password', {
    body,
    bearer,
  });
  if (status === 204) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json(data ?? { message: 'Đổi mật khẩu thất bại' }, { status });
}

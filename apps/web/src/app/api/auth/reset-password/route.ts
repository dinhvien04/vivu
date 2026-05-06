import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/reset-password', { body });
  if (status === 204) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json(data ?? { message: 'Đặt lại mật khẩu thất bại' }, {
    status,
  });
}

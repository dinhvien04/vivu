import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/forgot-password', { body });
  // Always return 204-equivalent payload to avoid email enumeration.
  if (status === 204 || status === 200) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json(data ?? { message: 'Yêu cầu thất bại' }, { status });
}

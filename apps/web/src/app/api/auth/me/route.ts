import { NextResponse } from 'next/server';
import { callApi, clearRefreshCookie } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function GET(req: Request) {
  const bearer = getBearer(req);
  if (!bearer) {
    return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  }
  const { status, body } = await callApi('/auth/me/profile', {
    method: 'GET',
    bearer,
  });
  return NextResponse.json(body, { status });
}

export async function PATCH(req: Request) {
  const bearer = getBearer(req);
  if (!bearer) {
    return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/me', {
    method: 'PATCH',
    body,
    bearer,
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(req: Request) {
  const bearer = getBearer(req);
  if (!bearer) {
    return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/auth/me', {
    method: 'DELETE',
    body,
    bearer,
  });
  if (status === 204) {
    clearRefreshCookie();
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json(data ?? { message: 'Xoá tài khoản thất bại' }, { status });
}

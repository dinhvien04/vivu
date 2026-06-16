import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi(`/reviews/${(await params).id}`, {
    method: 'PATCH',
    body,
    bearer,
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi(`/reviews/${(await params).id}`, {
    method: 'DELETE',
    bearer,
  });
  if (status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(body, { status });
}

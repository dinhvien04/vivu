import { NextResponse } from 'next/server';
import { callApi } from '../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const qs = url.search;
  const { status, body } = await callApi(`/places/${(await params).id}/reviews${qs}`, {
    method: 'GET',
  });
  return NextResponse.json(body, { status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi(`/places/${(await params).id}/reviews`, {
    method: 'POST',
    body,
    bearer,
  });
  return NextResponse.json(data, { status });
}

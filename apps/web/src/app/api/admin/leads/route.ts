import { NextResponse } from 'next/server';
import { callApi } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function GET(req: Request) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const qs = new URL(req.url).search;
  const { status, body } = await callApi(`/admin/leads${qs}`, { method: 'GET', bearer });
  return NextResponse.json(body, { status });
}

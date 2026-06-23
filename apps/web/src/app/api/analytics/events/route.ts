import { NextResponse } from 'next/server';
import { callApi } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/analytics/events', {
    method: 'POST',
    body,
    bearer: pickBearer(req),
  });

  return NextResponse.json(data, { status });
}

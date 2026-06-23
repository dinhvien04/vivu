import { NextResponse } from 'next/server';
import { callApi } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { status, body: data } = await callApi('/data-reports', {
    method: 'POST',
    body,
  });
  return NextResponse.json(data, { status });
}

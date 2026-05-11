import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search;
  const { status, body } = await callApi(`/search/suggest${qs}`, { method: 'GET' });
  return NextResponse.json(body, { status });
}

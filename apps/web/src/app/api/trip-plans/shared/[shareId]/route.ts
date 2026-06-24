import { NextResponse } from 'next/server';
import { callApi } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const { status, body } = await callApi(`/trip-plans/shared/${shareId}`, { method: 'GET' });
  return NextResponse.json(body, { status });
}

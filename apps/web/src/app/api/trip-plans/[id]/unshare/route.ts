import { NextResponse } from 'next/server';
import { callApi } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });

  const { id } = await params;
  const { status, body } = await callApi(`/trip-plans/${id}/unshare`, {
    method: 'POST',
    bearer,
  });
  return NextResponse.json(body, { status });
}

import { NextResponse } from 'next/server';
import { callApi } from '../../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice('bearer '.length)
    : undefined;
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi(`/admin/reviews/${(await params).id}/hide`, {
    method: 'POST',
    bearer,
  });
  return NextResponse.json(body, { status });
}

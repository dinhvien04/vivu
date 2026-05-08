import { NextResponse } from 'next/server';
import { callApi } from '../../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice('bearer '.length)
    : undefined;
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi(`/admin/places/${params.id}/publish`, {
    method: 'POST',
    bearer,
  });
  return NextResponse.json(body, { status });
}

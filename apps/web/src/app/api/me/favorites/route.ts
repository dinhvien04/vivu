import { NextResponse } from 'next/server';
import { callApi } from '../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice('bearer '.length)
    : undefined;
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi('/me/favorites', {
    method: 'GET',
    bearer,
  });
  return NextResponse.json(body, { status });
}

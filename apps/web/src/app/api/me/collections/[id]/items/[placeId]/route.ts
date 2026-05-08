import { NextResponse } from 'next/server';
import { callApi } from '../../../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pickBearer(req: Request): string | undefined {
  const auth = req.headers.get('authorization');
  return auth?.toLowerCase().startsWith('bearer ') ? auth.slice('bearer '.length) : undefined;
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; placeId: string } },
) {
  const bearer = pickBearer(req);
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi(`/me/collections/${params.id}/items/${params.placeId}`, {
    method: 'DELETE',
    bearer,
  });
  if (status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(body, { status });
}

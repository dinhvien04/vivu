import { NextResponse } from 'next/server';
import { callApi } from '../../../../../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; photoId: string } },
) {
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice('bearer '.length)
    : undefined;
  if (!bearer) return NextResponse.json({ message: 'Thiếu access token' }, { status: 401 });
  const { status, body } = await callApi(
    `/admin/places/${params.id}/photos/${params.photoId}`,
    {
      method: 'DELETE',
      bearer,
    },
  );
  // 204 returns no body
  if (status === 204) return new NextResponse(null, { status });
  return NextResponse.json(body, { status });
}

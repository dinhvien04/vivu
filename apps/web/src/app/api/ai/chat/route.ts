import { NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/api-base';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_BASE = getInternalApiBase();
const MAX_PROXY_BODY_BYTES = 4.25 * 1024 * 1024;

export async function POST(req: Request) {
  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json({ message: 'Ảnh vượt quá giới hạn 4MB.' }, { status: 413 });
  }

  const body = await req.arrayBuffer();
  if (body.byteLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json({ message: 'Ảnh vượt quá giới hạn 4MB.' }, { status: 413 });
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'content-type': req.headers.get('content-type') ?? 'multipart/form-data',
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(60_000),
    });
    const responseBody = await upstream.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối tới dịch vụ AI. Vui lòng thử lại.' },
      { status: 502 },
    );
  }
}

import { NextResponse } from 'next/server';
import { getBuildInfo } from '@/lib/build-info';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getBuildInfo(), {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=60',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const downloadLocation: unknown = body?.downloadLocation;
  if (typeof downloadLocation !== 'string' || !downloadLocation)
    return NextResponse.json(
      { error: 'downloadLocation required' },
      { status: 400 }
    );

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (key) {
    fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

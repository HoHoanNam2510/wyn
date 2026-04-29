import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchUnsplash } from '@/lib/unsplash';
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = rateLimit(
    `unsplashSearch:${session.user.id}`,
    RATE_LIMITS.unsplashSearch.limit,
    RATE_LIMITS.unsplashSearch.windowMs
  );
  if (!allowed)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const photos = await searchUnsplash(q);
  return NextResponse.json({ photos });
}

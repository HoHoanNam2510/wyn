import { NextRequest, NextResponse } from 'next/server';
import { searchUnsplash } from '@/lib/unsplash';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
  const photos = await searchUnsplash(q);
  return NextResponse.json({ photos });
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchDictionary } from '@/lib/dictionary';

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('term');
  if (!term)
    return NextResponse.json({ error: 'term required' }, { status: 400 });
  const contexts = await fetchDictionary(term);
  return NextResponse.json({ contexts });
}

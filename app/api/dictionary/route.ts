import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchDictionary } from '@/lib/dictionary';
import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = rateLimit(
    `dictionaryFetch:${session.user.id}`,
    RATE_LIMITS.dictionaryFetch.limit,
    RATE_LIMITS.dictionaryFetch.windowMs
  );
  if (!allowed)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const term = req.nextUrl.searchParams.get('term');
  if (!term)
    return NextResponse.json({ error: 'term required' }, { status: 400 });

  const contexts = await fetchDictionary(term, session.user.id);
  return NextResponse.json({ contexts });
}

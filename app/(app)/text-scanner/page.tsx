import { redirect } from 'next/navigation';
import { ScanText } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { WordEntry } from '@/lib/text-scanner';
import { ScannerClient } from './scanner-client';

export default async function TextScannerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const [words, reviewStats] = await Promise.all([
    db.word.findMany({
      where: { userId },
      select: {
        id: true,
        term: true,
        contexts: {
          take: 1,
          orderBy: { order: 'asc' },
          select: { meaning: true, partOfSpeech: true },
        },
      },
    }),
    db.$queryRaw<{ wordid: string; total: number; accuracy: number }[]>`
      SELECT "wordId" as wordid, COUNT(*)::int as total,
             AVG(CASE WHEN correct THEN 1.0 ELSE 0.0 END) as accuracy
      FROM "ReviewEvent"
      WHERE "userId" = ${userId}
      GROUP BY "wordId"
    `,
  ]);

  const reviewMap = new Map(reviewStats.map((r) => [r.wordid, r]));

  const wordMap: Record<string, WordEntry> = {};
  for (const word of words) {
    const stats = reviewMap.get(word.id);
    const isMastered = !!stats && stats.total >= 5 && stats.accuracy >= 0.8;
    const ctx = word.contexts[0];
    wordMap[word.term.toLowerCase()] = {
      id: word.id,
      term: word.term,
      status: isMastered ? 'mastered' : 'learning',
      meaning: ctx?.meaning ?? null,
      partOfSpeech: ctx?.partOfSpeech ?? null,
    };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ScanText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Text Scanner</h1>
          <p className="text-sm text-muted-foreground">
            Paste any English text to see your vocabulary highlighted
          </p>
        </div>
      </div>
      <ScannerClient wordMap={wordMap} />
    </div>
  );
}

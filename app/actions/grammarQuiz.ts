'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function logGrammarReviewEvent({
  patternId,
  correct,
  durationMs,
}: {
  patternId: string;
  correct: boolean;
  durationMs: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.grammarReviewEvent.create({
    data: { userId: session.user.id, patternId, correct, durationMs },
  });
}

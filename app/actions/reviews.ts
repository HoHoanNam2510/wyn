'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function logReviewEvent({
  wordId,
  mode,
  correct,
  durationMs,
}: {
  wordId: string;
  mode: 'flashcard' | 'fill_blank';
  correct: boolean;
  durationMs: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.reviewEvent.create({
    data: {
      userId: session.user.id,
      wordId,
      mode,
      correct,
      durationMs,
    },
  });
}

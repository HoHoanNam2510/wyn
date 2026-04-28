'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { computeNextSrs } from '@/lib/srs';
import type { SrsGrade } from '@/lib/srs';

export async function updateWordSRS(
  wordId: string,
  grade: SrsGrade
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;

  const word = await db.word.findUnique({
    where: { id: wordId },
    select: {
      userId: true,
      srsRepetitions: true,
      srsInterval: true,
      srsEaseFactor: true,
    },
  });

  if (!word || word.userId !== userId) throw new Error('Not found');

  const next = computeNextSrs(
    {
      repetitions: word.srsRepetitions,
      interval: word.srsInterval,
      easeFactor: word.srsEaseFactor,
    },
    grade
  );

  await db.word.update({
    where: { id: wordId },
    data: {
      srsRepetitions: next.repetitions,
      srsInterval: next.interval,
      srsEaseFactor: next.easeFactor,
      nextReviewAt: next.nextReviewAt,
    },
  });

  await db.reviewEvent.create({
    data: {
      userId,
      wordId,
      mode: 'srs',
      correct: grade !== 'again',
      durationMs: 0,
    },
  });
}

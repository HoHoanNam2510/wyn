'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function logIdiomReviewEvent({
  idiomId,
  correct,
  durationMs,
}: {
  idiomId: string;
  correct: boolean;
  durationMs: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.idiomReviewEvent.create({
    data: { userId: session.user.id, idiomId, correct, durationMs },
  });
}

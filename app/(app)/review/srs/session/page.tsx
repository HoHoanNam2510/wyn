import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SrsQuestion } from '@/lib/review/pickQuestions';
import { SrsSessionClient } from './session-client';

export default async function SrsSessionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const now = new Date();

  const dueWords = await db.word.findMany({
    where: {
      userId,
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    include: {
      contexts: {
        orderBy: { order: 'asc' },
        take: 1,
        include: {
          examples: { take: 3 },
        },
      },
    },
    orderBy: { nextReviewAt: 'asc' },
  });

  if (dueWords.length === 0) redirect('/review/srs');

  const questions: SrsQuestion[] = dueWords
    .filter((w) => w.contexts.length > 0)
    .map((w) => {
      const ctx = w.contexts[0];
      return {
        type: 'srs',
        wordId: w.id,
        term: w.term,
        imageUrl: w.imageUrl,
        meaning: ctx.meaning,
        partOfSpeech: ctx.partOfSpeech,
        phonetic: ctx.phonetic,
        audioUrl: ctx.audioUrl,
        exampleSentences: ctx.examples.map((e) => e.text),
        srsState: {
          repetitions: w.srsRepetitions,
          interval: w.srsInterval,
          easeFactor: w.srsEaseFactor,
        },
      };
    });

  if (questions.length === 0) redirect('/review/srs');

  return <SrsSessionClient questions={questions} />;
}

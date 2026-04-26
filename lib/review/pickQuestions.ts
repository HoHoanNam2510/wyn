import { db } from '@/lib/db';

export type FlashcardQuestion = {
  type: 'flashcard';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  choices: string[];
  correctChoice: string;
};

export type FillBlankQuestion = {
  type: 'fill_blank';
  wordId: string;
  term: string;
  sentence: string;
};

export type ReviewQuestion = FlashcardQuestion | FillBlankQuestion;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function pickQuestions({
  userId,
  mode,
  categoryId,
  count,
}: {
  userId: string;
  mode: 'flashcard' | 'fill_blank';
  categoryId: string;
  count: number | 'all';
}): Promise<ReviewQuestion[]> {
  const categoryFilter =
    categoryId !== 'all' ? { categories: { some: { categoryId } } } : {};

  const words = await db.word.findMany({
    where: { userId, ...categoryFilter },
    include: {
      contexts: {
        orderBy: { order: 'asc' },
        include: { examples: true },
      },
    },
  });

  if (mode === 'flashcard') {
    const eligible = words.filter((w) => w.contexts.length > 0);
    if (eligible.length === 0) return [];

    const allTerms = eligible.map((w) => w.term);
    const pool = shuffle(eligible);
    const selected = count === 'all' ? pool : pool.slice(0, count);

    return selected.map((word): FlashcardQuestion => {
      const ctx = word.contexts[0];
      const distractors = shuffle(
        allTerms.filter((t) => t !== word.term)
      ).slice(0, 3);
      const choices = shuffle([word.term, ...distractors]);

      return {
        type: 'flashcard',
        wordId: word.id,
        term: word.term,
        imageUrl: word.imageUrl,
        meaning: ctx.meaning,
        partOfSpeech: ctx.partOfSpeech,
        choices,
        correctChoice: word.term,
      };
    });
  } else {
    const eligible: {
      wordId: string;
      term: string;
      examples: { text: string }[];
    }[] = [];

    for (const word of words) {
      const termRegex = new RegExp(
        word.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const matchingExamples = word.contexts
        .flatMap((c) => c.examples)
        .filter((ex) => termRegex.test(ex.text));

      if (matchingExamples.length > 0) {
        eligible.push({
          wordId: word.id,
          term: word.term,
          examples: matchingExamples,
        });
      }
    }

    if (eligible.length === 0) return [];

    const pool = shuffle(eligible);
    const selected = count === 'all' ? pool : pool.slice(0, count);

    return selected.map(({ wordId, term, examples }): FillBlankQuestion => {
      const example = examples[Math.floor(Math.random() * examples.length)];
      // Replace first occurrence only — keeps sentence readable
      const termRegex = new RegExp(
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const sentence = example.text.replace(termRegex, '_______');

      return { type: 'fill_blank', wordId, term, sentence };
    });
  }
}

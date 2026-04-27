import { db } from '@/lib/db';

export type FlashcardQuestion = {
  type: 'flashcard';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  choices: string[];
  correctChoice: string;
};

export type FillBlankQuestion = {
  type: 'fill_blank';
  wordId: string;
  term: string;
  sentence: string;
  partOfSpeech: string;
  meaning: string;
  phonetic: string | null;
  audioUrl: string | null;
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
        phonetic: ctx.phonetic,
        audioUrl: ctx.audioUrl,
        choices,
        correctChoice: word.term,
      };
    });
  } else {
    const eligible: {
      wordId: string;
      term: string;
      examples: {
        text: string;
        partOfSpeech: string;
        meaning: string;
        phonetic: string | null;
        audioUrl: string | null;
      }[];
    }[] = [];

    for (const word of words) {
      const termRegex = new RegExp(
        word.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const matchingExamples: {
        text: string;
        partOfSpeech: string;
        meaning: string;
        phonetic: string | null;
        audioUrl: string | null;
      }[] = [];
      for (const ctx of word.contexts) {
        for (const ex of ctx.examples) {
          if (termRegex.test(ex.text)) {
            matchingExamples.push({
              text: ex.text,
              partOfSpeech: ctx.partOfSpeech,
              meaning: ctx.meaning,
              phonetic: ctx.phonetic,
              audioUrl: ctx.audioUrl,
            });
          }
        }
      }

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

      return {
        type: 'fill_blank',
        wordId,
        term,
        sentence,
        partOfSpeech: example.partOfSpeech,
        meaning: example.meaning,
        phonetic: example.phonetic,
        audioUrl: example.audioUrl,
      };
    });
  }
}

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

export type SentenceBuildQuestion = {
  type: 'sentence_build';
  wordId: string;
  term: string;
  tokens: string[];
  answer: string;
  meaning: string;
  partOfSpeech: string;
};

export type WritingPracticeQuestion = {
  type: 'writing_practice';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  exampleSentences: string[];
};

export type SrsQuestion = {
  type: 'srs';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  exampleSentences: string[];
  srsState: { repetitions: number; interval: number; easeFactor: number };
};

export type ReviewQuestion =
  | FlashcardQuestion
  | FillBlankQuestion
  | SentenceBuildQuestion
  | WritingPracticeQuestion;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Weight based on how recently the word was last reviewed (across all modes).
// Never reviewed → highest priority; reviewed < 1 hour ago → lowest.
function recencyWeight(lastReviewedAt: Date | undefined): number {
  if (!lastReviewedAt) return 10;
  const hoursAgo = (Date.now() - lastReviewedAt.getTime()) / 3_600_000;
  if (hoursAgo < 1) return 1;
  if (hoursAgo < 24) return 3;
  if (hoursAgo < 72) return 6;
  return 10;
}

function weightedSample<T>(
  items: T[],
  getWeight: (item: T) => number,
  n: number
): T[] {
  if (n >= items.length) return shuffle(items);
  const result: T[] = [];
  const pool = [...items];
  while (result.length < n && pool.length > 0) {
    const weights = pool.map(getWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    result.push(pool[chosen]);
    pool.splice(chosen, 1);
  }
  return result;
}

// Samples `count` items from `eligible`, preferring words reviewed least recently.
// Items must have a `wordId` field for the recency lookup.
async function sampleWithRecency<T extends { wordId: string }>(
  eligible: T[],
  userId: string,
  count: number | 'all'
): Promise<T[]> {
  if (eligible.length === 0) return [];
  if (count === 'all') return shuffle(eligible);

  const wordIds = eligible.map((e) => e.wordId);
  const recentEvents = await db.reviewEvent.findMany({
    where: { userId, wordId: { in: wordIds } },
    orderBy: { reviewedAt: 'desc' },
    distinct: ['wordId'],
    select: { wordId: true, reviewedAt: true },
  });

  const lastReviewedMap = new Map<string, Date>(
    recentEvents.map((e) => [e.wordId, e.reviewedAt])
  );

  return weightedSample(
    eligible,
    (item) => recencyWeight(lastReviewedMap.get(item.wordId)),
    count
  );
}

export async function pickQuestions({
  userId,
  mode,
  categoryId,
  count,
}: {
  userId: string;
  mode: 'flashcard' | 'fill_blank' | 'sentence_build' | 'writing_practice';
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
    const eligibleWords = words.filter((w) => w.contexts.length > 0);
    if (eligibleWords.length === 0) return [];

    const allTerms = eligibleWords.map((w) => w.term);
    const eligible = eligibleWords.map((w) => ({ wordId: w.id, word: w }));
    const selected = await sampleWithRecency(eligible, userId, count);

    return selected.map(({ word }): FlashcardQuestion => {
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
  } else if (mode === 'fill_blank') {
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

    const selected = await sampleWithRecency(eligible, userId, count);

    return selected.map(({ wordId, term, examples }): FillBlankQuestion => {
      const example = examples[Math.floor(Math.random() * examples.length)];
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
  } else if (mode === 'writing_practice') {
    const eligibleWords = words.filter((w) =>
      w.contexts.some((ctx) => ctx.examples.length > 0)
    );
    if (eligibleWords.length === 0) return [];

    const eligible = eligibleWords.map((w) => ({ wordId: w.id, word: w }));
    const selected = await sampleWithRecency(eligible, userId, count);

    return selected.map(({ word }): WritingPracticeQuestion => {
      const ctx = word.contexts[0];
      const sentences: string[] = [];
      for (const c of word.contexts) {
        for (const ex of c.examples) {
          if (sentences.length >= 3) break;
          sentences.push(ex.text);
        }
        if (sentences.length >= 3) break;
      }
      return {
        type: 'writing_practice',
        wordId: word.id,
        term: word.term,
        imageUrl: word.imageUrl,
        meaning: ctx.meaning,
        partOfSpeech: ctx.partOfSpeech,
        phonetic: ctx.phonetic,
        audioUrl: ctx.audioUrl,
        exampleSentences: sentences,
      };
    });
  } else {
    // sentence_build
    const eligible: {
      wordId: string;
      term: string;
      candidates: {
        text: string;
        tokens: string[];
        partOfSpeech: string;
        meaning: string;
      }[];
    }[] = [];

    for (const word of words) {
      const termRegex = new RegExp(
        word.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const candidates: {
        text: string;
        tokens: string[];
        partOfSpeech: string;
        meaning: string;
      }[] = [];

      for (const ctx of word.contexts) {
        for (const ex of ctx.examples) {
          if (termRegex.test(ex.text)) {
            const tokens = ex.text.split(' ');
            if (tokens.length >= 5 && tokens.length <= 15) {
              candidates.push({
                text: ex.text,
                tokens,
                partOfSpeech: ctx.partOfSpeech,
                meaning: ctx.meaning,
              });
            }
          }
        }
      }

      if (candidates.length > 0) {
        eligible.push({ wordId: word.id, term: word.term, candidates });
      }
    }

    if (eligible.length === 0) return [];

    const selected = await sampleWithRecency(eligible, userId, count);

    return selected.map(
      ({ wordId, term, candidates }): SentenceBuildQuestion => {
        const candidate =
          candidates[Math.floor(Math.random() * candidates.length)];
        return {
          type: 'sentence_build',
          wordId,
          term,
          tokens: shuffle(candidate.tokens),
          answer: candidate.text,
          meaning: candidate.meaning,
          partOfSpeech: candidate.partOfSpeech,
        };
      }
    );
  }
}

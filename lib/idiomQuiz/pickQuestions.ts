import { db } from '@/lib/db';

export type IdiomQuizQuestion = {
  exampleId: string;
  sentence: string;
  correctIdiomId: string;
  correctIdiomPhrase: string;
  correctIdiomExplanation: string;
  choices: { id: string; phrase: string }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function pickIdiomQuizQuestions({
  categoryId,
  count,
}: {
  categoryId: string | 'all';
  count: number | 'all';
}): Promise<IdiomQuizQuestion[]> {
  const allIdioms = await db.idiom.findMany({
    include: {
      examples: { select: { id: true, sentence: true } },
    },
  });

  const targetIdioms = allIdioms.filter(
    (i) =>
      (categoryId === 'all' || i.categoryId === categoryId) &&
      i.examples.length > 0
  );

  if (targetIdioms.length === 0) return [];

  const pool = shuffle(
    targetIdioms.flatMap((i) =>
      i.examples.map((ex) => ({ example: ex, idiom: i }))
    )
  );
  const selected = count === 'all' ? pool : pool.slice(0, count);

  return selected.map(({ example, idiom }) => {
    const others = allIdioms.filter((i) => i.id !== idiom.id);
    // Prefer distractors from a different category to reduce ambiguity
    const crossCategory = others.filter(
      (i) => i.categoryId !== idiom.categoryId
    );
    const distractorPool = crossCategory.length >= 3 ? crossCategory : others;
    const distractors = shuffle(distractorPool).slice(0, 3);

    const choices = shuffle([
      { id: idiom.id, phrase: idiom.phrase },
      ...distractors.map((d) => ({ id: d.id, phrase: d.phrase })),
    ]);

    return {
      exampleId: example.id,
      sentence: example.sentence,
      correctIdiomId: idiom.id,
      correctIdiomPhrase: idiom.phrase,
      correctIdiomExplanation: idiom.explanation,
      choices,
    };
  });
}

import { db } from '@/lib/db';
import type { FormulaChunk } from '@/components/grammar/formula-display';

export type GrammarQuizQuestion = {
  exampleId: string;
  sentence: string;
  correctPatternId: string;
  correctPatternTitle: string;
  correctPatternFormula: FormulaChunk[];
  choices: { id: string; title: string }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function pickGrammarQuizQuestions({
  sectionId,
  count,
}: {
  sectionId: string | 'all';
  count: number | 'all';
}): Promise<GrammarQuizQuestion[]> {
  const allPatterns = await db.grammarPattern.findMany({
    include: {
      examples: { select: { id: true, sentence: true } },
    },
  });

  // Patterns with at least one example, optionally filtered to a section
  const targetPatterns = allPatterns.filter(
    (p) =>
      (sectionId === 'all' || p.sectionId === sectionId) &&
      p.examples.length > 0
  );

  if (targetPatterns.length === 0) return [];

  // Flatten to (example, pattern) pairs, shuffle, then slice
  const pool = shuffle(
    targetPatterns.flatMap((p) =>
      p.examples.map((ex) => ({ example: ex, pattern: p }))
    )
  );
  const selected = count === 'all' ? pool : pool.slice(0, count);

  return selected.map(({ example, pattern }) => {
    const otherPatterns = allPatterns.filter((p) => p.id !== pattern.id);
    // Prefer distractors from a different section to avoid same-section ambiguity
    const crossSection = otherPatterns.filter(
      (p) => p.sectionId !== pattern.sectionId
    );
    const distractorPool =
      crossSection.length >= 3 ? crossSection : otherPatterns;
    const distractors = shuffle(distractorPool).slice(0, 3);

    const choices = shuffle([
      { id: pattern.id, title: pattern.title },
      ...distractors.map((d) => ({ id: d.id, title: d.title })),
    ]);

    return {
      exampleId: example.id,
      sentence: example.sentence,
      correctPatternId: pattern.id,
      correctPatternTitle: pattern.title,
      correctPatternFormula: pattern.formula as FormulaChunk[],
      choices,
    };
  });
}

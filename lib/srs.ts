export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';

const GRADE_QUALITY: Record<SrsGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

function midnight(daysFromNow: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d;
}

export function computeNextSrs(
  state: { repetitions: number; interval: number; easeFactor: number },
  grade: SrsGrade
): {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewAt: Date;
} {
  const q = GRADE_QUALITY[grade];

  let { repetitions, interval, easeFactor } = state;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  return {
    repetitions,
    interval,
    easeFactor,
    nextReviewAt: midnight(interval),
  };
}

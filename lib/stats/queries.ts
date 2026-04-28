import { db } from '@/lib/db';

export type DayStat = { day: string; count: number };
export type DayAccuracy = { day: string; accuracy: number | null };
export type WordStruggleStat = {
  wordId: string;
  term: string;
  accuracy: number;
  totalReviews: number;
};
export type CategoryStat = { name: string; color: string; count: number };

export type GrammarSectionAccuracyStat = {
  sectionTitle: string;
  accuracy: number;
  totalAttempts: number;
};
export type GrammarPatternStruggleStat = {
  patternId: string;
  patternTitle: string;
  sectionTitle: string;
  accuracy: number;
  totalAttempts: number;
};

export type StatsData = {
  wordsPerDay: DayStat[];
  reviewsPerDay: DayStat[];
  accuracyPerDay: DayAccuracy[];
  streak: number;
  totalWords: number;
  masteredWords: number;
  srsDueToday: number;
  strugglingWords: WordStruggleStat[];
  wordsPerCategory: CategoryStat[];
  grammarTotalAnswers: number;
  grammarOverallAccuracy: number | null;
  grammarAccuracyPerSection: GrammarSectionAccuracyStat[];
  grammarStrugglingPatterns: GrammarPatternStruggleStat[];
};

function last30DayKeys(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function computeStreak(activeDays: string[]): number {
  if (activeDays.length === 0) return 0;
  const set = new Set(activeDays);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today has no reviews yet — streak may still be alive from yesterday
    } else {
      break;
    }
  }
  return streak;
}

export async function fetchStats(userId: string): Promise<StatsData> {
  const days = last30DayKeys();
  const cutoff = new Date(days[0]);

  const [
    wordsRaw,
    reviewsRaw,
    accuracyRaw,
    streakDaysRaw,
    masteredCountRaw,
    strugglingRaw,
    categories,
    totalWords,
    uncategorizedCount,
    grammarOverallRaw,
    grammarPerSectionRaw,
    grammarStrugglingRaw,
    srsDueRaw,
  ] = await Promise.all([
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT
        to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM "Word"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${cutoff}
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT
        to_char(date_trunc('day', "reviewedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM "ReviewEvent"
      WHERE "userId" = ${userId}
        AND "reviewedAt" >= ${cutoff}
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<{ day: string; accuracy: number }[]>`
      SELECT
        to_char(date_trunc('day', "reviewedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        ROUND(AVG(CASE WHEN correct THEN 100.0 ELSE 0.0 END))::int AS accuracy
      FROM "ReviewEvent"
      WHERE "userId" = ${userId}
        AND "reviewedAt" >= ${cutoff}
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT
        to_char(date_trunc('day', "reviewedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day
      FROM "ReviewEvent"
      WHERE "userId" = ${userId}
    `,
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT w.id
        FROM "Word" w
        JOIN "ReviewEvent" r ON r."wordId" = w.id
        WHERE w."userId" = ${userId}
        GROUP BY w.id
        HAVING COUNT(*) >= 5
           AND AVG(CASE WHEN r.correct THEN 1.0 ELSE 0.0 END) >= 0.8
      ) sub
    `,
    db.$queryRaw<
      { wordid: string; term: string; accuracy: number; totalreviews: number }[]
    >`
      SELECT
        w.id AS wordid,
        w.term,
        ROUND(AVG(CASE WHEN r.correct THEN 100.0 ELSE 0.0 END))::int AS accuracy,
        COUNT(*)::int AS totalreviews
      FROM "Word" w
      JOIN "ReviewEvent" r ON r."wordId" = w.id
      WHERE w."userId" = ${userId}
      GROUP BY w.id, w.term
      HAVING COUNT(*) >= 3
         AND AVG(CASE WHEN r.correct THEN 1.0 ELSE 0.0 END) < 0.5
      ORDER BY AVG(CASE WHEN r.correct THEN 1.0 ELSE 0.0 END) ASC
      LIMIT 10
    `,
    db.category.findMany({
      where: { userId },
      include: { _count: { select: { words: true } } },
      orderBy: { name: 'asc' },
    }),
    db.word.count({ where: { userId } }),
    db.word.count({ where: { userId, categories: { none: {} } } }),
    db.$queryRaw<{ totalanswers: number; overallaccuracy: number | null }[]>`
      SELECT
        COUNT(*)::int AS totalanswers,
        CASE WHEN COUNT(*) > 0
          THEN ROUND(AVG(CASE WHEN correct THEN 100.0 ELSE 0.0 END))::int
          ELSE NULL
        END AS overallaccuracy
      FROM "GrammarReviewEvent"
      WHERE "userId" = ${userId}
    `,
    db.$queryRaw<
      { sectiontitle: string; accuracy: number; totalattempts: number }[]
    >`
      SELECT
        gs.title AS sectiontitle,
        ROUND(AVG(CASE WHEN gre.correct THEN 100.0 ELSE 0.0 END))::int AS accuracy,
        COUNT(*)::int AS totalattempts
      FROM "GrammarReviewEvent" gre
      JOIN "GrammarPattern" gp ON gp.id = gre."patternId"
      JOIN "GrammarSection" gs ON gs.id = gp."sectionId"
      WHERE gre."userId" = ${userId}
      GROUP BY gs.id, gs.title, gs.order
      ORDER BY gs.order
    `,
    db.$queryRaw<
      {
        patternid: string;
        patterntitle: string;
        sectiontitle: string;
        accuracy: number;
        totalattempts: number;
      }[]
    >`
      SELECT
        gp.id AS patternid,
        gp.title AS patterntitle,
        gs.title AS sectiontitle,
        ROUND(AVG(CASE WHEN gre.correct THEN 100.0 ELSE 0.0 END))::int AS accuracy,
        COUNT(*)::int AS totalattempts
      FROM "GrammarReviewEvent" gre
      JOIN "GrammarPattern" gp ON gp.id = gre."patternId"
      JOIN "GrammarSection" gs ON gs.id = gp."sectionId"
      WHERE gre."userId" = ${userId}
      GROUP BY gp.id, gp.title, gs.title
      HAVING COUNT(*) >= 3
         AND AVG(CASE WHEN gre.correct THEN 1.0 ELSE 0.0 END) < 0.5
      ORDER BY AVG(CASE WHEN gre.correct THEN 1.0 ELSE 0.0 END) ASC
      LIMIT 5
    `,
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM "Word"
      WHERE "userId" = ${userId}
        AND ("nextReviewAt" IS NULL OR "nextReviewAt" <= NOW())
    `,
  ]);

  const wordsMap = new Map(wordsRaw.map((r) => [r.day, r.count]));
  const reviewsMap = new Map(reviewsRaw.map((r) => [r.day, r.count]));
  const accuracyMap = new Map(accuracyRaw.map((r) => [r.day, r.accuracy]));

  const wordsPerCategory: CategoryStat[] = [
    ...categories
      .filter((c) => c._count.words > 0)
      .map((c) => ({ name: c.name, color: c.color, count: c._count.words })),
    ...(uncategorizedCount > 0
      ? [{ name: 'Uncategorized', color: '#9a8488', count: uncategorizedCount }]
      : []),
  ];

  const grammarOverall = grammarOverallRaw[0];

  return {
    wordsPerDay: days.map((day) => ({ day, count: wordsMap.get(day) ?? 0 })),
    reviewsPerDay: days.map((day) => ({
      day,
      count: reviewsMap.get(day) ?? 0,
    })),
    accuracyPerDay: days.map((day) => ({
      day,
      accuracy: accuracyMap.has(day) ? (accuracyMap.get(day) ?? null) : null,
    })),
    streak: computeStreak(streakDaysRaw.map((r) => r.day)),
    totalWords,
    masteredWords: masteredCountRaw[0]?.count ?? 0,
    srsDueToday: srsDueRaw[0]?.count ?? 0,
    strugglingWords: strugglingRaw.map((r) => ({
      wordId: r.wordid,
      term: r.term,
      accuracy: r.accuracy,
      totalReviews: r.totalreviews,
    })),
    wordsPerCategory,
    grammarTotalAnswers: grammarOverall?.totalanswers ?? 0,
    grammarOverallAccuracy: grammarOverall?.overallaccuracy ?? null,
    grammarAccuracyPerSection: grammarPerSectionRaw.map((r) => ({
      sectionTitle: r.sectiontitle,
      accuracy: r.accuracy,
      totalAttempts: r.totalattempts,
    })),
    grammarStrugglingPatterns: grammarStrugglingRaw.map((r) => ({
      patternId: r.patternid,
      patternTitle: r.patterntitle,
      sectionTitle: r.sectiontitle,
      accuracy: r.accuracy,
      totalAttempts: r.totalattempts,
    })),
  };
}

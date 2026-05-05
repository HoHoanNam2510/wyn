import { db } from '@/lib/db';
import type { ReviewMode } from '@/app/generated/prisma/client';

type DayStat = { day: string; count: number };

function fillDays(raw: { day: string; count: number }[], days = 30): DayStat[] {
  const map = new Map(raw.map((r) => [r.day, Number(r.count)]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const day = d.toISOString().slice(0, 10);
    return { day, count: map.get(day) ?? 0 };
  });
}

export type AdminDashboardStats = {
  totalUsers: number;
  totalWords: number;
  totalReviews: number;
  openFeedback: number;
  activeUsers7d: number;
  avgCategoriesPerUser: number;
  wordsWithCategoryPct: number;
  usersPerDay: DayStat[];
  wordsPerDay: DayStat[];
  reviewsPerDay: DayStat[];
  recentAuditLogs: {
    id: string;
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: unknown;
    createdAt: Date;
  }[];
};

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [
    totalUsers,
    totalWords,
    totalReviews,
    openFeedback,
    activeUsers7dRaw,
    totalCategories,
    wordsWithCategoryRaw,
    usersPerDayRaw,
    wordsPerDayRaw,
    reviewsPerDayRaw,
    recentAuditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.word.count(),
    db.reviewEvent.count(),
    db.feedback.count({ where: { status: 'OPEN' } }),
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT "userId")::int AS count
      FROM (
        SELECT "userId" FROM "ReviewEvent" WHERE "reviewedAt" >= ${sevenDaysAgo}
        UNION ALL
        SELECT "userId" FROM "GrammarReviewEvent" WHERE "reviewedAt" >= ${sevenDaysAgo}
        UNION ALL
        SELECT "userId" FROM "IdiomReviewEvent" WHERE "reviewedAt" >= ${sevenDaysAgo}
      ) sub
    `,
    db.category.count(),
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT "wordId")::int AS count FROM "WordCategory"
    `,
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT DATE("createdAt")::text AS day, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day
    `,
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT DATE("createdAt")::text AS day, COUNT(*)::int AS count
      FROM "Word"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day
    `,
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT DATE("reviewedAt")::text AS day, COUNT(*)::int AS count
      FROM "ReviewEvent"
      WHERE "reviewedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("reviewedAt")
      ORDER BY day
    `,
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const wordsWithCategory = Number(wordsWithCategoryRaw[0]?.count ?? 0);

  return {
    totalUsers,
    totalWords,
    totalReviews,
    openFeedback,
    activeUsers7d: Number(activeUsers7dRaw[0]?.count ?? 0),
    avgCategoriesPerUser:
      totalUsers > 0
        ? Math.round((Number(totalCategories) / totalUsers) * 10) / 10
        : 0,
    wordsWithCategoryPct:
      totalWords > 0 ? Math.round((wordsWithCategory / totalWords) * 100) : 0,
    usersPerDay: fillDays(usersPerDayRaw),
    wordsPerDay: fillDays(wordsPerDayRaw),
    reviewsPerDay: fillDays(reviewsPerDayRaw),
    recentAuditLogs,
  };
}

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  _count: { words: number; reviewEvents: number };
};

export async function fetchAdminUsers(
  page: number,
  pageSize = 20
): Promise<{ users: AdminUser[]; total: number }> {
  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        _count: { select: { words: true, reviewEvents: true } },
      },
    }),
    db.user.count(),
  ]);
  return { users, total };
}

export type AdminWord = {
  id: string;
  term: string;
  createdAt: Date;
  user: { email: string };
  contexts: {
    partOfSpeech: string;
    phonetic: string | null;
    meaning: string;
  }[];
};

export async function fetchAdminWords(
  page: number,
  q: string,
  pageSize = 30
): Promise<{ words: AdminWord[]; total: number }> {
  const where = q
    ? { term: { contains: q, mode: 'insensitive' as const } }
    : {};
  const [words, total] = await Promise.all([
    db.word.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        term: true,
        createdAt: true,
        user: { select: { email: true } },
        contexts: {
          orderBy: { order: 'asc' },
          take: 1,
          select: { partOfSpeech: true, phonetic: true, meaning: true },
        },
      },
    }),
    db.word.count({ where }),
  ]);
  return { words, total };
}

export type AdminFeedback = {
  id: string;
  type: string;
  content: string;
  status: string;
  createdAt: Date;
  user: { email: string } | null;
};

export type FeedbackStatusFilter = 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'ALL';

export async function fetchAdminFeedback(
  page: number,
  status: FeedbackStatusFilter,
  pageSize = 25
): Promise<{ feedbacks: AdminFeedback[]; total: number }> {
  const where =
    status !== 'ALL'
      ? { status: status as 'OPEN' | 'RESOLVED' | 'DISMISSED' }
      : {};
  const [feedbacks, total] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    db.feedback.count({ where }),
  ]);
  return { feedbacks, total };
}

export async function fetchAdminAnnouncements() {
  return db.announcement.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function fetchActiveAnnouncements() {
  const now = new Date();
  return db.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, content: true },
  });
}

export type AdminAuditLog = {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
};

export async function fetchAuditLogs(
  page: number,
  pageSize = 30
): Promise<{ logs: AdminAuditLog[]; total: number }> {
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count(),
  ]);
  return { logs, total };
}

// ── API Usage (Phase 14) ──────────────────────────────────────────────────────

const DAILY_CAPS: Record<string, number> = {
  dictionary: 0, // unlimited — display raw count only
  unsplash: 1200, // 50 req/hr × 24h (free tier)
  groq: 14400, // free tier daily limit
};

type ServiceStatus = 'green' | 'yellow' | 'red' | 'critical';

function usageStatus(count: number, cap: number): ServiceStatus {
  if (cap === 0) return 'green';
  const pct = count / cap;
  if (pct >= 0.95) return 'critical';
  if (pct >= 0.8) return 'red';
  if (pct >= 0.6) return 'yellow';
  return 'green';
}

export type ApiServiceStat = {
  service: string;
  today: number;
  capDaily: number;
  percentOfCap: number;
  status: ServiceStatus;
};

export async function fetchApiUsageToday(): Promise<ApiServiceStat[]> {
  const rows = await db.$queryRaw<{ service: string; total: number }[]>`
    SELECT service, SUM(count)::int AS total
    FROM "ApiUsageDaily"
    WHERE date = CURRENT_DATE
    GROUP BY service
  `;

  const services = ['dictionary', 'unsplash', 'groq'] as const;
  return services.map((service) => {
    const today = Number(rows.find((r) => r.service === service)?.total ?? 0);
    const cap = DAILY_CAPS[service] ?? 0;
    return {
      service,
      today,
      capDaily: cap,
      percentOfCap: cap > 0 ? today / cap : 0,
      status: usageStatus(today, cap),
    };
  });
}

export type ApiUsage30Days = Record<string, DayStat[]>;

export async function fetchApiUsage30Days(): Promise<ApiUsage30Days> {
  const rows = await db.$queryRaw<
    { day: string; service: string; count: number }[]
  >`
    SELECT DATE(date)::text AS day, service, SUM(count)::int AS count
    FROM "ApiUsageDaily"
    WHERE date >= CURRENT_DATE - INTERVAL '29 days'
    GROUP BY DATE(date), service
    ORDER BY day
  `;

  const services = ['dictionary', 'unsplash', 'groq'] as const;
  const result: ApiUsage30Days = {};
  for (const service of services) {
    result[service] = fillDays(rows.filter((r) => r.service === service));
  }
  return result;
}

export type ApiConsumer = {
  userId: string | null;
  email: string | null;
  service: string;
  count: number;
};

export async function fetchTopApiConsumers(limit = 10): Promise<ApiConsumer[]> {
  return db.$queryRaw<ApiConsumer[]>`
    SELECT a."userId", u.email, a.service, SUM(a.count)::int AS count
    FROM "ApiUsageDaily" a
    LEFT JOIN "User" u ON a."userId" = u.id
    WHERE a.date = CURRENT_DATE
    GROUP BY a."userId", u.email, a.service
    ORDER BY count DESC
    LIMIT ${limit}
  `;
}

// ── Reviews (Phase 15) ────────────────────────────────────────────────────────

export type ReviewStackedDay = {
  day: string;
  vocab: number;
  grammar: number;
  idiom: number;
};

export type ReviewsOverview = {
  reviewsPerDay30d: ReviewStackedDay[];
  reviewsByMode: { mode: string; count: number }[];
  accuracyByMode: { mode: string; accuracy: number }[];
};

export async function fetchReviewsOverview(): Promise<ReviewsOverview> {
  const [perDay, byMode, byAccuracy] = await Promise.all([
    db.$queryRaw<
      { day: string; vocab: number; grammar: number; idiom: number }[]
    >`
      WITH events AS (
        SELECT DATE("reviewedAt")::text AS day, 'vocab'::text AS type
        FROM "ReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
        UNION ALL
        SELECT DATE("reviewedAt")::text AS day, 'grammar'::text AS type
        FROM "GrammarReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
        UNION ALL
        SELECT DATE("reviewedAt")::text AS day, 'idiom'::text AS type
        FROM "IdiomReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
      )
      SELECT day,
        SUM(CASE WHEN type = 'vocab' THEN 1 ELSE 0 END)::int AS vocab,
        SUM(CASE WHEN type = 'grammar' THEN 1 ELSE 0 END)::int AS grammar,
        SUM(CASE WHEN type = 'idiom' THEN 1 ELSE 0 END)::int AS idiom
      FROM events
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<{ mode: string; count: number }[]>`
      SELECT mode, COUNT(*)::int AS count
      FROM (
        SELECT mode::text AS mode FROM "ReviewEvent"
        UNION ALL
        SELECT 'grammar_quiz' FROM "GrammarReviewEvent"
        UNION ALL
        SELECT 'idiom_quiz' FROM "IdiomReviewEvent"
      ) sub
      GROUP BY mode
      ORDER BY count DESC
    `,
    db.$queryRaw<{ mode: string; accuracy: number }[]>`
      SELECT mode,
        ROUND(100.0 * SUM(CASE WHEN correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::int AS accuracy
      FROM (
        SELECT mode::text AS mode, correct FROM "ReviewEvent"
        UNION ALL
        SELECT 'grammar_quiz', correct FROM "GrammarReviewEvent"
        UNION ALL
        SELECT 'idiom_quiz', correct FROM "IdiomReviewEvent"
      ) sub
      GROUP BY mode
      ORDER BY mode
    `,
  ]);

  const dayMap = new Map(perDay.map((r) => [r.day, r]));
  const reviewsPerDay30d: ReviewStackedDay[] = Array.from(
    { length: 30 },
    (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const day = d.toISOString().slice(0, 10);
      return dayMap.get(day) ?? { day, vocab: 0, grammar: 0, idiom: 0 };
    }
  );

  return {
    reviewsPerDay30d,
    reviewsByMode: byMode.map((r) => ({
      mode: r.mode,
      count: Number(r.count),
    })),
    accuracyByMode: byAccuracy.map((r) => ({
      mode: r.mode,
      accuracy: Number(r.accuracy),
    })),
  };
}

export async function fetchUserReviewDetail(
  userId: string
): Promise<ReviewsOverview> {
  const [perDay, byMode, byAccuracy] = await Promise.all([
    db.$queryRaw<
      { day: string; vocab: number; grammar: number; idiom: number }[]
    >`
      WITH events AS (
        SELECT DATE("reviewedAt")::text AS day, 'vocab'::text AS type
        FROM "ReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
          AND "userId" = ${userId}
        UNION ALL
        SELECT DATE("reviewedAt")::text AS day, 'grammar'::text AS type
        FROM "GrammarReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
          AND "userId" = ${userId}
        UNION ALL
        SELECT DATE("reviewedAt")::text AS day, 'idiom'::text AS type
        FROM "IdiomReviewEvent"
        WHERE "reviewedAt" >= NOW() - INTERVAL '29 days'
          AND "userId" = ${userId}
      )
      SELECT day,
        SUM(CASE WHEN type = 'vocab' THEN 1 ELSE 0 END)::int AS vocab,
        SUM(CASE WHEN type = 'grammar' THEN 1 ELSE 0 END)::int AS grammar,
        SUM(CASE WHEN type = 'idiom' THEN 1 ELSE 0 END)::int AS idiom
      FROM events
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<{ mode: string; count: number }[]>`
      SELECT mode, COUNT(*)::int AS count
      FROM (
        SELECT mode::text AS mode FROM "ReviewEvent" WHERE "userId" = ${userId}
        UNION ALL
        SELECT 'grammar_quiz' FROM "GrammarReviewEvent" WHERE "userId" = ${userId}
        UNION ALL
        SELECT 'idiom_quiz' FROM "IdiomReviewEvent" WHERE "userId" = ${userId}
      ) sub
      GROUP BY mode
      ORDER BY count DESC
    `,
    db.$queryRaw<{ mode: string; accuracy: number }[]>`
      SELECT mode,
        ROUND(100.0 * SUM(CASE WHEN correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::int AS accuracy
      FROM (
        SELECT mode::text AS mode, correct FROM "ReviewEvent" WHERE "userId" = ${userId}
        UNION ALL
        SELECT 'grammar_quiz', correct FROM "GrammarReviewEvent" WHERE "userId" = ${userId}
        UNION ALL
        SELECT 'idiom_quiz', correct FROM "IdiomReviewEvent" WHERE "userId" = ${userId}
      ) sub
      GROUP BY mode
      ORDER BY mode
    `,
  ]);

  const dayMap = new Map(perDay.map((r) => [r.day, r]));
  const reviewsPerDay30d: ReviewStackedDay[] = Array.from(
    { length: 30 },
    (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const day = d.toISOString().slice(0, 10);
      return dayMap.get(day) ?? { day, vocab: 0, grammar: 0, idiom: 0 };
    }
  );

  return {
    reviewsPerDay30d,
    reviewsByMode: byMode.map((r) => ({
      mode: r.mode,
      count: Number(r.count),
    })),
    accuracyByMode: byAccuracy.map((r) => ({
      mode: r.mode,
      accuracy: Number(r.accuracy),
    })),
  };
}

export type AdminUserReview = {
  userId: string;
  email: string;
  totalReviews: number;
  last7d: number;
  accuracyPct: number;
  favMode: string | null;
  lastActiveAt: Date | null;
};

export async function fetchAdminUserReviews(
  page: number,
  pageSize = 20
): Promise<{ users: AdminUserReview[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    db.$queryRaw<AdminUserReview[]>`
      WITH combined AS (
        SELECT "userId", "reviewedAt", correct, mode::text AS mode
        FROM "ReviewEvent"
        UNION ALL
        SELECT "userId", "reviewedAt", correct, 'grammar_quiz'::text AS mode
        FROM "GrammarReviewEvent"
        UNION ALL
        SELECT "userId", "reviewedAt", correct, 'idiom_quiz'::text AS mode
        FROM "IdiomReviewEvent"
      ),
      user_agg AS (
        SELECT
          "userId",
          COUNT(*)::int AS "totalReviews",
          SUM(CASE WHEN "reviewedAt" >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)::int AS "last7d",
          ROUND(100.0 * SUM(CASE WHEN correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::int AS "accuracyPct",
          MAX("reviewedAt") AS "lastActiveAt"
        FROM combined
        GROUP BY "userId"
      ),
      mode_counts AS (
        SELECT "userId", mode, COUNT(*) AS cnt
        FROM combined
        GROUP BY "userId", mode
      ),
      fav_mode AS (
        SELECT "userId", mode AS "favMode"
        FROM (
          SELECT "userId", mode,
            ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY cnt DESC) AS rn
          FROM mode_counts
        ) ranked
        WHERE rn = 1
      )
      SELECT
        u.id AS "userId",
        u.email,
        COALESCE(ua."totalReviews", 0) AS "totalReviews",
        COALESCE(ua."last7d", 0) AS "last7d",
        COALESCE(ua."accuracyPct", 0) AS "accuracyPct",
        fm."favMode",
        ua."lastActiveAt"
      FROM "User" u
      LEFT JOIN user_agg ua ON u.id = ua."userId"
      LEFT JOIN fav_mode fm ON u.id = fm."userId"
      ORDER BY COALESCE(ua."totalReviews", 0) DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    db.user.count(),
  ]);

  const users: AdminUserReview[] = rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    totalReviews: Number(r.totalReviews),
    last7d: Number(r.last7d),
    accuracyPct: Number(r.accuracyPct),
    favMode: r.favMode,
    lastActiveAt: r.lastActiveAt,
  }));

  return { users, total };
}

export type ReviewEventRow = {
  id: string;
  sourceType: 'vocab' | 'grammar' | 'idiom';
  reviewedAt: Date;
  correct: boolean;
  mode: string;
  subject: string | null;
  detail: string | null;
};

const VOCAB_MODES = new Set<string>([
  'flashcard',
  'fill_blank',
  'sentence_build',
  'writing_practice',
  'srs',
]);

export async function fetchReviewEventsForUser(
  userId: string,
  mode: string | null,
  page: number,
  pageSize = 50
): Promise<{ events: ReviewEventRow[]; total: number }> {
  const shouldQueryVocab = !mode || VOCAB_MODES.has(mode);
  const shouldQueryGrammar = !mode || mode === 'grammar_quiz';
  const shouldQueryIdiom = !mode || mode === 'idiom_quiz';

  const vocabModeFilter =
    mode && VOCAB_MODES.has(mode) ? { mode: mode as ReviewMode } : {};

  const [vocabRows, grammarRows, idiomRows] = await Promise.all([
    shouldQueryVocab
      ? db.reviewEvent.findMany({
          where: { userId, ...vocabModeFilter },
          orderBy: { reviewedAt: 'desc' },
          include: { word: { select: { term: true } } },
        })
      : Promise.resolve([]),
    shouldQueryGrammar
      ? db.grammarReviewEvent.findMany({
          where: { userId },
          orderBy: { reviewedAt: 'desc' },
          include: {
            pattern: {
              select: { title: true, section: { select: { title: true } } },
            },
          },
        })
      : Promise.resolve([]),
    shouldQueryIdiom
      ? db.idiomReviewEvent.findMany({
          where: { userId },
          orderBy: { reviewedAt: 'desc' },
          include: {
            idiom: {
              select: { phrase: true, category: { select: { title: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const events: ReviewEventRow[] = [
    ...vocabRows.map((r) => ({
      id: r.id,
      sourceType: 'vocab' as const,
      reviewedAt: r.reviewedAt,
      correct: r.correct,
      mode: r.mode as string,
      subject: r.word?.term ?? null,
      detail: null,
    })),
    ...grammarRows.map((r) => ({
      id: r.id,
      sourceType: 'grammar' as const,
      reviewedAt: r.reviewedAt,
      correct: r.correct,
      mode: 'grammar_quiz',
      subject: r.pattern?.title ?? null,
      detail: r.pattern?.section?.title ?? null,
    })),
    ...idiomRows.map((r) => ({
      id: r.id,
      sourceType: 'idiom' as const,
      reviewedAt: r.reviewedAt,
      correct: r.correct,
      mode: 'idiom_quiz',
      subject: r.idiom?.phrase ?? null,
      detail: r.idiom?.category?.title ?? null,
    })),
  ];

  events.sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());

  return {
    events: events.slice((page - 1) * pageSize, page * pageSize),
    total: events.length,
  };
}

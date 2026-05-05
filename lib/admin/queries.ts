import { db } from '@/lib/db';

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
        FROM "ReviewEvent"
        WHERE "reviewedAt" >= ${sevenDaysAgo}
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

  return {
    totalUsers,
    totalWords,
    totalReviews,
    openFeedback,
    activeUsers7d: activeUsers7dRaw[0]?.count ?? 0,
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

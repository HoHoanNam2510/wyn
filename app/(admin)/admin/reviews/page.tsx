import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import {
  fetchReviewsOverview,
  fetchAdminUserReviews,
  type AdminUserReview,
} from '@/lib/admin/queries';
import {
  ReviewsActivityChart,
  ReviewsModeChart,
  ReviewsAccuracyChart,
} from '@/components/admin/reviews-charts';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';

const MODE_LABELS: Record<string, string> = {
  flashcard: 'Flashcard',
  fill_blank: 'Fill Blank',
  sentence_build: 'Sentence Build',
  writing_practice: 'Writing',
  srs: 'SRS',
  grammar_quiz: 'Grammar Quiz',
  idiom_quiz: 'Idiom Quiz',
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold mb-4">{title}</p>
      {children}
    </div>
  );
}

const userColumns: Column<AdminUserReview>[] = [
  {
    key: 'email',
    header: 'User',
    cell: (u) => <span className="text-sm font-medium">{u.email}</span>,
  },
  {
    key: 'total',
    header: 'Total',
    cell: (u) => (
      <span className="text-sm font-mono">
        {u.totalReviews.toLocaleString()}
      </span>
    ),
    headerClassName: 'text-right',
    className: 'text-right',
  },
  {
    key: 'last7d',
    header: 'Last 7d',
    cell: (u) => (
      <span className="text-sm font-mono">{u.last7d.toLocaleString()}</span>
    ),
    headerClassName: 'text-right',
    className: 'text-right',
  },
  {
    key: 'accuracy',
    header: 'Accuracy',
    cell: (u) => {
      const pct = u.accuracyPct;
      const color =
        pct >= 70
          ? 'text-green-500'
          : pct >= 50
            ? 'text-amber-500'
            : 'text-red-500';
      return (
        <span className={`text-sm font-mono font-semibold ${color}`}>
          {pct}%
        </span>
      );
    },
    headerClassName: 'text-right',
    className: 'text-right',
  },
  {
    key: 'favMode',
    header: 'Fav Mode',
    cell: (u) => (
      <span className="text-sm text-muted-foreground">
        {u.favMode ? (MODE_LABELS[u.favMode] ?? u.favMode) : '—'}
      </span>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    cell: (u) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}
      </span>
    ),
  },
  {
    key: 'drill',
    header: '',
    cell: (u) => (
      <Link href={`/admin/reviews/${u.userId}`}>
        <Button variant="outline" size="sm">
          View
        </Button>
      </Link>
    ),
  },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const pageSize = 20;

  const [overview, { users, total }] = await Promise.all([
    fetchReviewsOverview().catch(() => ({
      reviewsPerDay30d: [],
      reviewsByMode: [],
      accuracyByMode: [],
    })),
    fetchAdminUserReviews(page, pageSize).catch(() => ({
      users: [],
      total: 0,
    })),
  ]);

  const totalReviewsAll = overview.reviewsByMode.reduce(
    (sum, r) => sum + r.count,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Reviews</h1>
        <span className="text-sm text-muted-foreground">
          {totalReviewsAll.toLocaleString()} total across all modes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Activity — last 30 days (stacked)">
          <ReviewsActivityChart data={overview.reviewsPerDay30d} />
        </ChartCard>
        <ChartCard title="Distribution by mode">
          <ReviewsModeChart data={overview.reviewsByMode} />
        </ChartCard>
        <ChartCard title="Accuracy by mode">
          <ReviewsAccuracyChart data={overview.accuracyByMode} />
        </ChartCard>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Per-User Summary</h2>
        <DataTable
          columns={userColumns}
          rows={users}
          rowKey={(u) => u.userId}
          empty="No users found."
          pagination={{ page, pageSize, total }}
        />
      </div>
    </div>
  );
}

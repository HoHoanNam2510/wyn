import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import {
  fetchUserReviewDetail,
  fetchReviewEventsForUser,
  type ReviewEventRow,
} from '@/lib/admin/queries';
import {
  ReviewsActivityChart,
  ReviewsModeChart,
  ReviewsAccuracyChart,
} from '@/components/admin/reviews-charts';
import { DataTable, type Column } from '@/components/admin/data-table';
import { cn } from '@/lib/utils';

type Props = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string; mode?: string }>;
};

const ALL_MODES = [
  { value: '', label: 'All modes' },
  { value: 'flashcard', label: 'Flashcard' },
  { value: 'fill_blank', label: 'Fill Blank' },
  { value: 'sentence_build', label: 'Sentence Build' },
  { value: 'writing_practice', label: 'Writing Practice' },
  { value: 'srs', label: 'SRS' },
  { value: 'grammar_quiz', label: 'Grammar Quiz' },
  { value: 'idiom_quiz', label: 'Idiom Quiz' },
];

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

const eventColumns: Column<ReviewEventRow>[] = [
  {
    key: 'correct',
    header: '',
    cell: (e) =>
      e.correct ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      ),
    className: 'w-8',
  },
  {
    key: 'mode',
    header: 'Mode',
    cell: (e) => (
      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
        {e.mode}
      </span>
    ),
  },
  {
    key: 'subject',
    header: 'Subject',
    cell: (e) => (
      <span className="text-sm font-medium">{e.subject ?? '—'}</span>
    ),
  },
  {
    key: 'detail',
    header: 'Detail',
    cell: (e) => (
      <span className="text-sm text-muted-foreground">{e.detail ?? '—'}</span>
    ),
  },
  {
    key: 'reviewedAt',
    header: 'Date',
    cell: (e) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(e.reviewedAt).toLocaleString()}
      </span>
    ),
  },
];

export default async function UserReviewDrilldownPage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const mode = sp.mode && sp.mode !== '' ? sp.mode : null;
  const pageSize = 50;

  const user = await db.user
    .findUnique({ where: { id: userId }, select: { email: true } })
    .catch(() => null);

  if (!user) notFound();

  const [detail, { events, total }] = await Promise.all([
    fetchUserReviewDetail(userId).catch(() => ({
      reviewsPerDay30d: [],
      reviewsByMode: [],
      accuracyByMode: [],
    })),
    fetchReviewEventsForUser(userId, mode, page, pageSize).catch(() => ({
      events: [],
      total: 0,
    })),
  ]);

  const modeSearchParams: Record<string, string> = mode ? { mode } : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/reviews"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground">Reviews</p>
          <h1 className="text-xl font-bold">{user.email}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Activity — last 30 days">
          <ReviewsActivityChart data={detail.reviewsPerDay30d} />
        </ChartCard>
        <ChartCard title="Distribution by mode">
          <ReviewsModeChart data={detail.reviewsByMode} />
        </ChartCard>
        <ChartCard title="Accuracy by mode">
          <ReviewsAccuracyChart data={detail.accuracyByMode} />
        </ChartCard>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Events
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({total.toLocaleString()} total)
            </span>
          )}
        </h2>

        <div className="flex flex-wrap gap-1">
          {ALL_MODES.map((m) => {
            const isActive = (mode ?? '') === m.value;
            return (
              <Link
                key={m.value}
                href={`?mode=${m.value}&page=1`}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                {m.label}
              </Link>
            );
          })}
        </div>

        <DataTable
          columns={eventColumns}
          rows={events}
          rowKey={(e) => e.id}
          empty="No events found."
          pagination={{
            page,
            pageSize,
            total,
            searchParams: modeSearchParams,
          }}
        />
      </div>
    </div>
  );
}

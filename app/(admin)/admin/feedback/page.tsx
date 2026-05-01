import Link from 'next/link';
import {
  fetchAdminFeedback,
  type FeedbackStatusFilter,
} from '@/lib/admin/queries';
import { cn } from '@/lib/utils';
import { FeedbackClient } from './feedback-client';

const STATUS_TABS: { label: string; value: FeedbackStatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Dismissed', value: 'DISMISSED' },
];

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const rawStatus = params.status?.toUpperCase() ?? 'ALL';
  const status: FeedbackStatusFilter = [
    'OPEN',
    'RESOLVED',
    'DISMISSED',
    'ALL',
  ].includes(rawStatus)
    ? (rawStatus as FeedbackStatusFilter)
    : 'ALL';
  const pageSize = 25;

  const { feedbacks, total } = await fetchAdminFeedback(
    page,
    status,
    pageSize
  ).catch(() => ({ feedbacks: [], total: 0 }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Feedback</h1>

      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`?status=${tab.value}&page=1`}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <FeedbackClient
        feedbacks={feedbacks}
        total={total}
        page={page}
        pageSize={pageSize}
        status={status}
      />
    </div>
  );
}

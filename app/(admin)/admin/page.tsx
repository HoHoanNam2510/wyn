import {
  Users,
  BookOpen,
  RotateCcw,
  MessageSquare,
  Activity,
} from 'lucide-react';
import {
  fetchAdminDashboardStats,
  type AdminAuditLog,
} from '@/lib/admin/queries';
import { HeroCard } from '@/components/shared/hero-card';
import {
  UserGrowthChart,
  WordGrowthChart,
  ReviewGrowthChart,
} from '@/components/admin/overview-charts';
import { DataTable, type Column } from '@/components/admin/data-table';

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

const recentActionsColumns: Column<AdminAuditLog>[] = [
  {
    key: 'admin',
    header: 'Admin',
    cell: (log) => <span className="text-sm">{log.adminEmail}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    cell: (log) => <span className="text-sm font-mono">{log.action}</span>,
  },
  {
    key: 'entity',
    header: 'Entity',
    cell: (log) => <span className="text-sm">{log.entityType}</span>,
  },
  {
    key: 'entityId',
    header: 'Entity ID',
    cell: (log) => (
      <span className="text-sm font-mono text-muted-foreground">
        {log.entityId ? log.entityId.slice(0, 8) : '—'}
      </span>
    ),
  },
  {
    key: 'time',
    header: 'Time',
    cell: (log) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {new Date(log.createdAt).toLocaleString()}
      </span>
    ),
  },
];

export default async function AdminOverviewPage() {
  const stats = await fetchAdminDashboardStats().catch(() => ({
    totalUsers: 0,
    totalWords: 0,
    totalReviews: 0,
    openFeedback: 0,
    activeUsers7d: 0,
    usersPerDay: [],
    wordsPerDay: [],
    reviewsPerDay: [],
    recentAuditLogs: [],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <HeroCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          accent={stats.totalUsers > 0}
        />
        <HeroCard
          label="Total Words"
          value={stats.totalWords.toLocaleString()}
          icon={<BookOpen className="h-5 w-5" />}
          accent={stats.totalWords > 0}
        />
        <HeroCard
          label="Total Reviews"
          value={stats.totalReviews.toLocaleString()}
          icon={<RotateCcw className="h-5 w-5" />}
          accent={stats.totalReviews > 0}
        />
        <HeroCard
          label="Open Feedback"
          value={stats.openFeedback.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
          accent={stats.openFeedback > 0}
        />
        <HeroCard
          label="Active Users (7d)"
          value={stats.activeUsers7d.toLocaleString()}
          icon={<Activity className="h-5 w-5" />}
          accent={stats.activeUsers7d > 0}
        />
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="New users — last 30 days">
          <UserGrowthChart data={stats.usersPerDay} />
        </ChartCard>
        <ChartCard title="New words — last 30 days">
          <WordGrowthChart data={stats.wordsPerDay} />
        </ChartCard>
        <ChartCard title="Reviews — last 30 days">
          <ReviewGrowthChart data={stats.reviewsPerDay} />
        </ChartCard>
      </div>

      {/* Recent audit log */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Actions</h2>
        <DataTable
          columns={recentActionsColumns}
          rows={stats.recentAuditLogs}
          rowKey={(log) => log.id}
          empty="No actions yet."
        />
      </div>
    </div>
  );
}

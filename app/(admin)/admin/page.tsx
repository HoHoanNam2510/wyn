import {
  Users,
  BookOpen,
  RotateCcw,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { fetchAdminDashboardStats } from '@/lib/admin/queries';
import { HeroCard } from '@/components/shared/hero-card';
import {
  UserGrowthChart,
  WordGrowthChart,
  ReviewGrowthChart,
} from '@/components/admin/overview-charts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
        <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentAuditLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No actions yet.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.adminEmail}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-sm">{log.entityType}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.entityId ? log.entityId.slice(0, 8) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

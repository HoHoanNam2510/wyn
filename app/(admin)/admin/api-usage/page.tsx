import { Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  fetchApiUsageToday,
  fetchApiUsage30Days,
  fetchTopApiConsumers,
  type ApiServiceStat,
  type ApiUsage30Days,
} from '@/lib/admin/queries';
import { ApiSparkline } from '@/components/admin/overview-charts';
import { TopConsumersTabs } from './top-consumers-tabs';

const STATUS_LABEL: Record<string, string> = {
  green: 'OK',
  yellow: 'Moderate',
  red: 'High',
  critical: 'Critical',
};

const STATUS_CLASS: Record<string, string> = {
  green: 'bg-green-500/15 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  critical: 'bg-red-600/20 text-red-700 dark:text-red-400 font-bold',
};

const SERVICE_LABELS: Record<string, string> = {
  dictionary: 'Dictionary API',
  unsplash: 'Unsplash API',
  groq: 'Groq API',
};

const PER_USER_LIMITS: Record<string, string> = {
  dictionary: '60 req/min per user',
  unsplash: '20 req/min per user',
  groq: '50 req/day per user',
};

const SPARKLINE_COLORS: Record<string, string> = {
  dictionary: '#dc143c',
  unsplash: '#2481a8',
  groq: '#dd8c12',
};

function ServiceCard({
  stat,
  perDay,
}: {
  stat: ApiServiceStat;
  perDay: { day: string; count: number }[];
}) {
  const pctDisplay =
    stat.capDaily > 0
      ? `${Math.round(stat.percentOfCap * 100)}% of ${stat.capDaily.toLocaleString()}/day cap`
      : 'No daily cap';

  const fillColor =
    stat.status === 'critical' || stat.status === 'red'
      ? 'bg-red-500'
      : stat.status === 'yellow'
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {SERVICE_LABELS[stat.service] ?? stat.service}
          </p>
          <p className="text-2xl font-bold mt-1">
            {stat.today.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              calls today
            </span>
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-md shrink-0 ${STATUS_CLASS[stat.status]}`}
        >
          {STATUS_LABEL[stat.status]}
        </span>
      </div>

      {/* Progress bar always rendered — fill hidden when no cap, keeps uniform height */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          {stat.capDaily > 0 && (
            <div
              className={`h-full rounded-full transition-all ${fillColor}`}
              style={{
                width: `${Math.min(stat.percentOfCap * 100, 100).toFixed(1)}%`,
              }}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{pctDisplay}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Rate limit: {PER_USER_LIMITS[stat.service]}
      </p>

      {/* mt-auto pins sparkline to bottom so all cards align regardless of content height */}
      <div className="mt-auto">
        <p className="text-xs text-muted-foreground mb-1">Last 30 days</p>
        <ApiSparkline data={perDay} color={SPARKLINE_COLORS[stat.service]} />
      </div>
    </div>
  );
}

export default async function ApiUsagePage() {
  const [stats, perDay30, topConsumers] = await Promise.all([
    fetchApiUsageToday().catch(() => [] as ApiServiceStat[]),
    fetchApiUsage30Days().catch(() => ({}) as ApiUsage30Days),
    fetchTopApiConsumers(30).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">API Usage</h1>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <ServiceCard
            key={stat.service}
            stat={stat}
            perDay={perDay30[stat.service] ?? []}
          />
        ))}
      </div>

      <Separator />

      {/* Top consumers — tabbed per service */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Top Consumers Today</h2>
        <TopConsumersTabs consumers={topConsumers} />
      </div>
    </div>
  );
}

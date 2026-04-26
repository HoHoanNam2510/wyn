import { redirect } from 'next/navigation';
import { BookOpen, Flame, Trophy, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { fetchStats } from '@/lib/stats/queries';
import type { StatsData } from '@/lib/stats/queries';
import {
  WordsPerDayChart,
  ReviewsPerDayChart,
  AccuracyPerDayChart,
  CategoryDonutChart,
} from './stats-charts';

function HeroCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
      <div
        className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
          accent
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

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

function StrugglingTable({ words }: { words: StatsData['strugglingWords'] }) {
  if (words.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm font-semibold">Needs work ({words.length})</p>
      </div>
      <div className="divide-y divide-border">
        {words.map((w) => (
          <div key={w.wordId} className="flex items-center py-2.5 gap-3">
            <span className="flex-1 text-sm font-medium">{w.term}</span>
            <span className="text-xs text-muted-foreground">
              {w.totalReviews} reviews
            </span>
            <span className="text-xs font-semibold text-destructive w-10 text-right">
              {w.accuracy}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const stats = await fetchStats(session.user.id);
  const hasReviews = stats.reviewsPerDay.some((d) => d.count > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Your vocabulary learning progress at a glance.
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HeroCard
          label="Total words"
          value={stats.totalWords}
          icon={<BookOpen className="h-5 w-5" />}
          accent={stats.totalWords > 0}
        />
        <HeroCard
          label="Current streak"
          value={`${stats.streak} day${stats.streak !== 1 ? 's' : ''}`}
          icon={<Flame className="h-5 w-5" />}
          accent={stats.streak > 0}
        />
        <HeroCard
          label="Words mastered"
          value={stats.masteredWords}
          icon={<Trophy className="h-5 w-5" />}
          accent={stats.masteredWords > 0}
        />
      </div>

      {/* No reviews yet — prompt */}
      {!hasReviews && (
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          Complete some review sessions to see accuracy and daily activity
          charts.
        </div>
      )}

      {/* Time-series charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Words added — last 30 days">
          <WordsPerDayChart data={stats.wordsPerDay} />
        </ChartCard>
        <ChartCard title="Reviews — last 30 days">
          <ReviewsPerDayChart data={stats.reviewsPerDay} />
        </ChartCard>
        <ChartCard title="Accuracy — last 30 days">
          <AccuracyPerDayChart data={stats.accuracyPerDay} />
        </ChartCard>
        <ChartCard title="Words per category">
          <CategoryDonutChart data={stats.wordsPerCategory} />
        </ChartCard>
      </div>

      {/* Struggling words */}
      <StrugglingTable words={stats.strugglingWords} />
    </div>
  );
}

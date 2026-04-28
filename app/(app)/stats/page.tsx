import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Flame,
  Trophy,
  AlertTriangle,
  Zap,
  Target,
  BrainCircuit,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { fetchStats } from '@/lib/stats/queries';
import type { StatsData } from '@/lib/stats/queries';
import {
  WordsPerDayChart,
  ReviewsPerDayChart,
  AccuracyPerDayChart,
  CategoryDonutChart,
  GrammarSectionAccuracyChart,
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

function GrammarStrugglingTable({
  patterns,
}: {
  patterns: StatsData['grammarStrugglingPatterns'];
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm font-semibold">
          Struggling patterns ({patterns.length})
        </p>
      </div>
      <div className="divide-y divide-border">
        {patterns.map((p) => (
          <div key={p.patternId} className="py-2.5 space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium truncate">
                {p.patternTitle}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {p.totalAttempts} attempts
              </span>
              <span className="text-xs font-semibold text-destructive w-10 text-right shrink-0">
                {p.accuracy}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{p.sectionTitle}</p>
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
  const hasGrammarData = stats.grammarTotalAnswers > 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Your vocabulary learning progress at a glance.
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <HeroCard
          label="SRS due today"
          value={stats.srsDueToday}
          icon={<BrainCircuit className="h-5 w-5" />}
          accent={stats.srsDueToday > 0}
        />
      </div>

      {/* Words added — full width */}
      <ChartCard title="Words added — last 30 days">
        <WordsPerDayChart data={stats.wordsPerDay} />
      </ChartCard>

      {/* Reviews + Accuracy — side by side */}
      {hasReviews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Reviews — last 30 days">
            <ReviewsPerDayChart data={stats.reviewsPerDay} />
          </ChartCard>
          <ChartCard title="Accuracy — last 30 days">
            <AccuracyPerDayChart data={stats.accuracyPerDay} />
          </ChartCard>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          Complete some review sessions to see accuracy and daily activity
          charts.
        </div>
      )}

      {/* Category donut + Struggling words */}
      {stats.strugglingWords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Words per category">
            <CategoryDonutChart data={stats.wordsPerCategory} />
          </ChartCard>
          <StrugglingTable words={stats.strugglingWords} />
        </div>
      ) : (
        <ChartCard title="Words per category">
          <CategoryDonutChart data={stats.wordsPerCategory} />
        </ChartCard>
      )}

      {/* ── Grammar Quiz section ─────────────────────────────────────── */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Grammar Quiz</h2>
            <p className="text-sm text-muted-foreground">
              Pattern identification accuracy
            </p>
          </div>
          <Link
            href="/grammar/quiz"
            className="text-xs font-medium text-primary hover:underline"
          >
            Take a quiz →
          </Link>
        </div>

        {hasGrammarData ? (
          <div className="space-y-4">
            {/* Grammar hero cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HeroCard
                label="Quiz answers total"
                value={stats.grammarTotalAnswers}
                icon={<Zap className="h-5 w-5" />}
                accent
              />
              <HeroCard
                label="Overall grammar accuracy"
                value={
                  stats.grammarOverallAccuracy !== null
                    ? `${stats.grammarOverallAccuracy}%`
                    : '—'
                }
                icon={<Target className="h-5 w-5" />}
                accent={
                  stats.grammarOverallAccuracy !== null &&
                  stats.grammarOverallAccuracy >= 70
                }
              />
            </div>

            {/* Accuracy per section + struggling patterns */}
            {stats.grammarStrugglingPatterns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Accuracy by section">
                  <GrammarSectionAccuracyChart
                    data={stats.grammarAccuracyPerSection}
                  />
                </ChartCard>
                <GrammarStrugglingTable
                  patterns={stats.grammarStrugglingPatterns}
                />
              </div>
            ) : (
              <ChartCard title="Accuracy by section">
                <GrammarSectionAccuracyChart
                  data={stats.grammarAccuracyPerSection}
                />
              </ChartCard>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
            Complete some grammar quiz sessions to see your pattern accuracy.
          </div>
        )}
      </div>
    </div>
  );
}

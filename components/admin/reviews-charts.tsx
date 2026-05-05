'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ReviewStackedDay, ReviewsOverview } from '@/lib/admin/queries';

const GRID_COLOR = 'rgba(255,255,255,0.07)';
const TICK_COLOR = '#9a8488';
const PRIMARY = '#dc143c';
const SECONDARY = '#dd8c12';
const TERTIARY = '#2481a8';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';
const RED_SOFT = '#ef4444';

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1c1819',
  color: '#f4f1f2',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
} as const;

const axisProps = {
  tick: { fontSize: 11, fill: TICK_COLOR },
  tickLine: false,
  axisLine: false,
} as const;

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function weeklyTick(value: string, index: number): string {
  return index % 7 === 0 ? fmtDay(value) : '';
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy < 50) return RED_SOFT;
  if (accuracy < 70) return AMBER;
  return GREEN;
}

const MODE_COLORS: Record<string, string> = {
  flashcard: PRIMARY,
  fill_blank: '#e05577',
  sentence_build: SECONDARY,
  writing_practice: GREEN,
  srs: '#f97316',
  grammar_quiz: TERTIARY,
  idiom_quiz: '#7c3aed',
};

const MODE_LABELS: Record<string, string> = {
  flashcard: 'Flashcard',
  fill_blank: 'Fill Blank',
  sentence_build: 'Sentence Build',
  writing_practice: 'Writing Practice',
  srs: 'SRS',
  grammar_quiz: 'Grammar Quiz',
  idiom_quiz: 'Idiom Quiz',
};

export function ReviewsActivityChart({ data }: { data: ReviewStackedDay[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="vocabGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grammarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SECONDARY} stopOpacity={0.4} />
            <stop offset="100%" stopColor={SECONDARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="idiomGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TERTIARY} stopOpacity={0.4} />
            <stop offset="100%" stopColor={TERTIARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          contentStyle={tooltipStyle}
          cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: TICK_COLOR, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="idiom"
          name="Idiom"
          stackId="1"
          stroke={TERTIARY}
          strokeWidth={1.5}
          fill="url(#idiomGrad)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="grammar"
          name="Grammar"
          stackId="1"
          stroke={SECONDARY}
          strokeWidth={1.5}
          fill="url(#grammarGrad)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="vocab"
          name="Vocab"
          stackId="1"
          stroke={PRIMARY}
          strokeWidth={1.5}
          fill="url(#vocabGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReviewsModeChart({
  data,
}: {
  data: ReviewsOverview['reviewsByMode'];
}) {
  const chartData = data.map((d) => ({
    ...d,
    name: MODE_LABELS[d.mode] ?? d.mode,
    fill: MODE_COLORS[d.mode] ?? '#888',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Tooltip
          formatter={(v, name) => [v, name]}
          contentStyle={tooltipStyle}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: TICK_COLOR }}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={75}
          strokeWidth={0}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ReviewsAccuracyChart({
  data,
}: {
  data: ReviewsOverview['accuracyByMode'];
}) {
  const chartData = data.map((d) => ({
    ...d,
    name: MODE_LABELS[d.mode] ?? d.mode,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 40, left: -20 }}
      >
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="name"
          {...axisProps}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis allowDecimals={false} domain={[0, 100]} {...axisProps} />
        <Tooltip
          formatter={(v) => [`${v}%`, 'Accuracy']}
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="accuracy" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getAccuracyColor(entry.accuracy)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

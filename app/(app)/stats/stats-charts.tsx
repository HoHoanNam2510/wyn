'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DayStat, DayAccuracy, CategoryStat } from '@/lib/stats/queries';

const GRID_COLOR = 'rgba(255,255,255,0.07)';
const TICK_COLOR = '#9a8488';
const PRIMARY = '#dc143c';
const TERTIARY = '#2481a8';

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#1c1819',
  color: '#f4f1f2',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
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

const axisProps = {
  tick: { fontSize: 11, fill: TICK_COLOR },
  tickLine: false,
  axisLine: false,
} as const;

export function WordsPerDayChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="wordsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [v, 'Words added']}
          contentStyle={tooltipStyle}
          cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={PRIMARY}
          strokeWidth={2}
          fill="url(#wordsGrad)"
          dot={false}
          activeDot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReviewsPerDayChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [v, 'Reviews']}
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar
          dataKey="count"
          fill={PRIMARY}
          radius={[3, 3, 0, 0]}
          maxBarSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AccuracyPerDayChart({ data }: { data: DayAccuracy[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          {...axisProps}
        />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [`${v}%`, 'Accuracy']}
          contentStyle={tooltipStyle}
          cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke={TERTIARY}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: TERTIARY, strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonutChart({ data }: { data: CategoryStat[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No categories yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={78}
          dataKey="count"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={tooltipStyle}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: TICK_COLOR }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

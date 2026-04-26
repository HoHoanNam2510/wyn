'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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

const BORDER_COLOR = '#e6e0e2';
const TICK_COLOR = '#9a8488';
const PRIMARY = '#dc143c';
const TERTIARY = '#2481a8';

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function dayTickFormatter(value: string, index: number): string {
  return index % 5 === 0 ? fmtDay(value) : '';
}

const sharedAxisProps = {
  tick: { fontSize: 11, fill: TICK_COLOR },
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: `1px solid ${BORDER_COLOR}`,
  backgroundColor: '#ffffff',
} as const;

export function WordsPerDayChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={BORDER_COLOR} />
        <XAxis
          dataKey="day"
          tickFormatter={dayTickFormatter}
          {...sharedAxisProps}
        />
        <YAxis allowDecimals={false} {...sharedAxisProps} />
        <Tooltip
          labelFormatter={(label) => fmtDay(String(label))}
          formatter={(value) => [value, 'Words added']}
          contentStyle={tooltipStyle}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={PRIMARY}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReviewsPerDayChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={BORDER_COLOR}
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tickFormatter={dayTickFormatter}
          {...sharedAxisProps}
        />
        <YAxis allowDecimals={false} {...sharedAxisProps} />
        <Tooltip
          labelFormatter={(label) => fmtDay(String(label))}
          formatter={(value) => [value, 'Reviews']}
          contentStyle={tooltipStyle}
        />
        <Bar
          dataKey="count"
          fill={PRIMARY}
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AccuracyPerDayChart({ data }: { data: DayAccuracy[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={BORDER_COLOR} />
        <XAxis
          dataKey="day"
          tickFormatter={dayTickFormatter}
          {...sharedAxisProps}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          {...sharedAxisProps}
        />
        <Tooltip
          labelFormatter={(label) => fmtDay(String(label))}
          formatter={(value) => [`${value}%`, 'Accuracy']}
          contentStyle={tooltipStyle}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke={TERTIARY}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonutChart({ data }: { data: CategoryStat[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center">
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
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type DayStat = { day: string; count: number };

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

export function UserGrowthChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [v, 'New users']}
          contentStyle={tooltipStyle}
          cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={PRIMARY}
          strokeWidth={2}
          fill="url(#userGrad)"
          dot={false}
          activeDot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WordGrowthChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="day" tickFormatter={weeklyTick} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [v, 'New words']}
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

export function ReviewGrowthChart({ data }: { data: DayStat[] }) {
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
          fill={TERTIARY}
          radius={[3, 3, 0, 0]}
          maxBarSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApiSparkline({
  data,
  color = PRIMARY,
}: {
  data: DayStat[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
        <Tooltip
          labelFormatter={(l) => fmtDay(String(l))}
          formatter={(v) => [v, 'Calls']}
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar
          dataKey="count"
          fill={color}
          radius={[2, 2, 0, 0]}
          maxBarSize={8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '@/components/admin/data-table';
import type { ApiConsumer } from '@/lib/admin/queries';

const SERVICES = [
  { key: 'dictionary', label: 'Dictionary API' },
  { key: 'unsplash', label: 'Unsplash API' },
  { key: 'groq', label: 'Groq API' },
] as const;

const columns: Column<ApiConsumer>[] = [
  {
    key: 'user',
    header: 'User',
    cell: (row) => (
      <span className="text-sm">{row.email ?? row.userId ?? '—'}</span>
    ),
  },
  {
    key: 'count',
    header: 'Calls Today',
    cell: (row) => (
      <span className="text-sm font-semibold">
        {row.count.toLocaleString()}
      </span>
    ),
  },
];

export function TopConsumersTabs({ consumers }: { consumers: ApiConsumer[] }) {
  const [active, setActive] = useState<string>('dictionary');

  const filtered = consumers.filter((c) => c.service === active);

  return (
    <div className="space-y-0">
      <div className="flex gap-0 border-b border-border">
        {SERVICES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="pt-3">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => `${r.userId}-${r.service}`}
          empty="No usage recorded for this service today."
        />
      </div>
    </div>
  );
}

import { fetchAuditLogs, type AdminAuditLog } from '@/lib/admin/queries';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';

const columns: Column<AdminAuditLog>[] = [
  {
    key: 'admin',
    header: 'Admin Email',
    cell: (log) => <span className="text-sm">{log.adminEmail}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    cell: (log) => (
      <Badge variant="outline" className="font-mono text-xs">
        {log.action}
      </Badge>
    ),
  },
  {
    key: 'entityType',
    header: 'Entity Type',
    cell: (log) => <span className="text-sm">{log.entityType}</span>,
  },
  {
    key: 'entityId',
    header: 'Entity ID',
    cell: (log) => (
      <span className="font-mono text-sm text-muted-foreground">
        {log.entityId ? log.entityId.slice(0, 8) : '—'}
      </span>
    ),
  },
  {
    key: 'metadata',
    header: 'Metadata',
    className: 'max-w-xs truncate',
    cell: (log) => {
      const metaStr = log.metadata ? JSON.stringify(log.metadata) : '';
      const truncated =
        metaStr.length > 60 ? `${metaStr.slice(0, 60)}…` : metaStr;
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {truncated || '—'}
        </span>
      );
    },
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

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const pageSize = 30;

  const { logs, total } = await fetchAuditLogs(page, pageSize).catch(() => ({
    logs: [],
    total: 0,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        empty="No audit logs yet."
        pagination={{ page, pageSize, total }}
      />
    </div>
  );
}

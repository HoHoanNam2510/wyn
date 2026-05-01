import Link from 'next/link';
import { fetchAuditLogs } from '@/lib/admin/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin Email</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No audit logs yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const metaStr = log.metadata
                  ? JSON.stringify(log.metadata)
                  : '';
                const truncatedMeta =
                  metaStr.length > 60 ? `${metaStr.slice(0, 60)}…` : metaStr;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.adminEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entityType}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {log.entityId ? log.entityId.slice(0, 8) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                      {truncatedMeta || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`?page=${page - 1}`}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Link href={`?page=${page + 1}`}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

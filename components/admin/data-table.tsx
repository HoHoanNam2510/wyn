import Link from 'next/link';
import { type ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** Other query params to preserve when paginating (e.g. { q, status }) */
  searchParams?: Record<string, string>;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  pagination?: PaginationProps;
};

function buildHref(page: number, searchParams?: Record<string, string>) {
  const params = new URLSearchParams(searchParams);
  params.set('page', String(page));
  return `?${params.toString()}`;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  pagination,
}: Props<T>) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {empty ?? 'No data.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildHref(pagination.page - 1, pagination.searchParams)}
              >
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {pagination.page < totalPages ? (
              <Link
                href={buildHref(pagination.page + 1, pagination.searchParams)}
              >
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

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type AdminFeedback } from '@/lib/admin/queries';
import { updateFeedbackStatus } from '@/app/actions/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  feedbacks: AdminFeedback[];
  total: number;
  page: number;
  pageSize: number;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    OPEN: 'default',
    RESOLVED: 'secondary',
    DISMISSED: 'outline',
  };
  return (
    <Badge
      variant={variants[status] ?? 'outline'}
      className="capitalize text-xs"
    >
      {status.toLowerCase()}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className="text-xs capitalize">
      {type.toLowerCase().replace('_', ' ')}
    </Badge>
  );
}

function StatusSelect({ feedback }: { feedback: AdminFeedback }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      try {
        await updateFeedbackStatus(
          feedback.id,
          newStatus as 'OPEN' | 'RESOLVED' | 'DISMISSED'
        );
        toast.success('Status updated');
        router.refresh();
      } catch {
        toast.error('Failed to update status');
      }
    });
  }

  return (
    <Select
      defaultValue={feedback.status}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="OPEN">Open</SelectItem>
        <SelectItem value="RESOLVED">Resolved</SelectItem>
        <SelectItem value="DISMISSED">Dismissed</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function FeedbackClient({
  feedbacks,
  total,
  page,
  pageSize,
  status,
}: Props) {
  const columns: Column<AdminFeedback>[] = [
    {
      key: 'type',
      header: 'Type',
      cell: (f) => <TypeBadge type={f.type} />,
    },
    {
      key: 'content',
      header: 'Content',
      className: 'max-w-xs',
      cell: (f) => {
        const content =
          f.content.length > 80 ? `${f.content.slice(0, 80)}…` : f.content;
        return <span className="text-sm">{content}</span>;
      },
    },
    {
      key: 'user',
      header: 'User',
      cell: (f) => (
        <span className="text-sm text-muted-foreground">
          {f.user?.email ?? 'Anonymous'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (f) => <StatusBadge status={f.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      cell: (f) => (
        <span className="text-sm text-muted-foreground">
          {new Date(f.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'changeStatus',
      header: 'Change Status',
      cell: (f) => <StatusSelect feedback={f} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={feedbacks}
      rowKey={(f) => f.id}
      empty="No feedback found."
      pagination={{ page, pageSize, total, searchParams: { status } }}
    />
  );
}

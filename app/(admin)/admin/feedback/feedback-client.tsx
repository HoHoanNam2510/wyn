'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { type AdminFeedback } from '@/lib/admin/queries';
import { updateFeedbackStatus } from '@/app/actions/admin';
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

function FeedbackRow({ feedback }: { feedback: AdminFeedback }) {
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

  const content =
    feedback.content.length > 80
      ? `${feedback.content.slice(0, 80)}…`
      : feedback.content;

  return (
    <TableRow>
      <TableCell>
        <TypeBadge type={feedback.type} />
      </TableCell>
      <TableCell className="text-sm max-w-xs">{content}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {feedback.user?.email ?? 'Anonymous'}
      </TableCell>
      <TableCell>
        <StatusBadge status={feedback.status} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(feedback.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  );
}

export function FeedbackClient({
  feedbacks,
  total,
  page,
  pageSize,
  status,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);

  function buildHref(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('status', status);
    return `?${params.toString()}`;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No feedback found.
                </TableCell>
              </TableRow>
            ) : (
              feedbacks.map((feedback) => (
                <FeedbackRow key={feedback.id} feedback={feedback} />
              ))
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
              <Link href={buildHref(page - 1)}>
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
              <Link href={buildHref(page + 1)}>
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
    </>
  );
}

'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { type AdminUser } from '@/lib/admin/queries';
import { adminDeleteUser } from '@/app/actions/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

export function UsersClient({ users, total, page, pageSize }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  function confirmDelete() {
    if (!confirmUser) return;
    const id = confirmUser.id;
    setConfirmUser(null);
    startTransition(async () => {
      try {
        await adminDeleteUser(id);
        toast.success('User deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete user');
      }
    });
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Name / Email',
      cell: (user) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{user.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'words',
      header: 'Words',
      cell: (user) => <span className="text-sm">{user._count.words}</span>,
    },
    {
      key: 'reviews',
      header: 'Reviews',
      cell: (user) => (
        <span className="text-sm">{user._count.reviewEvents}</span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-16',
      cell: (user) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmUser(user)}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        empty="No users found."
        pagination={{ page, pageSize, total }}
      />

      <Dialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">{confirmUser?.email}</span>? This
              will permanently remove all their data including words, reviews,
              and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

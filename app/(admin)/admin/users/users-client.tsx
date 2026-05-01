'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { type AdminUser } from '@/lib/admin/queries';
import { adminDeleteUser } from '@/app/actions/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const totalPages = Math.ceil(total / pageSize);

  function handleDelete(user: AdminUser) {
    setConfirmUser(user);
  }

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

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Email</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{user.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user._count.words}</TableCell>
                  <TableCell className="text-sm">
                    {user._count.reviewEvents}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(user)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
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

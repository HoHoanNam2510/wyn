'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Download, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { deleteAccount, exportData } from '@/app/actions/account';

type Props = {
  user: { name: string | null; email: string | null; image: string | null };
  stats: { wordCount: number; categoryCount: number };
};

export function SettingsClient({ user, stats }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleExport() {
    startExport(async () => {
      try {
        const data = await exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wyn-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${data.length} words`);
      } catch {
        toast.error('Export failed. Please try again.');
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await deleteAccount();
      } catch {
        toast.error('Failed to delete account. Please try again.');
        setDeleteOpen(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'User'}
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <p className="font-medium">{user.name ?? '—'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Profile information is synced from your Google account.
        </p>
      </section>

      {/* Data */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your Data
        </h2>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-2xl font-bold">{stats.wordCount}</p>
            <p className="text-muted-foreground">Words</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.categoryCount}</p>
            <p className="text-muted-foreground">Categories</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Export vocabulary</p>
            <p className="text-xs text-muted-foreground">
              Download all your words as a JSON file. Compatible with the import
              feature.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/40 bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all your data. This cannot be
              undone.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete account
          </Button>
        </div>
      </section>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your account and all your data —
            including {stats.wordCount} words, {stats.categoryCount} categories,
            and all review history. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

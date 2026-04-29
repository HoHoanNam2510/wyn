'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Download,
  Trash2,
  User,
  Sun,
  Moon,
  Monitor,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  deleteAccount,
  exportData,
  updateDisplayName,
} from '@/app/actions/account';

type Props = {
  user: { name: string | null; email: string | null; image: string | null };
  stats: { wordCount: number; categoryCount: number };
};

export function SettingsClient({ user, stats }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // Inline name edit state
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name ?? '');
  const [isSavingName, startSaveName] = useTransition();

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

  function handleSaveName() {
    startSaveName(async () => {
      const result = await updateDisplayName(nameInput);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Name updated');
      setEditing(false);
      router.refresh();
    });
  }

  function handleCancelEdit() {
    setNameInput(user.name ?? '');
    setEditing(false);
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

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
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-8 text-sm"
                  maxLength={60}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary shrink-0"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCancelEdit}
                  disabled={isSavingName}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{user.name ?? '—'}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Profile picture is synced from your Google account.
        </p>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </h2>
        <div className="flex gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border py-3 px-2 text-xs font-medium transition-colors ${
                theme === value
                  ? 'border-primary bg-accent text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
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

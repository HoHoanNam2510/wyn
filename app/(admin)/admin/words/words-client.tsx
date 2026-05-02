'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { type AdminWord } from '@/lib/admin/queries';
import { adminDeleteWord } from '@/app/actions/admin';
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
  words: AdminWord[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
};

export function WordsClient({ words, total, page, pageSize, q }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmWord, setConfirmWord] = useState<AdminWord | null>(null);

  function confirmDelete() {
    if (!confirmWord) return;
    const id = confirmWord.id;
    setConfirmWord(null);
    startTransition(async () => {
      try {
        await adminDeleteWord(id);
        toast.success('Word deleted');
        router.refresh();
      } catch {
        toast.error('Failed to delete word');
      }
    });
  }

  const columns: Column<AdminWord>[] = [
    {
      key: 'term',
      header: 'Term',
      cell: (word) => <span className="text-sm font-medium">{word.term}</span>,
    },
    {
      key: 'context',
      header: 'Context',
      cell: (word) => (
        <span className="text-sm text-muted-foreground capitalize">
          {word.contexts[0]?.partOfSpeech.toLowerCase() ?? '—'}
        </span>
      ),
    },
    {
      key: 'phonetic',
      header: 'Phonetic',
      cell: (word) => (
        <span className="text-sm text-muted-foreground font-mono">
          {word.contexts[0]?.phonetic ?? '—'}
        </span>
      ),
    },
    {
      key: 'meaning',
      header: 'Meaning',
      cell: (word) => {
        const meaning = word.contexts[0]?.meaning ?? '';
        const truncated =
          meaning.length > 50 ? `${meaning.slice(0, 50)}…` : meaning;
        return (
          <span className="text-sm text-muted-foreground">
            {truncated || '—'}
          </span>
        );
      },
    },
    {
      key: 'owner',
      header: 'Owner',
      cell: (word) => (
        <span className="text-sm text-muted-foreground">{word.user.email}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (word) => (
        <span className="text-sm text-muted-foreground">
          {new Date(word.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'w-16',
      cell: (word) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmWord(word)}
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
        rows={words}
        rowKey={(w) => w.id}
        empty="No words found."
        pagination={{
          page,
          pageSize,
          total,
          searchParams: q ? { q } : undefined,
        }}
      />

      <Dialog
        open={!!confirmWord}
        onOpenChange={(open) => !open && setConfirmWord(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Word</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the word{' '}
              <span className="font-medium">
                &ldquo;{confirmWord?.term}&rdquo;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWord(null)}>
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

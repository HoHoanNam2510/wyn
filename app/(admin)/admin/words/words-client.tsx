'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { type AdminWord } from '@/lib/admin/queries';
import { adminDeleteWord } from '@/app/actions/admin';
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

  const totalPages = Math.ceil(total / pageSize);

  function buildHref(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (q) params.set('q', q);
    return `?${params.toString()}`;
  }

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

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Phonetic</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No words found.
                </TableCell>
              </TableRow>
            ) : (
              words.map((word) => {
                const ctx = word.contexts[0];
                const meaning = ctx?.meaning ?? '';
                const truncatedMeaning =
                  meaning.length > 50 ? `${meaning.slice(0, 50)}…` : meaning;
                return (
                  <TableRow key={word.id}>
                    <TableCell className="text-sm font-medium">
                      {word.term}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {ctx?.partOfSpeech.toLowerCase() ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {ctx?.phonetic ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {truncatedMeaning || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {word.user.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(word.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmWord(word)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

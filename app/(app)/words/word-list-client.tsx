'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Search, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { deleteWord } from '@/app/actions/words';

function fmtDateTime(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

type Category = { id: string; name: string; color: string };
type WordContext = { partOfSpeech: string; meaning: string };
type WordCategory = { category: Category };
type Word = {
  id: string;
  term: string;
  imageUrl: string | null;
  createdAt: Date;
  contexts: WordContext[];
  categories: WordCategory[];
};

type Props = {
  words: Word[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  initialQ: string;
  initialCategory: string;
};

export function WordListClient({
  words,
  categories,
  page,
  totalPages,
  initialQ,
  initialCategory,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<'card' | 'list'>('card');
  const [search, setSearch] = useState(initialQ);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(q: string, cat: string, p = 1) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    if (p > 1) params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(search, initialCategory);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteWord(deleteTarget.id);
        toast.success(`"${deleteTarget.term}" deleted`);
        setDeleteTarget(null);
        router.refresh();
      } catch {
        toast.error('Failed to delete word');
      }
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-2 flex-1 min-w-48"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search words…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <Select
          value={initialCategory || 'all'}
          onValueChange={(val) =>
            applyFilters(search, val === 'all' ? '' : val)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-none h-9 w-9 ${view === 'card' ? 'bg-muted' : ''}`}
            onClick={() => setView('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-none h-9 w-9 ${view === 'list' ? 'bg-muted' : ''}`}
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {words.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>No words found.</p>
          {!initialQ && !initialCategory && (
            <Button
              asChild
              className="mt-4 bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/words/new">Add your first word</Link>
            </Button>
          )}
        </div>
      )}

      {/* Card view */}
      {words.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {words.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onDelete={() => setDeleteTarget(word)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {words.length > 0 && view === 'list' && (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{word.term}</p>
                  {word.contexts[0] && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      <span className="text-primary mr-1">
                        {word.contexts[0].partOfSpeech}
                      </span>
                      {word.contexts[0].meaning}
                    </p>
                  )}
                  <p
                    className="text-[11px] text-muted-foreground/60 mt-0.5"
                    suppressHydrationWarning
                  >
                    {fmtDateTime(word.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {word.categories.map(({ category }) => (
                    <Badge
                      key={category.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: category.color,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/words/${word.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(word)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => applyFilters(search, initialCategory, page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => applyFilters(search, initialCategory, page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete &ldquo;{deleteTarget?.term}&rdquo;?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the word and all its contexts and
            examples.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

function WordCard({ word, onDelete }: { word: Word; onDelete: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {word.imageUrl ? (
        <div className="relative h-32 bg-muted shrink-0">
          <Image
            src={word.imageUrl}
            alt={word.term}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center shrink-0">
          <span className="text-4xl font-bold text-muted-foreground/30">
            {word.term[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="font-semibold">{word.term}</p>
        {word.contexts[0] && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            <span className="text-primary font-medium mr-1">
              {word.contexts[0].partOfSpeech}
            </span>
            {word.contexts[0].meaning}
          </p>
        )}
        <div className="mt-auto">
          <div className="flex gap-1 flex-wrap">
            {word.categories.slice(0, 2).map(({ category }) => (
              <Badge
                key={category.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: category.color, color: category.color }}
              >
                {category.name}
              </Badge>
            ))}
            {word.categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{word.categories.length - 2}
              </Badge>
            )}
          </div>
          <p
            className="text-[11px] text-muted-foreground/60 mt-1.5"
            suppressHydrationWarning
          >
            {fmtDateTime(word.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex border-t border-border">
        <Button
          variant="ghost"
          className="flex-1 rounded-none h-8 text-xs"
          asChild
        >
          <Link href={`/words/${word.id}/edit`}>
            <Pencil className="mr-1.5 h-3 w-3" />
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none h-8 text-xs text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-1.5 h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

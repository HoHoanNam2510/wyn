'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  CheckSquare2,
} from 'lucide-react';
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
import { deleteWord, deleteWords } from '@/app/actions/words';
import { AudioButton } from '@/components/ui/audio-button';

function fmtDateTime(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

type Category = { id: string; name: string; color: string };
type WordContext = {
  partOfSpeech: string;
  meaning: string;
  phonetic: string | null;
  audioUrl: string | null;
};
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
  initialSort: string;
};

export function WordListClient({
  words,
  categories,
  page,
  totalPages,
  initialQ,
  initialCategory,
  initialSort,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<'card' | 'list'>('card');
  const [search, setSearch] = useState(initialQ);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === words.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((w) => w.id)));
    }
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        const result = await deleteWords(ids);
        toast.success(
          `${result.count} word${result.count !== 1 ? 's' : ''} deleted`
        );
        setShowBulkConfirm(false);
        exitSelectionMode();
        router.refresh();
      } catch {
        toast.error('Failed to delete words');
      }
    });
  }

  function applyFilters(q: string, cat: string, p = 1, sort = initialSort) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    if (p > 1) params.set('page', String(p));
    if (sort !== 'newest') params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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

  const allSelected = words.length > 0 && selectedIds.size === words.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <>
      {/* Bulk selection action bar */}
      {selectionMode && (
        <div className="flex items-center justify-between bg-muted/60 border border-border rounded-lg px-4 py-2.5 gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              aria-label="Select all on this page"
            />
            <span className="text-sm font-medium">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : 'Select words to delete'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0 || isPending}
              onClick={() => setShowBulkConfirm(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete {selectedIds.size > 0 ? selectedIds.size : ''}
            </Button>
            <Button variant="outline" size="sm" onClick={exitSelectionMode}>
              Cancel
            </Button>
          </div>
        </div>
      )}

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

        <Select
          value={initialSort}
          onValueChange={(val) => applyFilters(search, initialCategory, 1, val)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="az">A → Z</SelectItem>
            <SelectItem value="za">Z → A</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant={selectionMode ? 'secondary' : 'outline'}
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              if (selectionMode) exitSelectionMode();
              else setSelectionMode(true);
            }}
            title="Select multiple"
          >
            <CheckSquare2 className="h-4 w-4" />
          </Button>
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
          {words.map((word, i) => (
            <WordCard
              key={word.id}
              word={word}
              onDelete={() => setDeleteTarget(word)}
              priority={i < 8}
              selectionMode={selectionMode}
              selected={selectedIds.has(word.id)}
              onToggleSelect={() => toggleSelection(word.id)}
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
              className={`flex items-center justify-between px-4 py-3 transition-colors
                ${selectionMode && selectedIds.has(word.id) ? 'bg-primary/5' : ''}
                ${selectionMode ? 'cursor-pointer hover:bg-muted/40' : ''}`}
              onClick={
                selectionMode ? () => toggleSelection(word.id) : undefined
              }
            >
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(word.id)}
                  onChange={() => toggleSelection(word.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
                />
              )}
              <div
                className={`flex items-center gap-4 min-w-0 flex-1 transition-opacity
                  ${!selectionMode ? 'hover:opacity-80 cursor-pointer' : ''}`}
                onClick={
                  !selectionMode
                    ? () => router.push(`/words/${word.id}`)
                    : undefined
                }
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">{word.term}</p>
                    {word.contexts[0]?.audioUrl && (
                      <span onClick={(e) => e.stopPropagation()}>
                        <AudioButton
                          url={word.contexts[0].audioUrl}
                          label={`Phát âm ${word.term}`}
                        />
                      </span>
                    )}
                    {word.contexts[0]?.phonetic && (
                      <span className="text-xs text-muted-foreground italic">
                        {word.contexts[0].phonetic}
                      </span>
                    )}
                  </div>
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
              {!selectionMode && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/words/${word.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(word);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
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

      {/* Single delete confirmation */}
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

      {/* Bulk delete confirmation */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.size} word{selectedIds.size !== 1 ? 's' : ''}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all selected words along with their
            contexts and examples. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              Delete {selectedIds.size} word{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WordCard({
  word,
  onDelete,
  priority = false,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  word: Word;
  onDelete: () => void;
  priority?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const router = useRouter();
  return (
    <div
      className={`bg-card border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow
        ${selected ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
    >
      <div
        className="flex flex-col flex-1 min-h-0 cursor-pointer relative"
        onClick={() => {
          if (selectionMode) onToggleSelect?.();
          else router.push(`/words/${word.id}`);
        }}
      >
        {/* Selection checkbox overlay */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-white accent-primary cursor-pointer shadow"
            />
          </div>
        )}

        {word.imageUrl ? (
          <div className="relative h-32 bg-muted shrink-0">
            <Image
              src={word.imageUrl}
              alt={word.term}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority={priority}
            />
          </div>
        ) : (
          <div className="h-32 bg-muted flex items-center justify-center shrink-0">
            <span className="text-4xl font-bold text-muted-foreground/30">
              {word.term[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="p-3 flex flex-col gap-2 flex-1 border-t border-border">
          <p className="font-semibold">{word.term}</p>
          {(word.contexts[0]?.phonetic || word.contexts[0]?.audioUrl) && (
            <div
              className="flex items-center gap-1.5 -mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {word.contexts[0].phonetic && (
                <span className="text-xs text-muted-foreground italic">
                  {word.contexts[0].phonetic}
                </span>
              )}
              {word.contexts[0].audioUrl && (
                <AudioButton
                  url={word.contexts[0].audioUrl}
                  label={`Phát âm ${word.term}`}
                />
              )}
            </div>
          )}
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
      </div>
      {!selectionMode && (
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
      )}
    </div>
  );
}

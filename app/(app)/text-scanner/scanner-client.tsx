'use client';

import { useState } from 'react';
import { ScanText, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { tokenize, type WordEntry } from '@/lib/text-scanner';

type SelectedToken = {
  display: string;
  lookup: string;
  entry: WordEntry | null;
};

type Props = {
  wordMap: Record<string, WordEntry>;
};

export function ScannerClient({ wordMap }: Props) {
  const [text, setText] = useState('');
  const [scanned, setScanned] = useState(false);
  const [selected, setSelected] = useState<SelectedToken | null>(null);

  const tokens = scanned ? tokenize(text) : [];

  const masteredCount = tokens.filter(
    (t) => wordMap[t.lookup]?.status === 'mastered'
  ).length;
  const learningCount = tokens.filter(
    (t) => wordMap[t.lookup]?.status === 'learning'
  ).length;
  const unknownCount = tokens.filter(
    (t) => t.lookup && !wordMap[t.lookup]
  ).length;

  function handleScan() {
    if (text.trim()) setScanned(true);
  }

  function handleClear() {
    setText('');
    setScanned(false);
    setSelected(null);
  }

  function handleTokenClick(token: { display: string; lookup: string }) {
    if (!token.lookup) return;
    setSelected({
      display: token.display,
      lookup: token.lookup,
      entry: wordMap[token.lookup] ?? null,
    });
  }

  return (
    <>
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setScanned(false);
          }}
          placeholder="Paste any English text here..."
          className="min-h-36 resize-none text-sm"
          rows={6}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleScan}
            disabled={!text.trim()}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <ScanText className="mr-2 h-4 w-4" />
            Scan
          </Button>
          {scanned && (
            <Button variant="outline" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {scanned && tokens.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Mastered</span>
              <span className="text-muted-foreground">({masteredCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span>Learning</span>
              <span className="text-muted-foreground">({learningCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground" />
              <span>Unknown</span>
              <span className="text-muted-foreground">({unknownCount})</span>
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 leading-9 text-base">
            {tokens.map((token, i) => {
              const entry = token.lookup ? wordMap[token.lookup] : undefined;
              let spanClass = '';
              if (entry?.status === 'mastered') {
                spanClass =
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded px-1 cursor-pointer hover:opacity-80 transition-opacity';
              } else if (entry?.status === 'learning') {
                spanClass =
                  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded px-1 cursor-pointer hover:opacity-80 transition-opacity';
              } else if (token.lookup) {
                spanClass =
                  'text-muted-foreground cursor-pointer hover:text-foreground transition-colors underline-offset-2 hover:underline';
              }

              return (
                <span key={i}>
                  <span
                    className={spanClass}
                    onClick={
                      token.lookup ? () => handleTokenClick(token) : undefined
                    }
                  >
                    {token.display}
                  </span>{' '}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">{selected?.lookup}</DialogTitle>
          </DialogHeader>
          {selected?.entry ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    selected.entry.status === 'mastered'
                      ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                      : 'bg-amber-400 hover:bg-amber-400 text-white'
                  }
                >
                  {selected.entry.status === 'mastered'
                    ? 'Mastered'
                    : 'Learning'}
                </Badge>
                {selected.entry.partOfSpeech && (
                  <Badge variant="secondary">
                    {selected.entry.partOfSpeech}
                  </Badge>
                )}
              </div>
              {selected.entry.meaning && (
                <p className="text-sm text-muted-foreground">
                  {selected.entry.meaning}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <DialogDescription>
                This word isn&apos;t in your vocabulary yet.
              </DialogDescription>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-white w-full"
              >
                <Link
                  href={`/words/new?term=${encodeURIComponent(selected?.lookup ?? '')}`}
                  onClick={() => setSelected(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add &ldquo;{selected?.lookup}&rdquo; to vocabulary
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

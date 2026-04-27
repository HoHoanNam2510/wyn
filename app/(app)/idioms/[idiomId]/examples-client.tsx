'use client';

import { useState, useTransition } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addIdiomExample, deleteIdiomExample } from '@/app/actions/idioms';

type Example = { id: string; sentence: string };

export function IdiomExamplesClient({
  idiomId,
  initialExamples,
}: {
  idiomId: string;
  initialExamples: Example[];
}) {
  const [examples, setExamples] = useState<Example[]>(initialExamples);
  const [sentence, setSentence] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = sentence.trim();
    if (!trimmed) {
      setError('Sentence is required.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Sentence must be 500 characters or less.');
      return;
    }
    setError('');

    startTransition(async () => {
      try {
        await addIdiomExample(idiomId, { sentence: trimmed });
        setSentence('');
        setExamples((prev) => [
          ...prev,
          { id: `opt-${Date.now()}`, sentence: trimmed },
        ]);
      } catch {
        setError('Failed to add example. Please try again.');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteIdiomExample(id);
        setExamples((prev) => prev.filter((e) => e.id !== id));
      } catch {
        setError('Failed to delete example. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Your Examples
      </p>

      {examples.length === 0 && (
        <p className="text-sm text-muted-foreground italic px-1">
          You have not added any examples yet.
        </p>
      )}

      {examples.length > 0 && (
        <ul className="space-y-1.5">
          {examples.map((ex, i) => (
            <li
              key={ex.id}
              className="flex items-start gap-2.5 text-sm bg-card border border-border rounded-lg px-4 py-3 group"
            >
              <span className="text-muted-foreground shrink-0 font-mono text-xs mt-0.5">
                {i + 1}.
              </span>
              <span className="flex-1">{ex.sentence}</span>
              <button
                onClick={() => handleDelete(ex.id)}
                disabled={isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                aria-label="Delete example"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Write your own example sentence..."
          disabled={isPending}
          className="flex-1 text-sm"
        />
        <Button
          onClick={handleAdd}
          disabled={isPending || !sentence.trim()}
          size="sm"
          className="shrink-0 bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

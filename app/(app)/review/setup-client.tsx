'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, FileEdit, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = {
  id: string;
  name: string;
  color: string;
  wordCount: number;
};

type Props = {
  categories: Category[];
  totalWords: number;
};

const COUNT_OPTIONS = [
  { value: '10', label: '10 questions' },
  { value: '20', label: '20 questions' },
  { value: '50', label: '50 questions' },
  { value: 'all', label: 'All available' },
];

export function ReviewSetupClient({ categories, totalWords }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<
    'flashcard' | 'fill_blank' | 'sentence_build'
  >('flashcard');
  const [categoryId, setCategoryId] = useState('all');
  const [count, setCount] = useState('20');

  const selectedCat = categories.find((c) => c.id === categoryId);
  const availableWords =
    categoryId === 'all' ? totalWords : (selectedCat?.wordCount ?? 0);

  // Flashcard needs ≥4 words for distractors; fill_blank needs ≥1
  const minRequired = mode === 'flashcard' ? 4 : 1;
  const canStart = availableWords >= minRequired;

  function handleStart() {
    const params = new URLSearchParams({ mode, category: categoryId, count });
    router.push(`/review/session?${params.toString()}`);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Mode</Label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: 'flashcard', label: 'Flashcard MC', Icon: BookOpen },
              { value: 'fill_blank', label: 'Fill in Blank', Icon: FileEdit },
              {
                value: 'sentence_build',
                label: 'Sentence Builder',
                Icon: Puzzle,
              },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                mode === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All categories ({totalWords} words)
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name} ({cat.wordCount} words)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Number of questions</Label>
        <Select value={count} onValueChange={setCount}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!canStart && (
        <p className="text-sm text-destructive">
          {mode === 'flashcard'
            ? `Flashcard mode needs at least 4 words (${availableWords} available).`
            : `No words with matching examples found in this category.`}
        </p>
      )}

      <Button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        Start Review
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

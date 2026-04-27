'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
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
  title: string;
  exampleCount: number;
};

type Props = {
  categories: Category[];
  totalExamples: number;
};

const COUNT_OPTIONS = [
  { value: '10', label: '10 questions' },
  { value: '20', label: '20 questions' },
  { value: 'all', label: 'All available' },
];

export function IdiomQuizSetupClient({ categories, totalExamples }: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState('all');
  const [count, setCount] = useState('10');

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const availableExamples =
    categoryId === 'all'
      ? totalExamples
      : (selectedCategory?.exampleCount ?? 0);

  const canStart = availableExamples >= 1;

  function handleStart() {
    const params = new URLSearchParams({ category: categoryId, count });
    router.push(`/idioms/quiz/session?${params.toString()}`);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Category filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All categories ({totalExamples} examples)
            </SelectItem>
            {categories.map((c) => (
              <SelectItem
                key={c.id}
                value={c.id}
                disabled={c.exampleCount === 0}
              >
                {c.title} ({c.exampleCount} examples)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Question count */}
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
          No examples available in this category yet.
        </p>
      )}

      <Button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        Start Quiz
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

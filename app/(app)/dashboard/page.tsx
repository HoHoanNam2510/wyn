import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Plus,
  BookOpen,
  FolderOpen,
  RotateCcw,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [wordCount, categoryCount] = await Promise.all([
    db.word.count({ where: { userId } }),
    db.category.count({ where: { userId } }),
  ]);

  const firstName = session?.user?.name?.split(' ')[0] ?? '';

  if (wordCount === 0) {
    return (
      <OnboardingView firstName={firstName} categoryCount={categoryCount} />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&rsquo;s your vocabulary overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wordCount}</p>
              <p className="text-sm text-muted-foreground">Words</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categoryCount}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button asChild className="bg-primary hover:bg-primary/90 text-white">
          <Link href="/words/new">
            <Plus className="mr-2 h-4 w-4" />
            Add word
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/words">View all words</Link>
        </Button>
      </div>
    </div>
  );
}

function OnboardingView({
  firstName,
  categoryCount,
}: {
  firstName: string;
  categoryCount: number;
}) {
  const steps = [
    {
      n: 1,
      title: 'Add your first word',
      description:
        'Search for any English word — Wyn auto-fetches the definition, phonetics, and an image for you.',
      cta: 'Add a word',
      href: '/words/new',
      done: false,
    },
    {
      n: 2,
      title: 'Create a category',
      description:
        'Group words by topic (e.g. "Business", "Travel") to filter reviews and stay organized.',
      cta: 'Create category',
      href: '/categories',
      done: categoryCount > 0,
    },
    {
      n: 3,
      title: 'Start reviewing',
      description:
        'Use Flashcard, Fill-in-blank, Sentence Builder, or AI-powered Writing Practice — all with spaced repetition.',
      cta: 'Go to Review',
      href: '/review',
      done: false,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome to Wyn{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Get started in three steps — your personal vocabulary trainer is
          ready.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
          >
            <div className="shrink-0 mt-0.5">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                Step {step.n} — {step.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant={step.done ? 'outline' : 'default'}
              className={
                step.done ? '' : 'bg-primary hover:bg-primary/90 text-white'
              }
            >
              <Link href={step.href}>{step.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-3">
        <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Prefer to import?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You can bulk-import words from a JSON file.{' '}
            <Link
              href="/words/import"
              className="text-primary hover:underline underline-offset-2"
            >
              Import words →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

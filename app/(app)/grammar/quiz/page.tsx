import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookMarked, ChevronRight, Zap } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GrammarQuizSetupClient } from './setup-client';

export default async function GrammarQuizPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const sections = await db.grammarSection.findMany({
    orderBy: { order: 'asc' },
    include: {
      patterns: {
        include: { examples: { select: { id: true } } },
      },
    },
  });

  const sectionsWithCount = sections.map((s) => ({
    id: s.id,
    title: s.title,
    exampleCount: s.patterns.reduce((acc, p) => acc + p.examples.length, 0),
  }));

  const totalExamples = sectionsWithCount.reduce(
    (acc, s) => acc + s.exampleCount,
    0
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/grammar"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <BookMarked className="h-3.5 w-3.5" />
          Grammar
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Quiz</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Grammar Quiz</h1>
          <p className="text-sm text-muted-foreground">
            Identify the grammar pattern for each example sentence
          </p>
        </div>
      </div>

      <GrammarQuizSetupClient
        sections={sectionsWithCount}
        totalExamples={totalExamples}
      />
    </div>
  );
}

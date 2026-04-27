import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, ChevronRight, Zap } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { IdiomQuizSetupClient } from './setup-client';

export default async function IdiomQuizPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const categories = await db.idiomCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      idioms: {
        include: { examples: { select: { id: true } } },
      },
    },
  });

  const categoriesWithCount = categories.map((c) => ({
    id: c.id,
    title: c.title,
    exampleCount: c.idioms.reduce((acc, i) => acc + i.examples.length, 0),
  }));

  const totalExamples = categoriesWithCount.reduce(
    (acc, c) => acc + c.exampleCount,
    0
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/idioms"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Idioms
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
          <h1 className="text-2xl font-bold">Idiom Quiz</h1>
          <p className="text-sm text-muted-foreground">
            Identify the idiom from each example sentence
          </p>
        </div>
      </div>

      <IdiomQuizSetupClient
        categories={categoriesWithCount}
        totalExamples={totalExamples}
      />
    </div>
  );
}

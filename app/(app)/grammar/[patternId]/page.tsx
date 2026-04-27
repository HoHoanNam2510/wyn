import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  FormulaDisplay,
  type FormulaChunk,
} from '@/components/grammar/formula-display';
import { ExamplesClient } from './examples-client';

export default async function GrammarPatternPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const { patternId } = await params;

  const pattern = await db.grammarPattern.findUnique({
    where: { id: patternId },
    include: {
      section: true,
      examples: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!pattern) notFound();

  const systemExamples = pattern.examples.filter((e) => e.userId === null);
  const userExamples = pattern.examples.filter((e) => e.userId === userId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/grammar"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Grammar
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">
          {pattern.section.title}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">{pattern.title}</h1>
        {pattern.notes && (
          <p className="text-sm text-muted-foreground">{pattern.notes}</p>
        )}
      </div>

      {/* Formula */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Formula
        </p>
        <FormulaDisplay chunks={pattern.formula as FormulaChunk[]} />
      </div>

      {/* System examples */}
      {systemExamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Examples
          </p>
          <ul className="space-y-1.5">
            {systemExamples.map((ex, i) => (
              <li
                key={ex.id}
                className="flex gap-2.5 text-sm bg-card border border-border rounded-lg px-4 py-3"
              >
                <span className="text-muted-foreground shrink-0 font-mono text-xs mt-0.5">
                  {i + 1}.
                </span>
                <span>{ex.sentence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User examples (client — add/delete) */}
      <ExamplesClient
        patternId={pattern.id}
        initialExamples={userExamples.map((e) => ({
          id: e.id,
          sentence: e.sentence,
        }))}
      />
    </div>
  );
}

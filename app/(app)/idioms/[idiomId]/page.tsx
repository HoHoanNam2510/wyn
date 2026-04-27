import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { IdiomExamplesClient } from './examples-client';

export default async function IdiomDetailPage({
  params,
}: {
  params: Promise<{ idiomId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const { idiomId } = await params;

  const idiom = await db.idiom.findUnique({
    where: { id: idiomId },
    include: {
      category: true,
      examples: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!idiom) notFound();

  const systemExamples = idiom.examples.filter((e) => e.userId === null);
  const userExamples = idiom.examples.filter((e) => e.userId === userId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/idioms"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Idioms
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">
          {idiom.category.title}
        </span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold italic">
            &ldquo;{idiom.phrase}&rdquo;
          </h1>
          {idiom.register && (
            <Badge variant="outline" className="capitalize">
              {idiom.register}
            </Badge>
          )}
        </div>
        {idiom.notes && (
          <p className="text-sm text-muted-foreground">{idiom.notes}</p>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Meaning
        </p>
        <p className="text-sm leading-relaxed">{idiom.explanation}</p>
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
      <IdiomExamplesClient
        idiomId={idiom.id}
        initialExamples={userExamples.map((e) => ({
          id: e.id,
          sentence: e.sentence,
        }))}
      />
    </div>
  );
}

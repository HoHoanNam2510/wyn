import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BrainCircuit, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

export default async function SrsHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const now = new Date();

  const [dueCount, nextDue, totalEnrolled] = await Promise.all([
    db.word.count({
      where: {
        userId,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
    }),
    db.word.findFirst({
      where: { userId, nextReviewAt: { gt: now } },
      orderBy: { nextReviewAt: 'asc' },
      select: { nextReviewAt: true },
    }),
    db.word.count({
      where: { userId, nextReviewAt: { not: null } },
    }),
  ]);

  if (dueCount > 0) {
    return (
      <div className="max-w-md mx-auto mt-16 flex flex-col items-center gap-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BrainCircuit className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">SRS Review</h1>
          <p className="text-muted-foreground mt-1">
            Spaced Repetition System — SM-2 algorithm
          </p>
        </div>

        <div className="w-full bg-card border border-border rounded-xl px-6 py-5 flex flex-col items-center gap-3">
          <p className="text-5xl font-bold text-primary">{dueCount}</p>
          <p className="text-sm text-muted-foreground">
            word{dueCount !== 1 ? 's' : ''} due for review
          </p>
          <Button asChild className="w-full mt-2">
            <Link href="/review/srs/session">Start Review</Link>
          </Button>
        </div>

        <Button variant="outline" asChild>
          <Link href="/review">Back to Review</Link>
        </Button>
      </div>
    );
  }

  const nextReviewAt = nextDue?.nextReviewAt;

  return (
    <div className="max-w-md mx-auto mt-16 flex flex-col items-center gap-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <BrainCircuit className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">SRS Review</h1>
        <p className="text-muted-foreground mt-1">
          Spaced Repetition System — SM-2 algorithm
        </p>
      </div>

      <div className="w-full bg-card border border-border rounded-xl px-6 py-5 flex flex-col items-center gap-3">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="text-lg font-semibold">All caught up!</p>
        {nextReviewAt ? (
          <p className="text-sm text-muted-foreground">
            Next review:{' '}
            <span className="font-medium text-foreground">
              {nextReviewAt.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </p>
        ) : totalEnrolled === 0 ? (
          <p className="text-sm text-muted-foreground">
            Review your words to enroll them in SRS.
          </p>
        ) : null}
        {totalEnrolled > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalEnrolled} word{totalEnrolled !== 1 ? 's' : ''} enrolled in SRS
          </p>
        )}
      </div>

      <Button variant="outline" asChild>
        <Link href="/review">Back to Review</Link>
      </Button>
    </div>
  );
}

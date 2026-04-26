import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { pickQuestions } from '@/lib/review/pickQuestions';
import { SessionClient } from './session-client';

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const params = await searchParams;
  const mode = params.mode as 'flashcard' | 'fill_blank';
  const categoryId = params.category ?? 'all';
  const countParam = params.count ?? '20';
  const count =
    countParam === 'all'
      ? 'all'
      : isNaN(parseInt(countParam, 10))
        ? 20
        : parseInt(countParam, 10);

  if (mode !== 'flashcard' && mode !== 'fill_blank') redirect('/review');

  const questions = await pickQuestions({ userId, mode, categoryId, count });

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-2">No questions available</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {mode === 'fill_blank'
            ? 'No words with matching examples were found. Add examples to your words first.'
            : 'Not enough words in this category. Add at least 4 words to use Flashcard mode.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/review">Back to setup</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <SessionClient questions={questions} mode={mode} />
    </div>
  );
}

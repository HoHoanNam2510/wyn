import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { pickIdiomQuizQuestions } from '@/lib/idiomQuiz/pickQuestions';
import { IdiomQuizSessionClient } from './session-client';

type Props = {
  searchParams: Promise<{ category?: string; count?: string }>;
};

export default async function IdiomQuizSessionPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const { category = 'all', count = '10' } = await searchParams;

  const parsedCount: number | 'all' =
    count === 'all' ? 'all' : Math.max(1, parseInt(count, 10) || 10);

  const questions = await pickIdiomQuizQuestions({
    categoryId: category,
    count: parsedCount,
  });

  if (questions.length === 0) redirect('/idioms/quiz');

  return (
    <div className="max-w-2xl mx-auto">
      <IdiomQuizSessionClient questions={questions} />
    </div>
  );
}

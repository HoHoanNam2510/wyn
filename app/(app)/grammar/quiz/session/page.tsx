import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { pickGrammarQuizQuestions } from '@/lib/grammarQuiz/pickQuestions';
import { GrammarQuizSessionClient } from './session-client';

type Props = {
  searchParams: Promise<{ section?: string; count?: string }>;
};

export default async function GrammarQuizSessionPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const { section = 'all', count = '10' } = await searchParams;

  const parsedCount: number | 'all' =
    count === 'all' ? 'all' : Math.max(1, parseInt(count, 10) || 10);

  const questions = await pickGrammarQuizQuestions({
    sectionId: section,
    count: parsedCount,
  });

  if (questions.length === 0) redirect('/grammar/quiz');

  return (
    <div className="max-w-2xl mx-auto">
      <GrammarQuizSessionClient questions={questions} />
    </div>
  );
}

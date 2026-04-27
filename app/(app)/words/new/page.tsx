import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { WordForm } from '@/components/words/word-form';

type Props = {
  searchParams: Promise<{ term?: string }>;
};

export default async function NewWordPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const userId = session!.user.id;

  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });

  const prefillTerm = params.term?.trim() ?? '';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Add word</h1>
        <p className="text-muted-foreground mt-1">
          Type a word and click &ldquo;Auto-fill&rdquo; to fetch from
          dictionary, or fill in manually.
        </p>
      </div>
      <WordForm
        categories={categories}
        defaultValues={prefillTerm ? { term: prefillTerm } : undefined}
      />
    </div>
  );
}

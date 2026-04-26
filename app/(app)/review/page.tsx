import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ReviewSetupClient } from './setup-client';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  const [categories, totalWords] = await Promise.all([
    db.category.findMany({
      where: { userId },
      include: { _count: { select: { words: true } } },
      orderBy: { name: 'asc' },
    }),
    db.word.count({ where: { userId } }),
  ]);

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Review</h1>
        <p className="text-muted-foreground mt-1">
          Choose a mode and start practising your vocabulary.
        </p>
      </div>
      <ReviewSetupClient
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          wordCount: c._count.words,
        }))}
        totalWords={totalWords}
      />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { WordForm } from '@/components/words/word-form';
import type { WordFormValues } from '@/lib/schemas/word';

type Props = { params: Promise<{ id: string }> };

export default async function EditWordPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const word = await db.word.findFirst({
    where: { id, userId },
    include: {
      contexts: {
        orderBy: { order: 'asc' },
        include: { examples: true },
      },
      categories: true,
    },
  });

  if (!word) notFound();

  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });

  const defaultValues: WordFormValues = {
    term: word.term,
    imageUrl: word.imageUrl ?? '',
    categoryIds: word.categories.map(
      (wc: { categoryId: string }) => wc.categoryId
    ),
    contexts: word.contexts.map((ctx: (typeof word.contexts)[0]) => ({
      id: ctx.id,
      partOfSpeech:
        ctx.partOfSpeech as WordFormValues['contexts'][0]['partOfSpeech'],
      phonetic: ctx.phonetic ?? '',
      audioUrl: ctx.audioUrl ?? '',
      meaning: ctx.meaning,
      order: ctx.order,
      examples: ctx.examples.map((ex: { id: string; text: string }) => ({
        id: ex.id,
        text: ex.text,
      })),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit &ldquo;{word.term}&rdquo;</h1>
        <p className="text-muted-foreground mt-1">
          Update word details, contexts, and examples.
        </p>
      </div>
      <WordForm
        categories={categories}
        defaultValues={defaultValues}
        wordId={word.id}
      />
    </div>
  );
}

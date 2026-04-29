'use server';

import { auth, signOut } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function deleteAccount() {
  const userId = await requireUser();
  await db.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: '/sign-in' });
}

export async function exportData() {
  const userId = await requireUser();

  const words = await db.word.findMany({
    where: { userId },
    include: {
      contexts: {
        include: { examples: true },
        orderBy: { order: 'asc' },
      },
      categories: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return words.map((w) => ({
    term: w.term,
    imageUrl: w.imageUrl ?? undefined,
    categories: w.categories.map((wc) => wc.category.name),
    contexts: w.contexts.map((ctx) => ({
      partOfSpeech: ctx.partOfSpeech,
      phonetic: ctx.phonetic ?? undefined,
      audioUrl: ctx.audioUrl ?? undefined,
      meaning: ctx.meaning,
      examples: ctx.examples.map((ex) => ({ text: ex.text })),
    })),
  }));
}

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { wordSchema } from '@/lib/schemas/word';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

function normalizeTerm(term: string): string {
  const t = term.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export async function createWord(raw: unknown) {
  const userId = await requireUser();
  const data = wordSchema.parse(raw);
  const term = normalizeTerm(data.term);

  const existing = await db.word.findFirst({
    where: { userId, term: { equals: term, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) throw new Error(`DUPLICATE_WORD:${existing.id}`);

  const word = await db.word.create({
    data: {
      userId,
      term,
      imageUrl: data.imageUrl || null,
      categories: {
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
      contexts: {
        create: data.contexts.map((ctx, i) => ({
          partOfSpeech: ctx.partOfSpeech as never,
          phonetic: ctx.phonetic || null,
          audioUrl: ctx.audioUrl || null,
          meaning: ctx.meaning,
          order: i,
          examples: {
            create: ctx.examples.map((ex) => ({ text: ex.text })),
          },
        })),
      },
    },
  });

  revalidatePath('/words');
  return { success: true, wordId: word.id };
}

export async function updateWord(wordId: string, raw: unknown) {
  const userId = await requireUser();
  const data = wordSchema.parse(raw);
  const term = normalizeTerm(data.term);

  const word = await db.word.findFirst({ where: { id: wordId, userId } });
  if (!word) throw new Error('Word not found');

  const duplicate = await db.word.findFirst({
    where: {
      userId,
      term: { equals: term, mode: 'insensitive' },
      NOT: { id: wordId },
    },
    select: { id: true },
  });
  if (duplicate) throw new Error(`DUPLICATE_WORD:${duplicate.id}`);

  await db.$transaction([
    db.wordCategory.deleteMany({ where: { wordId } }),
    db.context.deleteMany({ where: { wordId } }),
    db.word.update({
      where: { id: wordId },
      data: {
        term,
        imageUrl: data.imageUrl || null,
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        contexts: {
          create: data.contexts.map((ctx, i) => ({
            partOfSpeech: ctx.partOfSpeech as never,
            phonetic: ctx.phonetic || null,
            audioUrl: ctx.audioUrl || null,
            meaning: ctx.meaning,
            order: i,
            examples: {
              create: ctx.examples.map((ex) => ({ text: ex.text })),
            },
          })),
        },
      },
    }),
  ]);

  revalidatePath('/words');
  revalidatePath(`/words/${wordId}/edit`);
  return { success: true };
}

export async function deleteWord(wordId: string) {
  const userId = await requireUser();
  await db.word.deleteMany({ where: { id: wordId, userId } });
  revalidatePath('/words');
  return { success: true };
}

export async function deleteWords(wordIds: string[]) {
  const userId = await requireUser();
  if (wordIds.length === 0) return { success: true, count: 0 };
  const { count } = await db.word.deleteMany({
    where: { id: { in: wordIds }, userId },
  });
  revalidatePath('/words');
  return { success: true, count };
}

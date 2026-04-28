'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { importFileSchema, type ImportWord } from '@/lib/schemas/import';
import { fetchDictionary } from '@/lib/dictionary';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

function normalizeTerm(term: string): string {
  const t = term.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export type ImportResult = {
  created: number;
  skipped: string[];
  errors: Array<{ term: string; reason: string }>;
};

export async function importWords(data: ImportWord[]): Promise<ImportResult> {
  const userId = await requireUser();

  // Server-side re-validation
  const parsed = importFileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid import data: ' + parsed.error.issues[0]?.message);
  }

  const words = parsed.data;

  // Fetch all existing terms for this user (for duplicate detection)
  const existingWords = await db.word.findMany({
    where: { userId },
    select: { term: true },
  });
  const existingTerms = new Set(existingWords.map((w) => w.term.toLowerCase()));

  // Fetch all existing categories for this user
  const existingCategories = await db.category.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(
    existingCategories.map((c) => [c.name.toLowerCase(), c.id])
  );

  const result: ImportResult = { created: 0, skipped: [], errors: [] };

  const normalizedWords = words.map((w) => ({
    word: w,
    term: normalizeTerm(w.term),
  }));

  const nonDuplicates = normalizedWords.filter(
    ({ term }) => !existingTerms.has(term.toLowerCase())
  );

  // Fetch phonetic+audioUrl for words where any context is missing either field.
  // We only override when the dict returns a result with audioUrl (success indicator).
  const needsFetch = nonDuplicates.filter(({ word }) =>
    word.contexts.some((ctx) => !ctx.phonetic || !ctx.audioUrl)
  );

  type DictEntry = { phonetic: string; audioUrl: string };
  const dictEntries = await Promise.all(
    needsFetch.map(async ({ term }) => {
      const results = await fetchDictionary(term);
      const first = results[0];
      return [
        term.toLowerCase(),
        { phonetic: first?.phonetic ?? '', audioUrl: first?.audioUrl ?? '' },
      ] as const;
    })
  );
  // Only keep entries where dict found an audioUrl — this is our "success" indicator
  const dictMap = new Map<string, DictEntry>(
    dictEntries.filter(([, e]) => e.audioUrl)
  );

  for (const { word, term } of normalizedWords) {
    if (existingTerms.has(term.toLowerCase())) {
      result.skipped.push(term);
      continue;
    }

    try {
      // Resolve category IDs, creating missing ones
      const categoryIds: string[] = [];
      for (const catName of word.categories ?? []) {
        const key = catName.toLowerCase();
        if (categoryMap.has(key)) {
          categoryIds.push(categoryMap.get(key)!);
        } else {
          const newCat = await db.category.create({
            data: { userId, name: catName, color: '#6b7280' },
          });
          categoryMap.set(key, newCat.id);
          categoryIds.push(newCat.id);
        }
      }

      const dict = dictMap.get(term.toLowerCase());

      await db.word.create({
        data: {
          userId,
          term,
          imageUrl: word.imageUrl || null,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          contexts: {
            create: word.contexts.map((ctx, i) => {
              const bothProvided = !!(ctx.phonetic && ctx.audioUrl);
              const useDict = !bothProvided && !!dict;
              return {
                partOfSpeech: ctx.partOfSpeech as never,
                phonetic: (useDict ? dict!.phonetic : ctx.phonetic) || null,
                audioUrl: (useDict ? dict!.audioUrl : ctx.audioUrl) || null,
                meaning: ctx.meaning,
                order: i,
                examples: {
                  create: ctx.examples.map((ex) => ({ text: ex.text })),
                },
              };
            }),
          },
        },
      });

      existingTerms.add(term.toLowerCase());
      result.created++;
    } catch {
      result.errors.push({ term, reason: 'Failed to create word' });
    }
  }

  revalidatePath('/words');
  return result;
}

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { grammarExampleSchema } from '@/lib/schemas/grammar';

export async function addGrammarExample(patternId: string, raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { sentence } = grammarExampleSchema.parse(raw);

  await db.grammarExample.create({
    data: { patternId, userId: session.user.id, sentence },
  });

  revalidatePath(`/grammar/${patternId}`);
}

export async function deleteGrammarExample(exampleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const example = await db.grammarExample.findUnique({
    where: { id: exampleId },
  });
  if (!example) throw new Error('Example not found');
  if (example.userId === null) throw new Error('Cannot delete system examples');
  if (example.userId !== session.user.id) throw new Error('Unauthorized');

  await db.grammarExample.delete({ where: { id: exampleId } });
  revalidatePath(`/grammar/${example.patternId}`);
}

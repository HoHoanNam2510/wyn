'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { idiomExampleSchema } from '@/lib/schemas/idioms';

export async function addIdiomExample(idiomId: string, raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { sentence } = idiomExampleSchema.parse(raw);

  await db.idiomExample.create({
    data: { idiomId, userId: session.user.id, sentence },
  });

  revalidatePath(`/idioms/${idiomId}`);
}

export async function deleteIdiomExample(exampleId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const example = await db.idiomExample.findUnique({
    where: { id: exampleId },
  });
  if (!example) throw new Error('Example not found');
  if (example.userId === null) throw new Error('Cannot delete system examples');
  if (example.userId !== session.user.id) throw new Error('Unauthorized');

  await db.idiomExample.delete({ where: { id: exampleId } });
  revalidatePath(`/idioms/${example.idiomId}`);
}

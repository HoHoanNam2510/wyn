'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categorySchema } from '@/lib/schemas/category';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function createCategory(raw: unknown) {
  const userId = await requireUser();
  const data = categorySchema.parse(raw);
  const category = await db.category.create({ data: { ...data, userId } });
  revalidatePath('/categories');
  return { success: true, category };
}

export async function updateCategory(id: string, raw: unknown) {
  const userId = await requireUser();
  const data = categorySchema.parse(raw);
  await db.category.updateMany({ where: { id, userId }, data });
  revalidatePath('/categories');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const userId = await requireUser();
  await db.category.deleteMany({ where: { id, userId } });
  revalidatePath('/categories');
  return { success: true };
}

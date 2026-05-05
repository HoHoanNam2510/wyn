'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAuditLog } from '@/lib/admin/audit';
import { feedbackSubmitSchema, announcementSchema } from '@/lib/schemas/admin';

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Forbidden');
  return session.user.email!;
}

async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function adminDeleteUser(userId: string) {
  const adminEmail = await requireAdmin();
  await db.user.delete({ where: { id: userId } });
  await writeAuditLog({
    adminEmail,
    action: 'DELETE_USER',
    entityType: 'User',
    entityId: userId,
  });
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { success: true };
}

export async function adminDeleteWord(wordId: string) {
  const adminEmail = await requireAdmin();
  const word = await db.word.findUnique({
    where: { id: wordId },
    select: { term: true, userId: true },
  });
  await db.word.delete({ where: { id: wordId } });
  await writeAuditLog({
    adminEmail,
    action: 'DELETE_WORD',
    entityType: 'Word',
    entityId: wordId,
    metadata: { term: word?.term, ownerId: word?.userId },
  });
  revalidatePath('/admin/words');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
) {
  const adminEmail = await requireAdmin();
  await db.feedback.update({ where: { id: feedbackId }, data: { status } });
  await writeAuditLog({
    adminEmail,
    action: 'UPDATE_FEEDBACK_STATUS',
    entityType: 'Feedback',
    entityId: feedbackId,
    metadata: { status },
  });
  revalidatePath('/admin/feedback');
  return { success: true };
}

export async function submitFeedback(raw: unknown) {
  const userId = await requireUser();
  const data = feedbackSubmitSchema.parse(raw);
  await db.feedback.create({ data: { ...data, userId } });
  revalidatePath('/feedback');
  return { success: true };
}

export async function createAnnouncement(raw: unknown) {
  const adminEmail = await requireAdmin();
  const data = announcementSchema.parse(raw);
  const announcement = await db.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  await writeAuditLog({
    adminEmail,
    action: 'CREATE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: announcement.id,
    metadata: { title: data.title },
  });
  revalidatePath('/admin/announcements');
  return { success: true };
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  const adminEmail = await requireAdmin();
  await db.announcement.update({ where: { id }, data: { isActive } });
  await writeAuditLog({
    adminEmail,
    action: isActive ? 'ACTIVATE_ANNOUNCEMENT' : 'DEACTIVATE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: id,
  });
  revalidatePath('/admin/announcements');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const adminEmail = await requireAdmin();
  await db.announcement.delete({ where: { id } });
  await writeAuditLog({
    adminEmail,
    action: 'DELETE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: id,
  });
  revalidatePath('/admin/announcements');
  return { success: true };
}

export async function updateAnnouncement(id: string, raw: unknown) {
  const adminEmail = await requireAdmin();
  const data = announcementSchema.parse(raw);
  await db.announcement.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  await writeAuditLog({
    adminEmail,
    action: 'UPDATE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: id,
    metadata: { title: data.title },
  });
  revalidatePath('/admin/announcements');
  return { success: true };
}

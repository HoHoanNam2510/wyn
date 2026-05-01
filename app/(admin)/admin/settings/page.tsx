import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { SettingsClient } from '@/app/(app)/settings/settings-client';

export const metadata: Metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const userId = session.user.id;

  const [user, wordCount, categoryCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true },
    }),
    db.word.count({ where: { userId } }),
    db.category.count({ where: { userId } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences.
        </p>
      </div>

      <SettingsClient
        user={{
          name: user?.name ?? null,
          email: user?.email ?? null,
          image: user?.image ?? null,
        }}
        stats={{ wordCount, categoryCount }}
      />
    </div>
  );
}

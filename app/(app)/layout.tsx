import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { AnnouncementBanner } from '@/components/admin/announcement-banner';
import { fetchActiveAnnouncements } from '@/lib/admin/queries';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const [srsDue, announcements] = await Promise.all([
    session?.user?.id
      ? db.word
          .count({
            where: {
              userId: session.user.id,
              OR: [
                { nextReviewAt: null },
                { nextReviewAt: { lte: new Date() } },
              ],
            },
          })
          .catch(() => 0)
      : Promise.resolve(0),
    fetchActiveAnnouncements().catch(() => []),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar srsCount={srsDue} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AnnouncementBanner announcements={announcements} />
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

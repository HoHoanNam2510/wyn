import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { SidebarProvider } from '@/components/layout/sidebar-context';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const srsDue = session?.user?.id
    ? await db.word.count({
        where: {
          userId: session.user.id,
          OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
        },
      })
    : 0;

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar srsCount={srsDue} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

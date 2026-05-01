import { fetchAdminAnnouncements } from '@/lib/admin/queries';
import { AnnouncementsClient } from './announcements-client';

export default async function AdminAnnouncementsPage() {
  const announcements = await fetchAdminAnnouncements().catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <AnnouncementsClient announcements={announcements} />
    </div>
  );
}

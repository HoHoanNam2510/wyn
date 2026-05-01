import { fetchAdminUsers } from '@/lib/admin/queries';
import { Badge } from '@/components/ui/badge';
import { UsersClient } from './users-client';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const pageSize = 20;

  const { users, total } = await fetchAdminUsers(page, pageSize).catch(() => ({
    users: [],
    total: 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <Badge variant="secondary">{total.toLocaleString()}</Badge>
      </div>

      <UsersClient
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}

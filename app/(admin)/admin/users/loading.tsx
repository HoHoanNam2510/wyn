import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="grid grid-cols-5 gap-4">
            {['Name / Email', 'Words', 'Reviews', 'Joined', 'Actions'].map(
              (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              )
            )}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-3 border-b border-border last:border-0">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

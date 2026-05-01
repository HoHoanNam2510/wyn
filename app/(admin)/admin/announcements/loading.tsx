import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAnnouncementsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      <div className="rounded-lg border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-md border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border-b border-border last:border-0">
              <div className="grid grid-cols-5 gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

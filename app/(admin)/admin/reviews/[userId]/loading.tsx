import { Skeleton } from '@/components/ui/skeleton';

export default function UserReviewDrilldownLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-8 w-56" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
        <div className="rounded-xl border border-foreground/20 overflow-hidden">
          <div className="p-3 border-b bg-primary/10">
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-3 border-b last:border-0">
              <div className="grid grid-cols-5 gap-3 items-center">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

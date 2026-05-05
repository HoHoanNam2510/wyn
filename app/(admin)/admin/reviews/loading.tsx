import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReviewsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border border-foreground/20 overflow-hidden">
          <div className="p-3 border-b bg-primary/10">
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 border-b last:border-0">
              <div className="grid grid-cols-7 gap-3 items-center">
                <Skeleton className="h-4 w-full col-span-2" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminWordsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-24" />

      <div className="flex gap-2 max-w-sm">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>

      <Skeleton className="h-4 w-32" />

      <div className="rounded-md border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-3 border-b border-border last:border-0">
            <div className="grid grid-cols-5 gap-4 items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAuditLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />

      <div className="rounded-md border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="p-3 border-b border-border last:border-0">
            <div className="grid grid-cols-6 gap-4 items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16 font-mono" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function ApiUsageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-[60px] w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

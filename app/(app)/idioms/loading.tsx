export default function IdiomsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
          <div className="space-y-1.5">
            <div className="h-7 w-40 bg-muted rounded" />
            <div className="h-4 w-28 bg-muted rounded" />
          </div>
        </div>
        <div className="h-9 w-28 bg-muted rounded-lg shrink-0" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="border border-border rounded-xl px-4 py-4 bg-card space-y-3"
        >
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="space-y-2 pl-1">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

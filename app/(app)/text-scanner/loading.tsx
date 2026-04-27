export default function TextScannerLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
        <div className="space-y-1.5">
          <div className="h-5 w-36 bg-muted rounded" />
          <div className="h-3 w-52 bg-muted rounded" />
        </div>
      </div>
      <div className="h-36 bg-muted rounded-xl" />
      <div className="h-10 w-24 bg-muted rounded" />
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white/5 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-surface-border bg-surface-raised p-3">
          <Shimmer className="mb-3 aspect-square w-full" />
          <Shimmer className="mb-2 h-4 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-surface-border bg-surface-raised p-6 sm:flex-row">
        <Shimmer className="aspect-square w-full sm:w-64" />
        <div className="flex-1 space-y-4">
          <Shimmer className="h-8 w-2/3" />
          <Shimmer className="h-4 w-1/3" />
          <Shimmer className="h-14 w-40" />
          <Shimmer className="h-4 w-1/2" />
        </div>
      </div>
      <Shimmer className="h-40 w-full rounded-2xl" />
      <Shimmer className="h-40 w-full rounded-2xl" />
    </div>
  );
}

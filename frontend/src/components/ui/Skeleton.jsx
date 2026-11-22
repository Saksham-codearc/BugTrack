import { cn } from '../../lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function SkeletonRow({ className }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonBoard() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((column) => (
        <div key={column} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <Skeleton className="mb-3 h-4 w-24" />
          {[0, 1, 2].map((card) => (
            <div key={card} className="card mb-3 p-4">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <div className="mt-4 flex justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

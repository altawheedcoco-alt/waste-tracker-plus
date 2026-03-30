import { Skeleton } from '@/components/ui/skeleton';

/**
 * مكون تحميل مؤقت موحد للتبويبات — Skeleton Screen بدلاً من Spinner
 */
const TabFallback = () => (
  <div className="space-y-4 mt-4 animate-in fade-in duration-300">
    {/* Stats row */}
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
    {/* Content block */}
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    {/* List block */}
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TabFallback;

import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for KPI cards row */
export const KPICardsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

/** Skeleton for a data table */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-card rounded-xl border overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
      {[120, 80, 100, 60, 80].map((w, i) => (
        <Skeleton key={i} className="h-4" style={{ width: w }} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

/** Skeleton for chart area */
export const ChartSkeleton = () => (
  <div className="bg-card rounded-xl border p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

/** Skeleton for feed/posts list */
export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex items-center gap-4 pt-2 border-t">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
);

/** Skeleton for Reels grid */
export const ReelsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
    ))}
  </div>
);

/** Skeleton for sidebar nav */
export const SidebarSkeleton = () => (
  <div className="space-y-2 p-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 flex-1" />
      </div>
    ))}
  </div>
);

/** Full dashboard page skeleton */
const DashboardSkeleton = () => (
  <div className="space-y-6 p-4 md:p-6" dir="rtl">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <KPICardsSkeleton />
    <div className="grid md:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    <TableSkeleton />
  </div>
);

export default DashboardSkeleton;

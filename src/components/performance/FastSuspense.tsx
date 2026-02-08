import { Suspense, memo, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FastSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  minHeight?: string;
}

// Minimal inline loader for fastest render
const MinimalLoader = memo(({ className, minHeight }: { className?: string; minHeight?: string }) => (
  <div 
    className={cn(
      "flex items-center justify-center",
      className
    )}
    style={{ minHeight: minHeight || '200px' }}
  >
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
));
MinimalLoader.displayName = 'MinimalLoader';

// Skeleton loader for content areas
const SkeletonLoader = memo(() => (
  <div className="space-y-3 p-4 animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-32 bg-muted rounded" />
  </div>
));
SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * Optimized Suspense wrapper with minimal loading states
 */
const FastSuspense = memo(({
  children,
  fallback,
  className,
  minHeight = '200px',
}: FastSuspenseProps) => (
  <Suspense fallback={fallback || <MinimalLoader className={className} minHeight={minHeight} />}>
    {children}
  </Suspense>
));

FastSuspense.displayName = 'FastSuspense';

export { MinimalLoader, SkeletonLoader };
export default FastSuspense;

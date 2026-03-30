import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, lines = 1, ...props }, ref) => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (variant === 'text' && lines > 1) {
      return (
        <div className={cn('space-y-2', className)} ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 bg-muted animate-pulse rounded"
              style={{ width: i === lines - 1 ? '70%' : '100%' }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-muted',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-md',
          variant === 'text' && 'h-3 rounded',
          variant === 'card' && 'rounded-xl',
          className,
        )}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton patterns
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('p-4 space-y-3 rounded-xl border bg-card', className)}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="text" width="40%" height={10} />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
  </div>
);

export const ListSkeleton = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <Skeleton variant="circular" width={36} height={36} />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="text" width="30%" height={10} />
        </div>
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
    ))}
  </div>
);

export const StatsSkeleton = ({ cards = 4, className }: { cards?: number; className?: string }) => (
  <div className={cn('grid grid-cols-2 gap-3', className)}>
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="p-3 rounded-xl border bg-card space-y-2">
        <Skeleton variant="text" width="40%" height={10} />
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="rectangular" width="100%" height={4} className="rounded-full" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) => (
  <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
    <div className="flex gap-3 p-3 border-b bg-muted/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / cols}%`} height={12} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3 p-3 border-b last:border-0">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} variant="text" width={`${100 / cols}%`} height={10} />
        ))}
      </div>
    ))}
  </div>
);

export { Skeleton };
export default Skeleton;

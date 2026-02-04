import { memo, useCallback, useRef, useState, ReactNode } from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PrefetchLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetchFn?: () => Promise<unknown>;
  prefetchDelay?: number;
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  preloadData?: () => Promise<unknown>;
}

/**
 * رابط ذكي مع تحميل مسبق للصفحة عند التمرير أو الظهور
 */
const PrefetchLink = memo(({
  to,
  prefetchFn,
  prefetchDelay = 100,
  prefetchOnHover = true,
  prefetchOnVisible = false,
  children,
  className,
  activeClassName,
  preloadData,
  ...props
}: PrefetchLinkProps) => {
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();

  // تنفيذ التحميل المسبق
  const executePrefetch = useCallback(async () => {
    if (isPrefetched || isLoading) return;

    setIsLoading(true);
    try {
      const promises: Promise<unknown>[] = [];
      
      if (prefetchFn) {
        promises.push(prefetchFn());
      }
      
      if (preloadData) {
        promises.push(preloadData());
      }

      await Promise.all(promises);
      setIsPrefetched(true);
    } catch (error) {
      console.warn('Prefetch failed for:', to, error);
    } finally {
      setIsLoading(false);
    }
  }, [isPrefetched, isLoading, prefetchFn, preloadData, to]);

  // معالجة hover
  const handleMouseEnter = useCallback(() => {
    if (!prefetchOnHover || isPrefetched) return;

    prefetchTimeoutRef.current = setTimeout(() => {
      executePrefetch();
    }, prefetchDelay);
  }, [prefetchOnHover, isPrefetched, prefetchDelay, executePrefetch]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  // معالجة focus للـ accessibility
  const handleFocus = useCallback(() => {
    if (!isPrefetched) {
      executePrefetch();
    }
  }, [isPrefetched, executePrefetch]);

  // intersection observer للتحميل عند الظهور
  const setLinkRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      if (!prefetchOnVisible || !node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isPrefetched) {
              executePrefetch();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [prefetchOnVisible, isPrefetched, executePrefetch]
  );

  // النقر مع التحميل الفوري إذا لم يتم التحميل المسبق
  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isPrefetched && (prefetchFn || preloadData)) {
        e.preventDefault();
        await executePrefetch();
        navigate(to);
      }
    },
    [isPrefetched, prefetchFn, preloadData, executePrefetch, navigate, to]
  );

  return (
    <Link
      ref={(node) => {
        (linkRef as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
        setLinkRef(node);
      }}
      to={to}
      className={cn(className, isPrefetched && activeClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onClick={handleClick}
      data-prefetched={isPrefetched}
      {...props}
    >
      {children}
    </Link>
  );
});

PrefetchLink.displayName = 'PrefetchLink';

export default PrefetchLink;

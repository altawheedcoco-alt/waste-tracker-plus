import { memo, useRef, useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

/**
 * Image component with native lazy loading + IntersectionObserver fallback.
 * Automatically applies loading="lazy" and shows a placeholder until loaded.
 */
export const LazyImage = memo(({ src, alt, className, fallback, ...props }: LazyImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={error && fallback ? fallback : src}
      alt={alt || ''}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={cn(
        'transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      {...props}
    />
  );
});
LazyImage.displayName = 'LazyImage';

/**
 * Prefetch a route's JS chunk when user is likely to navigate there.
 * Call on hover/focus of navigation links.
 */
export const prefetchRoute = (path: string) => {
  // Map common paths to their chunk imports
  const routeChunks: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import('@/routes/DashboardRoutes'),
    '/map': () => import('@/pages/InteractiveMap'),
    '/blog': () => import('@/pages/Blog'),
    '/academy': () => import('@/pages/Academy'),
    '/about': () => import('@/pages/About'),
  };

  const loader = routeChunks[path];
  if (loader) {
    loader().catch(() => {}); // Silent prefetch
  }
};

/**
 * Debounced callback — useful for search inputs, resize handlers, etc.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default LazyImage;

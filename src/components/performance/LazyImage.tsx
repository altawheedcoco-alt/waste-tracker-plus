import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  fallbackSrc?: string;
  priority?: boolean;
  blur?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Image cache for instant re-renders
const imageCache = new Set<string>();

/**
 * مكون صورة محسّن مع تحميل كسول وتخزين مؤقت
 * يحسن الأداء عبر تحميل الصور عند الحاجة فقط
 */
const LazyImage = memo(({
  src,
  alt,
  className,
  placeholderClassName,
  fallbackSrc = '/placeholder.svg',
  priority = false,
  blur = true,
  onLoad,
  onError,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(() => imageCache.has(src));
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src || isLoaded) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageCache.add(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
  }, [isInView, src, isLoaded, onLoad, onError]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div className={cn('relative overflow-hidden', className)} ref={imgRef}>
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <Skeleton 
          className={cn(
            'absolute inset-0 w-full h-full',
            placeholderClassName
          )} 
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-all duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0',
            blur && !isLoaded && 'blur-sm scale-105',
            isLoaded && 'blur-0 scale-100'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;

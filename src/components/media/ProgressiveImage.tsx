/**
 * ProgressiveImage — مكون صورة ذكي بـ Blur Placeholder
 * يعرض صورة ضبابية صغيرة فوراً ثم يحمّل الصورة الكاملة (زي Facebook)
 */
import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** Blur placeholder (data URL صغير < 1KB) */
  blurSrc?: string;
  /** Lazy load (الافتراضي true) */
  lazy?: boolean;
  /** عرض وارتفاع النسبة */
  aspectRatio?: string;
  onClick?: () => void;
}

const ProgressiveImage = memo(({
  src,
  alt = '',
  className,
  blurSrc,
  lazy = true,
  aspectRatio,
  onClick,
}: ProgressiveImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || inView) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // يبدأ التحميل قبل ما يوصل بـ 200px
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, inView]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      onClick={onClick}
    >
      {/* Blur placeholder */}
      {blurSrc && !loaded && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Fallback color while no blur */}
      {!blurSrc && !loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Full image */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';
export default ProgressiveImage;

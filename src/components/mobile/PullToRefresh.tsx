/**
 * PullToRefresh — تأثير بصري عند السحب للأسفل للتحديث
 * يعمل فقط على الموبايل ويظهر مؤشر تحميل أنيق
 */
import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 80;

const PullToRefresh = memo(({ onRefresh, children }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const pullProgress = useTransform(pullY, [0, THRESHOLD], [0, 1]);
  const rotate = useTransform(pullY, [0, THRESHOLD], [0, 360]);
  const indicatorOpacity = useTransform(pullY, [0, 30, THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && delta <= THRESHOLD * 1.5) {
      pullY.set(delta);
    }
  }, [isRefreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY.get() >= THRESHOLD && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      pullY.set(THRESHOLD / 2);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    pullY.set(0);
  }, [onRefresh, isRefreshing, pullY]);

  useEffect(() => {
    const isMobile = 'ontouchstart' in window;
    if (!isMobile) return;

    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        style={{ opacity: indicatorOpacity, scale: indicatorScale }}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      >
        <div className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
          <motion.div style={{ rotate }}>
            <RefreshCw 
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
        </div>
      </motion.div>
      
      {children}
    </div>
  );
});

PullToRefresh.displayName = 'PullToRefresh';
export default PullToRefresh;

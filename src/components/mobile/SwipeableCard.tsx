/**
 * SwipeableCard - بطاقة قابلة للسحب مع إجراءات سريعة
 * تُستخدم في قوائم الشحنات والإشعارات على الموبايل
 */
import { memo, ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  className?: string;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;

const SwipeableCard = memo(({
  children,
  className,
  leftAction,
  rightAction,
  disabled = false,
}: SwipeableCardProps) => {
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only enable swipe on mobile
  if (!isMobile || disabled || (!leftAction && !rightAction)) {
    return <div className={className}>{children}</div>;
  }

  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setSwiping(false);
    if (info.offset.x < -SWIPE_THRESHOLD && leftAction) {
      leftAction.onClick();
    } else if (info.offset.x > SWIPE_THRESHOLD && rightAction) {
      rightAction.onClick();
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      {/* Left action background (swipe right-to-left) */}
      {leftAction && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={cn(
            'absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-r-xl',
            leftAction.color
          )}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            {leftAction.icon}
            <span className="text-[10px] font-medium">{leftAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* Right action background (swipe left-to-right) */}
      {rightAction && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={cn(
            'absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-l-xl',
            rightAction.color
          )}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            {rightAction.icon}
            <span className="text-[10px] font-medium">{rightAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: leftAction ? -120 : 0, right: rightAction ? 120 : 0 }}
        dragElastic={0.3}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative z-10 bg-card touch-pan-y',
          swiping && 'cursor-grabbing',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  );
});

SwipeableCard.displayName = 'SwipeableCard';
export default SwipeableCard;

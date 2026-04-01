import { useRef, useState, memo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeReply: () => void;
  isMine: boolean;
}

/**
 * سحب لليمين/اليسار للرد — مستوحاة من واتساب
 * في RTL: سحب لليسار (اتجاه سلبي) يعني الرد
 */
const SwipeableMessage = memo(({ children, onSwipeReply, isMine }: SwipeableMessageProps) => {
  const x = useMotionValue(0);
  const replyIconOpacity = useTransform(x, [-80, -40, 0, 40, 80], 
    isMine ? [1, 0.5, 0, 0, 0] : [0, 0, 0, 0.5, 1]
  );
  const replyIconScale = useTransform(x, [-80, -40, 0, 40, 80],
    isMine ? [1.2, 0.8, 0, 0, 0] : [0, 0, 0, 0.8, 1.2]
  );
  const [swiping, setSwiping] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setSwiping(false);
    const threshold = 60;
    if (isMine && info.offset.x < -threshold) {
      onSwipeReply();
    } else if (!isMine && info.offset.x > threshold) {
      onSwipeReply();
    }
  };

  return (
    <div className="relative overflow-visible">
      {/* Reply icon indicator */}
      <motion.div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center",
          isMine ? "right-full mr-2" : "left-full ml-2"
        )}
        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
      >
        <Reply className="w-4 h-4 text-primary" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: isMine ? -100 : 0, right: isMine ? 0 : 100 }}
        dragElastic={0.15}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
});

SwipeableMessage.displayName = 'SwipeableMessage';
export default SwipeableMessage;

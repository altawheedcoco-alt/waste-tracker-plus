import { startTransition, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePlatformCounts } from '@/hooks/usePlatformCounts';
import { cn } from '@/lib/utils';

const NotificationDropdown = () => {
  const { data: counts } = usePlatformCounts();
  // Combined: notifications + unread messages + pending signatures
  const totalUnread = (counts?.unreadNotifications ?? 0) + (counts?.unreadMessages ?? 0) + (counts?.pendingSignatures ?? 0);
  const navigate = useNavigate();
  const prevCount = useRef(totalUnread);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (totalUnread > prevCount.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = totalUnread;
  }, [totalUnread]);

  const handleClick = () => {
    startTransition(() => {
      navigate('/dashboard/notifications');
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative" 
      onClick={handleClick}
      aria-label={`الإشعارات${totalUnread > 0 ? ` (${totalUnread} غير مقروءة)` : ''}`}
    >
      <Bell className={cn(
        "w-5 h-5 transition-colors",
        totalUnread > 0 && "text-primary",
        isPulsing && "animate-[bell-shake_0.5s_ease-in-out]"
      )} />
      <AnimatePresence>
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isPulsing ? [1, 1.3, 1] : 1, 
              opacity: 1,
              boxShadow: isPulsing 
                ? ['0 0 0px rgba(239,68,68,0)', '0 0 10px rgba(239,68,68,0.7)', '0 0 0px rgba(239,68,68,0)']
                : '0 4px 6px -1px rgba(239,68,68,0.3)',
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={isPulsing 
              ? { duration: 0.3, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 500, damping: 25 }
            }
            className={cn(
              "absolute flex items-center justify-center font-bold text-primary-foreground bg-destructive rounded-full pointer-events-none",
              totalUnread > 99
                ? "-top-2 -right-3 h-6 min-w-[1.5rem] px-1 text-[10px]"
                : totalUnread > 9
                ? "-top-1.5 -right-2 h-5 min-w-[1.25rem] px-0.5 text-[10px]"
                : "-top-1 -right-1 h-5 w-5 text-xs"
            )}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPulsing && totalUnread > 0 && (
          <motion.span
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/40 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </Button>
  );
};

export default NotificationDropdown;

import { startTransition, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const NotificationDropdown = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const prevCount = useRef(unreadCount);
  const [isPulsing, setIsPulsing] = useState(false);

  // Pulse effect when unread count increases
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

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
      aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ''}`}
    >
      <Bell className={cn(
        "w-5 h-5 transition-colors",
        unreadCount > 0 && "text-primary",
        isPulsing && "animate-[bell-shake_0.5s_ease-in-out]"
      )} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isPulsing ? [1, 1.4, 1] : 1, 
              opacity: 1 
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={isPulsing 
              ? { duration: 0.4, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 500, damping: 25 }
            }
            className={cn(
              "absolute flex items-center justify-center font-bold text-primary-foreground bg-destructive rounded-full shadow-lg shadow-destructive/30 pointer-events-none",
              unreadCount > 99
                ? "-top-2 -right-3 h-6 min-w-[1.5rem] px-1 text-[10px]"
                : unreadCount > 9
                ? "-top-1.5 -right-2 h-5 min-w-[1.25rem] px-0.5 text-[10px]"
                : "-top-1 -right-1 h-5 w-5 text-xs"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pulse ring effect */}
      <AnimatePresence>
        {isPulsing && unreadCount > 0 && (
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

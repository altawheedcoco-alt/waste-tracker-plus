import { startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const NotificationDropdown = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

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
        unreadCount > 0 && "text-primary"
      )} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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
    </Button>
  );
};

export default NotificationDropdown;

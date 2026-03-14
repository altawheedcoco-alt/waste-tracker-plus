import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isCollapsed: boolean;
  badge?: number;
}

const SidebarNavItem = ({ icon: Icon, label, path, isCollapsed, badge }: SidebarNavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  const content = (
    <Link to={path} className="block group">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 touch-manipulation ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        }`}
      >
        {/* Active indicator bar */}
        {isActive && (
          <motion.div
            layoutId="sidebarActiveBar"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-primary"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}

        <div className="relative">
          <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : ''}`} />
          {badge != null && badge > 0 && isCollapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
            >
              {badge > 99 ? '99+' : badge}
            </motion.span>
          )}
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap text-[13px] flex-1 tracking-tight"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {badge != null && badge > 0 && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-primary/15 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium text-xs">
          <p>{label}</p>
          {badge != null && badge > 0 && (
            <span className="mr-2 text-destructive font-bold">({badge})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default SidebarNavItem;
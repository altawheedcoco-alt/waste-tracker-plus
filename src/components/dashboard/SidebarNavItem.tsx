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
  /** Optional live status dot color */
  statusColor?: string;
}

const SidebarNavItem = ({ icon: Icon, label, path, isCollapsed, badge, statusColor }: SidebarNavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  const content = (
    <Link to={path} className="block group">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation ${
          isActive
            ? 'bg-primary/12 text-primary font-semibold shadow-sm shadow-primary/5'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        }`}
      >
        {/* Active indicator bar with glow */}
        {isActive && (
          <motion.div
            layoutId="sidebarActiveBar"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-primary"
            style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.4)' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}

        <div className="relative">
          <Icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
            isActive ? 'text-primary scale-110' : 'group-hover:scale-105'
          }`} />
          {/* Live status dot */}
          {statusColor && (
            <span className={`absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full ${statusColor} ring-2 ring-sidebar-background`} />
          )}
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
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap text-[13px] flex-1 tracking-tight leading-tight"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {badge != null && badge > 0 && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
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
          <div className="flex items-center gap-2">
            <p>{label}</p>
            {badge != null && badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">{badge}</span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default SidebarNavItem;

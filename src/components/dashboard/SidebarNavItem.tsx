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
    <Link to={path} className="block">
      <motion.div
        whileHover={{ x: -4, scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-xl transition-all duration-200 touch-manipulation ${
          isActive
            ? 'text-primary-foreground shadow-md'
            : 'hover:bg-muted/60 text-foreground/70 hover:text-foreground active:bg-muted'
        }`}
      >
        <div className="relative">
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? '' : 'transition-transform group-hover:scale-110'}`} />
          {badge != null && badge > 0 && isCollapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -left-2 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-destructive/30"
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
              className="overflow-hidden whitespace-nowrap font-medium text-sm flex-1"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge as pill next to label when sidebar is expanded */}
        {badge != null && badge > 0 && !isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`min-w-[1.375rem] h-[1.375rem] px-1 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
              isActive
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}

        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-gradient-to-l from-primary to-primary/90 rounded-xl -z-10 shadow-lg"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
        )}
      </motion.div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
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

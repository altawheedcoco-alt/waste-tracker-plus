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
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-lg transition-all duration-200 touch-manipulation ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'hover:bg-muted/80 text-foreground/80 hover:text-foreground active:bg-muted'
        }`}
      >
        <div className="relative">
          <Icon className="w-5 h-5 shrink-0" />
          {badge && badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {badge > 9 ? '9+' : badge}
            </motion.span>
          )}
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap font-medium text-sm"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute inset-0 bg-primary rounded-lg -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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
          {badge && badge > 0 && (
            <span className="mr-2 text-destructive">({badge})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default SidebarNavItem;

import { useCallback } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BindingType } from '@/types/bindingTypes';
import BindingIndicator from '@/components/shared/BindingIndicator';

export interface SidebarMenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  key: string;
  badge?: number;
  bindingType?: BindingType;
  children?: SidebarMenuItem[];
}

interface SidebarNavGroupProps {
  item: SidebarMenuItem;
  isCollapsed: boolean;
}

const SidebarNavGroup = ({ item, isCollapsed }: SidebarNavGroupProps) => {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  
  const { getPref, setPref } = useUserPreferences();
  
  const isChildActive = hasChildren && item.children!.some(
    child => location.pathname === child.path || 
    child.children?.some(sub => location.pathname === sub.path)
  );
  const isActive = location.pathname === item.path;
  
  const prefKey = `sidebar_group_open_${item.key}`;
  const isOpen = getPref(prefKey, isChildActive || isActive);
  
  const toggleOpen = useCallback(() => {
    setPref(prefKey, !isOpen);
  }, [prefKey, isOpen, setPref]);

  const Icon = item.icon;

  // Simple leaf item (no children)
  if (!hasChildren) {
    const content = (
      <Link to={item.path} className="block group">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 touch-manipulation ${
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="sidebarActiveBar"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-primary"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <div className="relative">
            <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : ''}`} />
            {item.badge != null && item.badge > 0 && isCollapsed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {item.badge > 99 ? '99+' : item.badge}
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
               {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!isCollapsed && item.bindingType && (
            <BindingIndicator type={item.bindingType} dotOnly showTooltip />
          )}
          {item.badge != null && item.badge > 0 && !isCollapsed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {item.badge > 99 ? '99+' : item.badge}
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
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  }

  // Group item with children
  const triggerContent = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={toggleOpen}
      className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 touch-manipulation ${
        isChildActive
          ? 'bg-sidebar-accent/80 text-primary font-semibold'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
      }`}
    >
      <div className="relative">
        <Icon className={`w-[18px] h-[18px] shrink-0 ${isChildActive ? 'text-primary' : ''}`} />
        {item.badge != null && item.badge > 0 && isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </motion.span>
        )}
      </div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden whitespace-nowrap text-[13px] flex-1 text-right tracking-tight"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge != null && item.badge > 0 && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 bg-destructive/10 text-destructive"
        >
          {item.badge > 99 ? '99+' : item.badge}
        </motion.span>
      )}
      {!isCollapsed && (
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        </motion.div>
      )}
    </motion.button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium text-xs">
          <p>{item.label}</p>
          <div className="mt-1.5 space-y-0.5">
            {item.children!.map(child => (
              <Link
                key={child.key}
                to={child.path}
                className={`block text-xs py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                  location.pathname === child.path ? 'text-primary font-semibold' : ''
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      {triggerContent}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mr-3 border-r border-border/40 pr-2 mt-0.5 space-y-0.5"
          >
            {item.children!.map(child => (
              <SidebarNavGroup
                key={child.key}
                item={child}
                isCollapsed={isCollapsed}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarNavGroup;
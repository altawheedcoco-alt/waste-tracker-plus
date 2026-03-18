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

  // Calculate total children badge count
  const childrenBadgeTotal = hasChildren 
    ? item.children!.reduce((sum, c) => sum + (c.badge || 0), 0)
    : 0;
  const displayBadge = item.badge || childrenBadgeTotal;

  // Simple leaf item (no children)
  if (!hasChildren) {
    const content = (
      <Link to={item.path} className="block group">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 touch-manipulation ${
            isActive
              ? 'bg-primary/15 text-primary font-bold shadow-sm shadow-primary/10 border border-primary/20'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground font-semibold'
          }`}
        >
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
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap text-[13px] flex-1 tracking-tight leading-tight"
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
              className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
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
      whileTap={{ scale: 0.97 }}
      onClick={toggleOpen}
      className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation ${
        isChildActive
          ? 'bg-primary/8 text-primary font-semibold'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      }`}
    >
      <div className="relative">
        <Icon className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
          isChildActive ? 'text-primary' : ''
        }`} />
        {displayBadge > 0 && isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {displayBadge > 99 ? '99+' : displayBadge}
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
            className="overflow-hidden whitespace-nowrap text-[13px] flex-1 text-right tracking-tight leading-tight"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {displayBadge > 0 && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 bg-destructive/10 text-destructive"
        >
          {displayBadge > 99 ? '99+' : displayBadge}
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
        <TooltipContent side="left" className="font-medium text-xs max-w-[200px]">
          <p className="font-semibold mb-1.5">{item.label}</p>
          <div className="space-y-0.5">
            {item.children!.map(child => (
              <Link
                key={child.key}
                to={child.path}
                className={`block text-xs py-1 px-2 rounded-lg hover:bg-accent transition-colors ${
                  location.pathname === child.path ? 'text-primary font-semibold bg-primary/10' : ''
                }`}
              >
                <span className="flex items-center justify-between">
                  {child.label}
                  {child.badge != null && child.badge > 0 && (
                    <span className="text-[9px] px-1 rounded-full bg-destructive/10 text-destructive font-bold">{child.badge}</span>
                  )}
                </span>
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
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden mr-3 border-r-2 border-primary/15 pr-2 mt-0.5 space-y-0.5"
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

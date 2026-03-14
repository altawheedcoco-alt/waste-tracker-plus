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
  
  // Check if any child is active
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
      <Link to={item.path} className="block">
        <motion.div
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 touch-manipulation ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'hover:bg-muted/80 text-foreground/80 hover:text-foreground active:bg-muted'
          }`}
        >
          <div className="relative">
            <Icon className="w-5 h-5 shrink-0" />
            {item.badge != null && item.badge > 0 && isCollapsed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -left-2 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-destructive/30"
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
                className="overflow-hidden whitespace-nowrap font-medium text-sm flex-1"
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
              className={`min-w-[1.375rem] h-[1.375rem] px-1 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30'
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
          <TooltipContent side="left" className="font-medium">
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
      className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 touch-manipulation ${
        isChildActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'hover:bg-muted/80 text-foreground/80 hover:text-foreground'
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5 shrink-0" />
        {item.badge != null && item.badge > 0 && isCollapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-destructive/30"
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
            className="overflow-hidden whitespace-nowrap font-medium text-sm flex-1 text-right"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge != null && item.badge > 0 && !isCollapsed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="min-w-[1.375rem] h-[1.375rem] px-1 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30"
        >
          {item.badge > 99 ? '99+' : item.badge}
        </motion.span>
      )}
      {!isCollapsed && (
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 shrink-0" />
        </motion.div>
      )}
    </motion.button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          <p>{item.label}</p>
          <div className="mt-1 space-y-1">
            {item.children!.map(child => (
              <Link
                key={child.key}
                to={child.path}
                className={`block text-xs py-1 px-2 rounded hover:bg-accent ${
                  location.pathname === child.path ? 'text-primary font-bold' : ''
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
            className="overflow-hidden mr-4 border-r-2 border-border pr-2 mt-1 space-y-0.5"
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

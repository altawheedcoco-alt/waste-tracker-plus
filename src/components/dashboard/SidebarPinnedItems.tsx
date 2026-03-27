import { memo } from 'react';
import { Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarNavItem from './SidebarNavItem';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SidebarMenuItem } from './SidebarNavGroup';

interface SidebarPinnedItemsProps {
  pinnedItems: SidebarMenuItem[];
  isCollapsed: boolean;
}

const SidebarPinnedItems = memo(({ pinnedItems, isCollapsed }: SidebarPinnedItemsProps) => {
  const { language } = useLanguage();

  if (pinnedItems.length === 0) return null;

  return (
    <div className="pb-2 mb-1 border-b border-border/30">
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-2 pb-1.5">
          <Pin className="w-3 h-3 text-amber-500/80 shrink-0" />
          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">
            {language === 'ar' ? 'المثبّتات' : 'Pinned'}
          </span>
          <div className="flex-1 h-px bg-amber-500/15" />
        </div>
      )}
      <AnimatePresence>
        {pinnedItems.map(item => (
          <motion.div
            key={`pinned-${item.key}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <SidebarNavItem
              icon={item.icon}
              label={item.label}
              path={item.path}
              isCollapsed={isCollapsed}
              badge={item.badge}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

SidebarPinnedItems.displayName = 'SidebarPinnedItems';

export default SidebarPinnedItems;

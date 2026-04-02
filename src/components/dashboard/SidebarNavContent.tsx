import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  X as XIcon,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';
import SidebarNavGroup, { SidebarMenuItem } from './SidebarNavGroup';
import SidebarNavItem from './SidebarNavItem';
import SidebarSectionHeader from './SidebarSectionHeader';
import SidebarPinnedItems from './SidebarPinnedItems';
import BindingLegend from '@/components/shared/BindingLegend';
import ActionChainsButton from './ActionChainsButton';
import SidebarCustomizer from './SidebarCustomizer';
import QuickActionsCustomizer from './QuickActionsCustomizer';
import SidebarSoundControl from './SidebarSoundControl';
import DepositButton from '@/components/deposits/DepositButton';
import FocusMusicPlayer from './FocusMusicPlayer';
import PlatformLogo from '@/components/common/PlatformLogo';
import { AdminOrgSwitcherButton } from './AccountSwitcher';

interface SidebarNavContentProps {
  menuItems: SidebarMenuItem[];
  quickActionItems: SidebarMenuItem[];
  pinnedItems: SidebarMenuItem[];
  collapsedSections: Set<string>;
  sidebarSearch: string;
  isDriver: boolean;
  isAdmin: boolean;
  isMobile: boolean;
  isSidebarOpen: boolean;
  quickActionsType: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal' | 'consultant' | 'consulting_office';
  onSearchChange: (value: string) => void;
  onToggleSectionCollapse: (sectionId: string) => void;
  onSignOut: () => void;
  onCloseMobile?: () => void;
}

/** Shared navigation content used by both desktop and mobile sidebars */
const SidebarNavContent = memo(({
  menuItems,
  quickActionItems,
  pinnedItems,
  collapsedSections,
  sidebarSearch,
  isDriver,
  isAdmin,
  isMobile,
  isSidebarOpen,
  quickActionsType,
  onSearchChange,
  onToggleSectionCollapse,
  onSignOut,
  onCloseMobile,
}: SidebarNavContentProps) => {
  const { t } = useLanguage();

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!sidebarSearch.trim()) return menuItems;
    const searchLower = sidebarSearch.toLowerCase();
    const matchItem = (item: SidebarMenuItem) =>
      item.label.toLowerCase().includes(searchLower) ||
      (item.key && item.key.toLowerCase().includes(searchLower)) ||
      (item.path && item.path.toLowerCase().includes(searchLower));
    return menuItems.reduce<SidebarMenuItem[]>((acc, item) => {
      if (matchItem(item)) {
        acc.push(item);
      } else if (item.children) {
        const filteredChildren = item.children.filter(matchItem);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  }, [menuItems, sidebarSearch]);

  // Filter quick actions based on search
  const filteredQuickActions = useMemo(() => {
    if (!sidebarSearch.trim()) return quickActionItems;
    const searchLower = sidebarSearch.toLowerCase();
    return quickActionItems.filter((item) =>
      item.label.toLowerCase().includes(searchLower) ||
      item.path.toLowerCase().includes(searchLower)
    );
  }, [quickActionItems, sidebarSearch]);

  return (
    <>
      {/* Search Box */}
      <div className={`${isMobile ? 'px-4 pt-3' : 'px-3 py-2.5 border-b border-sidebar-border'} shrink-0`}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={sidebarSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('sidebar.searchPlaceholder')}
            className={`pr-9 pl-8 ${isMobile ? 'h-11 text-sm rounded-xl border-border/40' : 'h-8 text-[13px] rounded-lg border-sidebar-border'} bg-muted/40`}
          />
          {sidebarSearch && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 ${isMobile ? 'p-1.5 rounded-lg' : 'p-1 rounded'} hover:bg-muted touch-manipulation`}
            >
              <XIcon className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-muted-foreground`} />
            </button>
          )}
        </div>
        {/* Sidebar Customizer - desktop only */}
        {!isMobile && !isDriver && (
          <div className="flex items-center justify-between mt-2">
            <SidebarCustomizer
              trigger={
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary">
                  <Settings className="w-3.5 h-3.5" />
                  {t('dashboard.customizeMenu')}
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isMobile ? 'px-3 py-3 pb-safe' : 'p-2.5'} space-y-0.5 overflow-y-auto overscroll-contain`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Pinned Items */}
        {!sidebarSearch && !isMobile && (
          <SidebarPinnedItems pinnedItems={pinnedItems} isCollapsed={false} />
        )}

        {/* Menu Items */}
        {filteredMenuItems.length > 0 ? (
          (() => {
            let isSectionHidden = false;

            return filteredMenuItems.map((item: SidebarMenuItem) => {
              // Render section header
              if (item.key.startsWith('__section__')) {
                const sectionId = item.key.replace('__section__', '');
                isSectionHidden = collapsedSections.has(sectionId);
                return (
                  <SidebarSectionHeader
                    key={item.key}
                    label={item.label}
                    icon={item.icon}
                    isCollapsed={false}
                    isSectionFolded={isSectionHidden}
                    onToggleFold={() => onToggleSectionCollapse(sectionId)}
                  />
                );
              }
              // Skip groups in collapsed sections (but not when searching)
              if (isSectionHidden && !sidebarSearch) return null;
              return (
                <SidebarNavGroup
                  key={item.key}
                  item={item}
                  isCollapsed={false}
                />
              );
            });
          })()
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {t('commandPalette.noResults')}
          </div>
        )}

        {/* Binding Legend */}
        <BindingLegend isCollapsed={false} />

        {/* Admin org switcher */}
        {isAdmin && !isMobile && (
          <div className="pt-3 mt-3 border-t border-border/30 px-1">
            <AdminOrgSwitcherButton collapsed={false} />
          </div>
        )}

        {/* Action Chains */}
        <div className="pt-3 mt-3 border-t border-border/30">
          <ActionChainsButton isCollapsed={false} />
        </div>

        {/* Quick Actions */}
        {filteredQuickActions.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border">
            <div className="flex items-center gap-2 px-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                {t('sidebar.quickActionsTitle')}
              </span>
              <div className="flex-1 h-px bg-border/50" />
              {!isMobile && (
                <QuickActionsCustomizer
                  userType={quickActionsType}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  }
                />
              )}
            </div>
            <div className="space-y-1">
              {filteredQuickActions.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isCollapsed={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Deposit Button - desktop only */}
        {!isDriver && !isMobile && (
          <div className="pt-3 mt-3 border-t border-border">
            <DepositButton
              variant="outline"
              className="w-full justify-start gap-3 h-10"
            />
          </div>
        )}
      </nav>

      {/* Bottom: Sound Control + Logout */}
      <div className={`${isMobile ? 'px-4 py-3' : 'p-2.5'} border-t border-sidebar-border space-y-1 shrink-0`}>
        <SidebarSoundControl isCollapsed={false} />
        {isMobile && (
          <div className="flex items-center justify-center">
            <FocusMusicPlayer />
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            onCloseMobile?.();
            onSignOut();
          }}
          className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'h-12 rounded-xl' : 'h-9 rounded-lg text-[13px]'} text-destructive/80 hover:bg-destructive/8 hover:text-destructive transition-all duration-150`}
        >
          <LogOut className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <span className={`${isMobile ? 'text-sm font-semibold' : 'font-medium'} whitespace-nowrap`}>
            {t('nav.logout')}
          </span>
        </Button>
      </div>
    </>
  );
});

SidebarNavContent.displayName = 'SidebarNavContent';

export default SidebarNavContent;

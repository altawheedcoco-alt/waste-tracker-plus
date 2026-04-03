import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import SidebarRecentPages from './SidebarRecentPages';
import BindingLegend from '@/components/shared/BindingLegend';
import ActionChainsButton from './ActionChainsButton';
import SidebarCustomizer from './SidebarCustomizer';
import QuickActionsCustomizer from './QuickActionsCustomizer';
import SidebarSoundControl from './SidebarSoundControl';
import DepositButton from '@/components/deposits/DepositButton';
import FocusMusicPlayer from './FocusMusicPlayer';
import PlatformLogo from '@/components/common/PlatformLogo';
import SidebarLevelBadge from '@/components/gamification/SidebarLevelBadge';
import { AdminOrgSwitcherButton } from './AccountSwitcher';
import { useRecentPages } from '@/hooks/useRecentPages';

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

/** Flatten all navigable items for keyboard nav */
function flattenItems(items: SidebarMenuItem[]): SidebarMenuItem[] {
  const result: SidebarMenuItem[] = [];
  for (const item of items) {
    if (item.key.startsWith('__section__')) continue;
    if (item.children) {
      result.push(...item.children);
    } else if (item.path && item.path !== '#') {
      result.push(item);
    }
  }
  return result;
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
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { recentPages, clearRecent } = useRecentPages();

  // Reset selection when search changes
  useEffect(() => { setSelectedIndex(-1); }, [sidebarSearch]);

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

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    if (!sidebarSearch.trim()) return [];
    return flattenItems(filteredMenuItems);
  }, [filteredMenuItems, sidebarSearch]);

  // Keyboard navigation handler
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!sidebarSearch.trim() || flatResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatResults.length) {
      e.preventDefault();
      const target = flatResults[selectedIndex];
      if (target.path && target.path !== '#') {
        navigate(target.path);
        onSearchChange('');
        onCloseMobile?.();
      }
    } else if (e.key === 'Escape') {
      onSearchChange('');
      searchInputRef.current?.blur();
    }
  }, [sidebarSearch, flatResults, selectedIndex, navigate, onSearchChange, onCloseMobile]);

  // Filter quick actions based on search
  const filteredQuickActions = useMemo(() => {
    if (!sidebarSearch.trim()) return quickActionItems;
    const searchLower = sidebarSearch.toLowerCase();
    return quickActionItems.filter((item) =>
      item.label.toLowerCase().includes(searchLower) ||
      item.path.toLowerCase().includes(searchLower)
    );
  }, [quickActionItems, sidebarSearch]);

  // Count search results
  const searchResultCount = useMemo(() => {
    if (!sidebarSearch.trim()) return 0;
    return flatResults.length;
  }, [sidebarSearch, flatResults]);

  return (
    <>
      {/* Search Box */}
      <div className={`${isMobile ? 'px-4 pt-3' : 'px-3 py-2.5 border-b border-sidebar-border'} shrink-0`}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={sidebarSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
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
        {/* Search results count */}
        {sidebarSearch.trim() && (
          <div className="mt-1.5 px-1">
            <span className="text-[10px] text-muted-foreground">
              {searchResultCount > 0
                ? `${searchResultCount} ${t('common.results') || 'نتيجة'}`
                : t('commandPalette.noResults')}
            </span>
            {searchResultCount > 0 && (
              <span className="text-[10px] text-muted-foreground/50 mr-2">
                — ↑↓ Enter
              </span>
            )}
          </div>
        )}
        {/* Sidebar Customizer - desktop only */}
        {!isMobile && !isDriver && !sidebarSearch && (
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

        {/* Recent Pages — only when not searching */}
        {!sidebarSearch && !isMobile && (
          <SidebarRecentPages pages={recentPages} onClear={clearRecent} />
        )}

        {/* Menu Items */}
        {filteredMenuItems.length > 0 ? (
          (() => {
            let isSectionHidden = false;
            let flatIndex = -1;

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

              // Track keyboard selection for search results
              if (sidebarSearch.trim() && item.children) {
                // For groups in search, highlight selected child
                return (
                  <SidebarNavGroup
                    key={item.key}
                    item={item}
                    isCollapsed={false}
                  />
                );
              }

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

      {/* Gamification Level Badge */}
      <div className={`${isMobile ? 'px-4 py-2' : 'px-2.5 py-1.5'} border-t border-sidebar-border shrink-0`}>
        <SidebarLevelBadge />
      </div>

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

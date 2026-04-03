import { useState, useMemo, useEffect, memo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FocusMusicProvider } from '@/contexts/FocusMusicContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useRealtimeTable } from '@/hooks/useRealtimeSync';
import {
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { initNotificationAudio, ensureSoundsEnabled } from '@/hooks/useNotificationSound';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PlatformLogo from '@/components/common/PlatformLogo';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';
import KeyboardShortcutsGuide from '@/components/shared/KeyboardShortcutsGuide';
import DashboardBreadcrumb from './DashboardBreadcrumb';
import AccountSwitcher from './AccountSwitcher';
import VisualComfortToggle from './VisualComfortToggle';
import LiveEventToast from '@/components/notifications/LiveEventToast';
import OnboardingGuard from '@/components/dashboard/OnboardingGuard';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { SidebarMenuItem } from './SidebarNavGroup';
import { standaloneItems, isAdminSovereignView, getAdminViewingOrg, SIDEBAR_SECTIONS } from '@/config/sidebarConfig';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { lazy, Suspense } from 'react';
import { useDriverType } from '@/hooks/useDriverType';
import { getDriverMenuItems } from '@/hooks/useDriverMenu';
import { getSidebarItemsFromQuickActions, getQuickActionsByType } from '@/config/quickActions';
import { usePartnersCount } from '@/hooks/usePartnersCount';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import { useUserActivityPresence } from '@/hooks/useUserActivityPresence';
import { useServiceWorkerNavigation } from '@/hooks/useServiceWorkerNavigation';

// Extracted components
import DashboardHeader from './DashboardHeader';
import SidebarNavContent from './SidebarNavContent';

const EncryptedChatWidget = lazy(() => import('@/components/chat/EncryptedChatWidget'));
const UnifiedFloatingMenu = lazy(() => import('@/components/layout/UnifiedFloatingMenu'));
const NetworkStatusBanner = lazy(() => import('@/components/mobile/NetworkStatusBanner'));
const ProactiveAlertsBanner = lazy(() => import('@/components/alerts/ProactiveAlertsBanner'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
  // Global realtime sync — active on ALL dashboard pages
  useDashboardRealtime();
  // Smart presence — tracks online/away/offline for notification delivery
  useUserActivityPresence();
  // Listen for push notification clicks from service worker → navigate in SPA
  useServiceWorkerNavigation();
  
  const { fullWidth, spacing, density } = useViewMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { profile, organization, signOut, roles, user, loading } = useAuth();
  const { count: partnersCount } = usePartnersCount();
  const { unreadCount: notificationCount } = useNotifications();
  const sectionBadges = useNotificationCounts();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    shouldCollapseSidebar,
    getResponsiveClass 
  } = useDisplayMode();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Auto-collapse sidebar on mobile/tablet
  useEffect(() => {
    if (shouldCollapseSidebar) {
      setIsSidebarOpen(false);
    }
  }, [shouldCollapseSidebar]);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Unlock notification audio on first user gesture
  useEffect(() => {
    ensureSoundsEnabled();
    let didInit = false;
    const unlock = () => {
      if (didInit) return;
      didInit = true;
      void initNotificationAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Fetch organization documents count
  const { data: documentsCount = 0 } = useQuery({
    queryKey: ['organization-documents-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('organization_documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count || 0;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  useRealtimeTable('organization_documents', ['organization-documents-count'], {
    filter: organization?.id ? `organization_id=eq.${organization.id}` : undefined,
    enabled: !!organization?.id,
  });

  const isLegalDataComplete = useMemo(() => {
    if (!organization) return false;
    return !!(
      organization.commercial_register &&
      organization.environmental_license &&
      organization.representative_name &&
      organization.representative_national_id &&
      organization.representative_phone
    );
  }, [organization]);

  const isDocumentsComplete = documentsCount >= 3;

  const handleSignOut = async () => {
    await signOut();
    startTransition(() => navigate('/'));
  };

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');

  // Driver-specific menu items
  const { driverType } = useDriverType();
  const driverMenuItems: SidebarMenuItem[] = useMemo(() => {
    return getDriverMenuItems(driverType, language, {
      shipments: sectionBadges['driver-shipments'],
      notifications: notificationCount,
      offers: sectionBadges['driver-offers'],
      contracts: sectionBadges['driver-contracts'],
    }).map(item => ({
      icon: item.icon,
      label: item.label,
      path: item.path,
      key: item.key,
      badge: item.badge,
    }));
  }, [driverType, language, sectionBadges, notificationCount]);

  // Config-based sidebar groups
  const { orderedGroups: sidebarConfigGroups, effectivePrefs: sidebarPrefsData, toggleSectionCollapse, togglePinItem } = useSidebarPreferences();

  // Admin viewing state
  const adminViewingOrg = isAdmin ? getAdminViewingOrg() : null;

  // Convert config groups to menu items
  const configBasedMenuItems: SidebarMenuItem[] = useMemo(() => {
    const items: SidebarMenuItem[] = standaloneItems.map(item => ({
      icon: item.icon,
      label: language === 'ar' ? item.labelAr : item.labelEn,
      path: item.path,
      key: item.key,
      badge: item.badgeKey ? sectionBadges[item.badgeKey] : undefined,
    }));

    const renderedSections = new Set<string>();

    for (const group of sidebarConfigGroups) {
      const section = SIDEBAR_SECTIONS.find(s => s.groupIds.includes(group.id));
      if (section && !renderedSections.has(section.id)) {
        renderedSections.add(section.id);
        items.push({
          icon: section.icon,
          label: language === 'ar' ? section.labelAr : section.labelEn,
          path: `#section-${section.id}`,
          key: `__section__${section.id}`,
        });
      }

      const groupBadge = group.items.reduce((sum, item) => {
        return sum + (item.badgeKey ? (sectionBadges[item.badgeKey] || 0) : 0);
      }, 0);

      items.push({
        icon: group.icon,
        label: language === 'ar' ? group.labelAr : group.labelEn,
        path: '#',
        key: group.id,
        badge: groupBadge || undefined,
        children: group.items.map(item => ({
          icon: item.icon,
          label: language === 'ar' ? item.labelAr : item.labelEn,
          path: item.path,
          key: item.key,
          badge: item.badgeKey ? sectionBadges[item.badgeKey] : undefined,
          bindingType: item.bindingType,
        })),
      });
    }

    return items;
  }, [sidebarConfigGroups, language, sectionBadges]);

  // Pinned items
  const pinnedMenuItems: SidebarMenuItem[] = useMemo(() => {
    const pinnedPaths = sidebarPrefsData?.pinned_items || [];
    if (pinnedPaths.length === 0) return [];
    const allItems: SidebarMenuItem[] = [];
    for (const group of sidebarConfigGroups) {
      for (const item of group.items) {
        if (pinnedPaths.includes(item.path)) {
          allItems.push({
            icon: item.icon,
            label: language === 'ar' ? item.labelAr : item.labelEn,
            path: item.path,
            key: `pinned-${item.key}`,
            badge: item.badgeKey ? sectionBadges[item.badgeKey] : undefined,
          });
        }
      }
    }
    return allItems;
  }, [sidebarConfigGroups, sidebarPrefsData?.pinned_items, language, sectionBadges]);

  const collapsedSections = useMemo(() =>
    new Set(sidebarPrefsData?.collapsed_sections || []),
  [sidebarPrefsData?.collapsed_sections]);

  const menuItems = isDriver && !isAdmin ? driverMenuItems : configBasedMenuItems;

  // Quick actions type
  const quickActionsType = useMemo(() => {
    if (isAdmin) return 'admin' as const;
    if (isDriver && !organization) return 'driver' as const;
    switch (organization?.organization_type) {
      case 'transporter': return 'transporter' as const;
      case 'generator': return 'generator' as const;
      case 'recycler': return 'recycler' as const;
      case 'disposal': return 'disposal' as const;
      case 'consultant': return 'consultant' as const;
      case 'consulting_office': return 'consulting_office' as const;
      default: return 'generator' as const;
    }
  }, [isAdmin, isDriver, organization]);

  const { applyOrder, preferences: quickActionPrefs } = useQuickActionPreferences();

  const quickActionsSidebarItems = useMemo(() => {
    let actions = getQuickActionsByType(quickActionsType);
    if (quickActionPrefs) {
      actions = applyOrder(actions);
    }
    return getSidebarItemsFromQuickActions(actions);
  }, [quickActionsType, quickActionPrefs, applyOrder]);

  // Responsive values
  const SIDEBAR_WIDTH = isMobile ? 260 : isTablet ? 270 : 280;
  const sidebarWidth = isSidebarOpen ? SIDEBAR_WIDTH : 0;
  const mainPadding = fullWidth ? 'px-2 sm:px-3 py-2 sm:py-3' : getResponsiveClass({
    mobile: 'px-2 pt-2 pb-0',
    tablet: 'p-4',
    desktop: 'p-6',
  });

  // Auth guard early returns
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <FocusMusicProvider>
    <KeyboardShortcutProvider>
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden" dir="rtl">
        <KeyboardShortcutsGuide />
        <LiveEventToast />

        {/* Desktop Sidebar */}
        {!isMobile && isSidebarOpen && (
          <aside
            className="flex flex-col bg-sidebar-background border-l border-sidebar-border fixed right-0 top-0 h-screen z-50 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: SIDEBAR_WIDTH }}
          >
            {/* Logo + Close */}
            <div className="px-4 py-3.5 border-b border-sidebar-border">
              <div className="flex items-center justify-between gap-2">
                <Link to="/dashboard" className="flex items-center gap-3 flex-1">
                  <PlatformLogo size={isMobile ? 'sm' : 'md'} showText={false} showSubtitle />
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarOpen(false)}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    <p>{t('common.close')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Visual Comfort Toggle */}
            <div className="px-3 py-2 border-b border-sidebar-border">
              <VisualComfortToggle />
            </div>

            {/* Account Switcher */}
            <div className="border-b border-sidebar-border">
              <AccountSwitcher collapsed={false} />
            </div>

            {/* Return to Admin Banner */}
            {adminViewingOrg && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  sessionStorage.removeItem('admin_viewing_org');
                  navigate('/dashboard/system-overview');
                }}
                className="w-full flex items-center gap-3 p-2.5 mx-2.5 mt-2 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-right"
                style={{ width: 'calc(100% - 1.25rem)' }}
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-destructive/10 text-destructive shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs text-destructive">العودة لحساب المدير</p>
                  <p className="text-[10px] text-muted-foreground truncate">أنت تعرض: {organization?.name}</p>
                </div>
              </motion.button>
            )}

            {/* Shared Nav Content */}
            <SidebarNavContent
              menuItems={menuItems}
              quickActionItems={quickActionsSidebarItems}
              pinnedItems={pinnedMenuItems}
              collapsedSections={collapsedSections}
              sidebarSearch={sidebarSearch}
              isDriver={isDriver}
              isAdmin={isAdmin}
              isMobile={false}
              isSidebarOpen={isSidebarOpen}
              quickActionsType={quickActionsType}
              onSearchChange={setSidebarSearch}
              onToggleSectionCollapse={toggleSectionCollapse}
              onSignOut={handleSignOut}
            />
          </aside>
        )}

        {/* Floating Show Sidebar Button */}
        <AnimatePresence>
          {!isSidebarOpen && !isMobile && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.15 }}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-r-none rounded-l-lg h-20 w-8 flex flex-col items-center justify-center gap-0.5 shadow-lg bg-card/95 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 border-border transition-all duration-200 group"
                  >
                    <Menu className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  <p>{language === 'ar' ? 'فتح القائمة' : 'Open Menu'}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-hidden"
          style={{ 
            marginRight: !isMobile && isSidebarOpen ? `${sidebarWidth}px` : 0,
            width: !isMobile && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          }}
        >
          {/* Header */}
          <DashboardHeader
            isMobile={isMobile}
            isTablet={isTablet}
            isSidebarOpen={isSidebarOpen}
            isMobileMenuOpen={isMobileMenuOpen}
            isLegalDataComplete={isLegalDataComplete}
            isDocumentsComplete={isDocumentsComplete}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Mobile Slide-out Sidebar */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  onTouchEnd={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); }}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                  className="fixed top-0 right-0 z-50 h-full w-[82vw] max-w-[320px] bg-card shadow-2xl lg:hidden flex flex-col touch-manipulation"
                  style={{ willChange: 'transform' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 100 || info.velocity.x > 300) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                >
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 shrink-0">
                    <PlatformLogo size="sm" showText />
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-colors touch-manipulation"
                      aria-label="إغلاق القائمة"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Shared Nav Content (mobile mode) */}
                  <SidebarNavContent
                    menuItems={menuItems}
                    quickActionItems={quickActionsSidebarItems}
                    pinnedItems={pinnedMenuItems}
                    collapsedSections={collapsedSections}
                    sidebarSearch={sidebarSearch}
                    isDriver={isDriver}
                    isAdmin={isAdmin}
                    isMobile={true}
                    isSidebarOpen={true}
                    quickActionsType={quickActionsType}
                    onSearchChange={setSidebarSearch}
                    onToggleSectionCollapse={toggleSectionCollapse}
                    onSignOut={handleSignOut}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Network Status + Proactive Alerts */}
          <Suspense fallback={null}><NetworkStatusBanner /></Suspense>
          <Suspense fallback={null}><ProactiveAlertsBanner /></Suspense>

          {/* Page content */}
          <main className={`flex-1 ${mainPadding} overflow-x-hidden overflow-y-auto ${isMobile ? 'pb-[6rem]' : 'pb-6'} scroll-smooth min-h-0`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <DashboardBreadcrumb />
            <div className={`w-full ${fullWidth ? 'max-w-full' : 'max-w-[1600px] mx-auto'}`}>
              <OnboardingGuard>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              </OnboardingGuard>
            </div>
          </main>

          {/* Floating Action Button */}
          <Suspense fallback={null}><UnifiedFloatingMenu /></Suspense>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          {/* Encrypted Chat Widget */}
          <Suspense fallback={null}><EncryptedChatWidget /></Suspense>
        </div>
      </div>
    </TooltipProvider>
    </KeyboardShortcutProvider>
    </FocusMusicProvider>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;

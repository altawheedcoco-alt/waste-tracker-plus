import { useState, useMemo, useEffect, useCallback, memo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FocusMusicProvider } from '@/contexts/FocusMusicContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';
import LiveClock from './LiveClock';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  Recycle,
  ChevronDown,
  User,
  CheckSquare,
  UserPlus,
  MapPin,
  BarChart3,
  Plus,
  FileText,
  Handshake,
  BadgeCheck,
  Scale,
  FolderCheck,
  Search,
  X as XIcon,
  ClipboardList,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Send,
  MessageCircle,
  Newspaper,
  Rss,
  Video,
  Info,
  BookOpen,
  Banknote,
  Activity,
  Headphones,
  Bookmark,
  Link as LinkIcon,
  Zap,
  Fingerprint,
  Brain,
  Sparkles,
  Shield,
  CircleDot,
  Factory,
  WifiOff,
  FileCheck,
  Calculator,
  Wallet,
  ShoppingCart,
  Boxes,
  GitCompareArrows,
  FolderOpen,
  Inbox,
  TreePine,
  Store,
  GraduationCap,
  Award,
  Receipt,
  Leaf,
  TrendingUp,
  Lock,
  Database,
  Trophy,
  Globe,
  Bot,
  Gauge,
  Eye,
  Umbrella,
  PenTool,
  Network,
  FileSignature,
  ClipboardCheck,
  Printer,
  CreditCard,
  Monitor,
  Car,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import NotificationDropdown from './NotificationDropdown';
import VisualComfortToggle from './VisualComfortToggle';
import ThemeCustomizer from '@/components/settings/ThemeCustomizer';
import FocusMusicPlayer from './FocusMusicPlayer';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavGroup, { SidebarMenuItem } from './SidebarNavGroup';
import SidebarSectionHeader from './SidebarSectionHeader';
import SidebarPinnedItems from './SidebarPinnedItems';
import BindingLegend from '@/components/shared/BindingLegend';
import ActionChainsButton from './ActionChainsButton';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';
import KeyboardShortcutsGuide from '@/components/shared/KeyboardShortcutsGuide';

import DashboardBreadcrumb from './DashboardBreadcrumb';
import CommandPalette from './CommandPalette';
import CreateRequestButton from './CreateRequestButton';
import AccountSwitcher, { AdminOrgSwitcherButton } from './AccountSwitcher';
import { usePartnersCount } from '@/hooks/usePartnersCount';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { initNotificationAudio, ensureSoundsEnabled } from '@/hooks/useNotificationSound';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PlatformLogo from '@/components/common/PlatformLogo';
import DepositButton from '@/components/deposits/DepositButton';
import { getAvatarEmoji, getColorTheme } from '@/components/settings/ProfileCustomization';

import { getSidebarItemsFromQuickActions, getQuickActionsByType } from '@/config/quickActions';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import GlobalRefreshButton from './GlobalRefreshButton';
import MyShipmentsButton from './header/MyShipmentsButton';
import LiveEventToast from '@/components/notifications/LiveEventToast';
import QuickActionsCustomizer from '@/components/dashboard/QuickActionsCustomizer';
import SidebarCustomizer from '@/components/dashboard/SidebarCustomizer';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import OnboardingGuard from '@/components/dashboard/OnboardingGuard';
import { SidebarGroupConfig, SidebarItemConfig, standaloneItems, isAdminSovereignView, getAdminViewingOrg, SIDEBAR_SECTIONS } from '@/config/sidebarConfig';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { lazy, Suspense } from 'react';

import ViewModeToolbar from './ViewModeToolbar';
import SidebarSoundControl from './SidebarSoundControl';
import { useDriverType } from '@/hooks/useDriverType';
import { getDriverMenuItems } from '@/hooks/useDriverMenu';

const EncryptedChatWidget = lazy(() => import('@/components/chat/EncryptedChatWidget'));
const UnifiedFloatingMenu = lazy(() => import('@/components/layout/UnifiedFloatingMenu'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoized sidebar nav item for performance
const MemoizedSidebarNavItem = memo(SidebarNavItem);

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
  // Global realtime sync — active on ALL dashboard pages
  useDashboardRealtime();
  
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
  
  // Use display mode for responsive layout
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    shouldCollapseSidebar,
    getResponsiveClass 
  } = useDisplayMode();

  // Resolve storage URLs for avatar and logo (private bucket compatibility)
  const resolvedAvatarUrl = useResolvedUrl(profile?.avatar_url);
  const resolvedLogoUrl = useResolvedUrl(organization?.logo_url);

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

  // Unlock notification audio on first user gesture (required by browser autoplay policies)
  // Also ensure all sounds are enabled by default
  useEffect(() => {
    // Ensure sounds are enabled on first load
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
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Check if legal data is complete
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

  // Check if documents are complete (at least 3 required documents)
  const isDocumentsComplete = documentsCount >= 3;

  const handleSignOut = async () => {
    await signOut();
    startTransition(() => navigate('/'));
  };

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isDisposal = (organization?.organization_type as string) === 'disposal';
  const isConsultant = (organization?.organization_type as string) === 'consultant';
  const isConsultingOffice = (organization?.organization_type as string) === 'consulting_office';
  const isDriver = roles.includes('driver');

  const isStandaloneDriver = isDriver;

  const getOrganizationIcon = () => {
    if (isAdmin) return Settings;
    if (isStandaloneDriver) return Car;
    switch (organization?.organization_type as string) {
      case 'generator':
        return Building2;
      case 'transporter':
        return Truck;
      case 'recycler':
        return Recycle;
      case 'disposal':
        return Factory;
      case 'regulator':
        return Shield;
      case 'consultant':
        return User;
      case 'consulting_office':
        return Building2;
      default:
        return Building2;
    }
  };

  const getOrganizationLabel = () => {
    if (isAdmin) return t('dashboard.orgTypes.admin');
    if (isStandaloneDriver) return t('dashboard.orgTypes.driver');
    switch (organization?.organization_type as string) {
      case 'generator': return t('dashboard.orgTypes.generator');
      case 'transporter': return t('dashboard.orgTypes.transporter');
      case 'recycler': return t('dashboard.orgTypes.recycler');
      case 'disposal': return t('dashboard.orgTypes.disposal');
      case 'regulator': return t('dashboard.orgTypes.regulator');
      case 'consultant': return t('dashboard.orgTypes.consultant');
      case 'consulting_office': return t('dashboard.orgTypes.consultingOffice');
      default: return t('dashboard.orgTypes.entity');
    }
  };

  const getEntityTypeLabel = () => {
    if (isAdmin) return t('dashboard.orgTypes.admin');
    if (isStandaloneDriver) return t('dashboard.orgTypes.driver');
    switch (organization?.organization_type as string) {
      case 'generator': return t('dashboard.orgTypes.generator');
      case 'transporter': return t('dashboard.orgTypes.transporter');
      case 'recycler': return t('dashboard.orgTypes.recycler');
      case 'disposal': return t('dashboard.orgTypes.disposal');
      case 'regulator': return t('dashboard.orgTypes.regulator');
      case 'consultant': return t('dashboard.orgTypes.consultant');
      case 'consulting_office': return t('dashboard.orgTypes.consultingOffice');
      default: return t('dashboard.orgTypes.entity');
    }
  };

  const getEntityName = () => {
    if (isAdmin) return t('dashboard.orgTypes.systemAdmin');
    if (isStandaloneDriver) return profile?.full_name || t('dashboard.orgTypes.driver');
    return organization?.name || profile?.full_name || t('dashboard.orgTypes.user');
  };

  const OrgIcon = getOrganizationIcon();

  // Import Key icon for team credentials
  const KeyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );

  // Driver-specific menu items — differentiated by driver_type
  const { driverType } = useDriverType();
  const driverMenuFromType = useMemo(() => {
    return getDriverMenuItems(driverType, language, {
      shipments: sectionBadges['driver-shipments'],
      notifications: notificationCount,
      offers: sectionBadges['driver-offers'],
      contracts: sectionBadges['driver-contracts'],
    });
  }, [driverType, language, sectionBadges, notificationCount]);

  const driverMenuItems: SidebarMenuItem[] = driverMenuFromType.map(item => ({
    icon: item.icon,
    label: item.label,
    path: item.path,
    key: item.key,
    badge: item.badge,
  }));

  // Use config-based sidebar groups via preferences hook
  const { orderedGroups: sidebarConfigGroups, effectivePrefs: sidebarPrefsData, toggleSectionCollapse, togglePinItem } = useSidebarPreferences();

  // Admin viewing state
  const adminViewingOrg = isAdmin ? getAdminViewingOrg() : null;
  const isSovereignAdmin = isAdminSovereignView(isAdmin);

  // Convert config groups to SidebarMenuItem format for rendering
  const configBasedMenuItems: SidebarMenuItem[] = useMemo(() => {
    // Add standalone items first (Dashboard)
    const items: SidebarMenuItem[] = standaloneItems.map(item => ({
      icon: item.icon,
      label: language === 'ar' ? item.labelAr : item.labelEn,
      path: item.path,
      key: item.key,
      badge: item.badgeKey ? sectionBadges[item.badgeKey] : undefined,
    }));

    // Build a set of visible group IDs for section rendering
    const visibleGroupIds = new Set(sidebarConfigGroups.map(g => g.id));

    // Track which sections have been rendered
    const renderedSections = new Set<string>();

    // For each group, check if its section header should be inserted first
    for (const group of sidebarConfigGroups) {
      // Find the section this group belongs to
      const section = SIDEBAR_SECTIONS.find(s => s.groupIds.includes(group.id));
      
      // Insert section header if not yet rendered and section has visible groups
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

  // Build pinned items from preferences
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

  // Collapsed sections set
  const collapsedSections = useMemo(() => 
    new Set(sidebarPrefsData?.collapsed_sections || []),
  [sidebarPrefsData?.collapsed_sections]);

  // Use driver menu if user is a driver (not admin)
  const menuItems = isDriver && !isAdmin ? driverMenuItems : configBasedMenuItems;

  // Get quick actions based on user type
  const quickActionsType = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isDriver && !organization) return 'driver';
    switch (organization?.organization_type) {
      case 'transporter': return 'transporter';
      case 'generator': return 'generator';
      case 'recycler': return 'recycler';
      case 'disposal': return 'disposal';
      case 'consultant': return 'consultant';
      case 'consulting_office': return 'consulting_office';
      default: return 'generator';
    }
  }, [isAdmin, isDriver, organization]);


  // Use quick action preferences hook
  const { applyOrder, preferences: quickActionPrefs } = useQuickActionPreferences();

  const quickActionsSidebarItems = useMemo(() => {
    let actions = getQuickActionsByType(quickActionsType);
    // Apply user's custom order if available
    if (quickActionPrefs) {
      actions = applyOrder(actions);
    }
    return getSidebarItemsFromQuickActions(actions);
  }, [quickActionsType, quickActionPrefs, applyOrder]);

  // Filter menu items based on search (deep search into children - matches label, key, path)
  const filterMenuItems = (items: SidebarMenuItem[], search: string): SidebarMenuItem[] => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    const matchItem = (item: SidebarMenuItem) =>
      item.label.toLowerCase().includes(searchLower) ||
      (item.key && item.key.toLowerCase().includes(searchLower)) ||
      (item.path && item.path.toLowerCase().includes(searchLower));
    return items.reduce<SidebarMenuItem[]>((acc, item) => {
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
  };

  const filteredMenuItems = useMemo(() => {
    return filterMenuItems(menuItems, sidebarSearch);
  }, [menuItems, sidebarSearch]);

  // Filter quick actions based on search
  const filteredQuickActions = useMemo(() => {
    if (!sidebarSearch.trim()) return quickActionsSidebarItems;
    const searchLower = sidebarSearch.toLowerCase();
    return quickActionsSidebarItems.filter((item) => 
      item.label.toLowerCase().includes(searchLower) ||
      item.path.toLowerCase().includes(searchLower)
    );
  }, [quickActionsSidebarItems, sidebarSearch]);

  // Get responsive values
  const SIDEBAR_WIDTH = isMobile ? 260 : isTablet ? 270 : 280;
  const sidebarWidth = isSidebarOpen ? SIDEBAR_WIDTH : 0;
  const headerHeight = isMobile ? 'h-[48px]' : 'h-14';
  const mainPadding = fullWidth ? 'px-2 sm:px-3 py-2 sm:py-3' : getResponsiveClass({
    mobile: 'px-2 pt-2 pb-0',
    tablet: 'p-4',
    desktop: 'p-6',
  });

  // Auth guard early returns - after all hooks
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
              {/* Top: Logo + Close */}
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

           {/* Account Switcher / Organization info */}
          <div className="border-b border-sidebar-border">
            <AccountSwitcher collapsed={false} />
          </div>



          {/* Search Box */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2.5 border-b border-sidebar-border space-y-2"
              >
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder={t('sidebar.searchPlaceholder')}
                    className="pr-9 pl-8 h-8 text-[13px] bg-muted/40 border-sidebar-border rounded-lg"
                  />
                  {sidebarSearch && (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <XIcon className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Sidebar Customizer */}
                {!isDriver && (
                  <div className="flex items-center justify-between">
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
            {/* Pinned Items */}
            {!sidebarSearch && (
              <SidebarPinnedItems pinnedItems={pinnedMenuItems} isCollapsed={false} />
            )}

            {/* Return to Admin Banner (when viewing as org) */}
            {adminViewingOrg && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  sessionStorage.removeItem('admin_viewing_org');
                  navigate('/dashboard/system-overview');
                }}
                className="w-full flex items-center gap-3 p-2.5 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-right"
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

            {filteredMenuItems.length > 0 ? (
              (() => {
                let currentSectionId: string | null = null;
                let isSectionHidden = false;

                return filteredMenuItems.map((item: SidebarMenuItem) => {
                  // Render section header
                  if (item.key.startsWith('__section__')) {
                    const sectionId = item.key.replace('__section__', '');
                    currentSectionId = sectionId;
                    isSectionHidden = collapsedSections.has(sectionId);
                    return (
                      <SidebarSectionHeader
                        key={item.key}
                        label={item.label}
                        icon={item.icon}
                        isCollapsed={false}
                        isSectionFolded={isSectionHidden}
                        onToggleFold={() => toggleSectionCollapse(sectionId)}
                      />
                    );
                  }
                  // Skip groups in collapsed sections (but not when searching)
                  if (isSectionHidden && !sidebarSearch) {
                    return null;
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

            {/* Admin: dedicated org switcher button */}
            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-border/30 px-1">
                <AdminOrgSwitcherButton collapsed={false} />
              </div>
            )}

            {/* Action Chains Button */}
            <div className="pt-3 mt-3 border-t border-border/30">
              <ActionChainsButton isCollapsed={false} />
            </div>

            {/* Quick Actions Section */}
            {filteredQuickActions.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border">
                {/* Section Header with Customize Button */}
                <AnimatePresence>
            {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-2 mb-3"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">
                        {t('sidebar.quickActionsTitle')}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                      <QuickActionsCustomizer 
                        userType={quickActionsType}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Settings className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Quick Action Items */}
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
            
            {/* Deposit Button in Sidebar */}
            {!isDriver && (
              <div className="pt-3 mt-3 border-t border-border">
                <DepositButton 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-10"
                />
              </div>
            )}
          </nav>

          {/* Bottom Sound Control + Logout */}
          <div className="p-2.5 border-t border-sidebar-border space-y-1">
            <SidebarSoundControl isCollapsed={!isSidebarOpen} />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-9 text-destructive/80 hover:bg-destructive/8 hover:text-destructive transition-all duration-150 rounded-lg text-[13px]"
            >
              <LogOut className="w-4 h-4" />
              {isSidebarOpen && (
                <span className="font-medium whitespace-nowrap">
                  {t('nav.logout')}
                </span>
              )}
            </Button>
          </div>
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

        {/* Main content - Responsive width */}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-hidden"
          style={{ 
            marginRight: !isMobile && isSidebarOpen ? `${sidebarWidth}px` : 0,
            width: !isMobile && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          }}
        >
          {/* Top header — v4.0 clean, minimal */}
          <header className={`sticky top-0 z-40 ${headerHeight} bg-card border-b border-border flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6`}>
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop: show menu button when sidebar is hidden */}
              {!isMobile && !isSidebarOpen && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      aria-label="فتح القائمة"
                    >
                      <Menu size={18} className="text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>{language === 'ar' ? 'فتح القائمة الجانبية' : 'Open sidebar'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 hover:bg-muted rounded-xl transition-colors touch-manipulation active:bg-muted/80"
                  aria-label="فتح القائمة"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              {isMobile && (
                <PlatformLogo size="sm" showText />
              )}
            </div>

            {/* Command Palette - Show on all devices */}
            <div className={`${isMobile ? 'max-w-[40px]' : 'flex-1 max-w-md min-w-0'}`}>
              <CommandPalette />
            </div>

            {/* Right side - Responsive spacing */}
            <div className={`flex items-center shrink-0 ${isMobile ? 'gap-0.5' : isTablet ? 'gap-1.5' : 'gap-2'}`}>
              {/* View Mode Toolbar - Desktop only */}
              {!isMobile && !isTablet && <ViewModeToolbar />}
              {/* Live Clock - hidden on very small mobile */}
              {!isMobile && <LiveClock />}
              {/* Global Refresh Button - Hidden on mobile */}
              {!isMobile && <GlobalRefreshButton />}

              {/* Focus Music Player - Hidden on mobile, shown in sidebar */}
              {!isMobile && <FocusMusicPlayer />}

              {/* Theme Customizer - Hidden on mobile */}
              {!isMobile && <ThemeCustomizer />}

              {/* My Shipments */}
              <MyShipmentsButton />

              {/* Notifications Dropdown */}
              <NotificationDropdown />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 hover:bg-muted/80 px-2 sm:px-3">
                    {(profile as any)?.avatar_preset && (profile as any).avatar_preset !== 'default' ? (
                      <div 
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-lg ring-2 ring-primary/20"
                        style={{ 
                          background: `linear-gradient(135deg, ${getColorTheme((profile as any)?.profile_color_theme || 'teal-blue')[0]}40, ${getColorTheme((profile as any)?.profile_color_theme || 'teal-blue')[1]}40)` 
                        }}
                      >
                        {getAvatarEmoji((profile as any).avatar_preset)}
                      </div>
                    ) : (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/20">
                        <AvatarImage src={resolvedAvatarUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="hidden md:inline-block font-medium text-sm lg:text-base max-w-[120px] truncate">{profile?.full_name}</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 sm:w-72">
                  <div className="px-3 py-3 space-y-2">
                    <p className="text-xs text-muted-foreground">{getEntityTypeLabel()}</p>
                    <div className="flex items-center gap-2">
                      {(isStandaloneDriver ? resolvedAvatarUrl : resolvedLogoUrl) ? (
                        <img src={(isStandaloneDriver ? resolvedAvatarUrl : resolvedLogoUrl) || ''} alt={getEntityName()} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <OrgIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-semibold text-foreground">{getEntityName()}</p>
                      {!isStandaloneDriver && organization?.is_verified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('dashboard.verifiedAndApproved')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isStandaloneDriver
                        ? (driverType === 'company'
                            ? 'سائق تابع'
                            : driverType === 'hired'
                              ? 'سائق حر مؤجر'
                              : driverType === 'independent'
                                ? 'سائق مستقل'
                                : t('dashboard.orgTypes.driver'))
                        : profile?.full_name}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {isStandaloneDriver ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                          <Car className="w-3 h-3 text-primary" />
                          كيان مستقل
                        </span>
                      ) : (
                        <>
                          {organization?.is_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <BadgeCheck className="w-3 h-3" />
                              {t('dashboard.verifiedEntity')}
                            </span>
                          )}
                          {isLegalDataComplete && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                              <Scale className="w-3 h-3 text-primary" />
                              {t('dashboard.legalData')}
                            </span>
                          )}
                          {isDocumentsComplete && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                              <FolderCheck className="w-3 h-3 text-primary" />
                              {t('dashboard.docsComplete')}
                            </span>
                          )}
                          {!organization?.is_verified && !isLegalDataComplete && !isDocumentsComplete && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {t('dashboard.pleaseCompleteData')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => startTransition(() => navigate(isStandaloneDriver ? '/dashboard/driver-profile' : '/dashboard/organization-profile'))} className="cursor-pointer">
                    <OrgIcon className="ml-2 h-4 w-4" />
                    {isStandaloneDriver ? 'الملف التشغيلي للسائق' : t('sidebar.orgProfile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings?tab=profile'))} className="cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings'))} className="cursor-pointer">
                    <Settings className="ml-2 h-4 w-4" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  {!isStandaloneDriver && (
                    <>
                      <DropdownMenuSeparator />
                      <CreateRequestButton
                        buttonVariant="ghost"
                        buttonSize="sm"
                        className="w-full justify-start px-2 py-1.5 h-auto font-normal"
                      >
                        <div className="flex items-center w-full cursor-pointer text-primary">
                          <Send className="ml-2 h-4 w-4" />
                          {t('dashboard.sendRequestToAdmin')}
                        </div>
                      </CreateRequestButton>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="ml-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Mobile Slide-out Sidebar */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop overlay - tap to close */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  onTouchEnd={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); }}
                />
                {/* Slide-in panel from right (RTL) */}
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
                  {/* Header */}
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


                  {/* Search */}
                  <div className="px-4 pt-3 shrink-0">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder={t('sidebar.searchPlaceholder')}
                        className="pr-9 pl-8 h-11 text-sm bg-muted/40 rounded-xl border-border/40"
                      />
                      {sidebarSearch && (
                        <button
                          onClick={() => setSidebarSearch('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg touch-manipulation"
                        >
                          <XIcon className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nav items - scrollable */}
                  <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 pb-safe overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {filteredMenuItems.length > 0 ? (
                      filteredMenuItems.map((item: SidebarMenuItem) => (
                        <SidebarNavGroup
                          key={item.key}
                          item={item}
                          isCollapsed={false}
                        />
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {t('commandPalette.noResults')}
                      </div>
                    )}
                    
                    {/* Binding Legend */}
                    <BindingLegend isCollapsed={false} />

                    {/* Action Chains Button */}
                    <div className="pt-3 mt-3 border-t border-border/30">
                      <ActionChainsButton isCollapsed={false} />
                    </div>

                    {/* Quick Actions Section */}
                    {filteredQuickActions.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-border">
                        <div className="flex items-center gap-2 px-2 mb-3">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-wide">
                            {t('sidebar.quickActionsTitle')}
                          </span>
                          <div className="flex-1 h-px bg-border/50" />
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
                  </nav>

                  {/* Bottom - Sound Control, Music Player & Logout */}
                  <div className="px-4 py-3 border-t border-border/40 shrink-0 space-y-2">
                    <SidebarSoundControl isCollapsed={false} />
                    <div className="flex items-center justify-center">
                      <FocusMusicPlayer />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center justify-center gap-2 h-12 text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation rounded-xl"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-semibold">{t('nav.logout')}</span>
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Page content - Responsive padding with proper overflow handling and bottom spacing for bottom nav */}
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

          {/* Smart Floating Action Button */}
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

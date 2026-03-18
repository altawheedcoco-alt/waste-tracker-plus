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
import ThemeCustomizer from '@/components/settings/ThemeCustomizer';
import FocusMusicPlayer from './FocusMusicPlayer';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavGroup, { SidebarMenuItem } from './SidebarNavGroup';
import BindingLegend from '@/components/shared/BindingLegend';
import ActionChainsButton from './ActionChainsButton';

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
import FloatingActionsStack from '@/components/layout/FloatingActionsStack';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import GlobalRefreshButton from './GlobalRefreshButton';
import MyShipmentsButton from './header/MyShipmentsButton';
import LiveEventToast from '@/components/notifications/LiveEventToast';
import QuickActionsCustomizer from '@/components/dashboard/QuickActionsCustomizer';
import SidebarCustomizer from '@/components/dashboard/SidebarCustomizer';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import OnboardingGuard from '@/components/dashboard/OnboardingGuard';
import { SidebarGroupConfig, SidebarItemConfig, standaloneItems, isAdminSovereignView, getAdminViewingOrg } from '@/config/sidebarConfig';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { lazy, Suspense } from 'react';
import ViewModeToolbar from './ViewModeToolbar';
const EncryptedChatWidget = lazy(() => import('@/components/chat/EncryptedChatWidget'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoized sidebar nav item for performance
const MemoizedSidebarNavItem = memo(SidebarNavItem);

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
  // Global realtime sync — active on ALL dashboard pages
  useDashboardRealtime();
  
  const { sidebarMode, setSidebarMode, fullWidth, spacing, density } = useViewMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Derived sidebar state for backward compatibility
  const isSidebarOpen = sidebarMode !== 'hidden';
  const isMiniSidebar = sidebarMode === 'mini' && !sidebarHovered;
  const isExpandedSidebar = sidebarMode === 'full' || (sidebarMode === 'mini' && sidebarHovered);
  const setIsSidebarOpen = useCallback((open: boolean) => {
    setSidebarMode(open ? 'full' : 'hidden');
  }, [setSidebarMode]);
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
    } else {
      setIsSidebarOpen(true);
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

  const getOrganizationIcon = () => {
    if (isAdmin) {
      return Settings;
    }
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
    if (isDriver && !organization) return t('dashboard.orgTypes.driver');
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
    if (isDriver && !organization) return profile?.full_name || t('dashboard.orgTypes.driver');
    return organization?.name || profile?.full_name || t('dashboard.orgTypes.user');
  };

  const OrgIcon = getOrganizationIcon();

  // Import Key icon for team credentials
  const KeyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );

  // Driver-specific menu items - only essentials for fieldwork
  const driverMenuItems: SidebarMenuItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', key: 'driver-dashboard' },
    { icon: Package, label: t('sidebar.myShipments'), path: '/dashboard/transporter-shipments', badge: sectionBadges['driver-shipments'], key: 'driver-shipments' },
    { icon: MapPin, label: language === 'ar' ? 'موقعي' : 'My Location', path: '/dashboard/my-location', key: 'driver-location' },
    { icon: User, label: t('sidebar.driverProfile'), path: '/dashboard/driver-profile', key: 'driver-profile' },
    { icon: FileText, label: t('sidebar.driverData'), path: '/dashboard/driver-data', key: 'driver-data' },
    { icon: GraduationCap, label: language === 'ar' ? 'الأكاديمية' : 'Academy', path: '/dashboard/driver-academy', key: 'driver-academy' },
    { icon: Trophy, label: language === 'ar' ? 'المكافآت' : 'Rewards', path: '/dashboard/driver-rewards', key: 'driver-rewards' },
    { icon: Bell, label: t('nav.notifications'), path: '/dashboard/notifications', badge: notificationCount, key: 'driver-notifications' },
    { icon: Settings, label: t('nav.settings'), path: '/dashboard/settings', key: 'driver-settings' },
  ];

  // Use config-based sidebar groups via preferences hook
  const { orderedGroups: sidebarConfigGroups } = useSidebarPreferences();

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

    // Track where admin-only groups start (for visual separator when viewing as org)
    const ADMIN_GROUP_IDS = new Set([
      'admin-command-center', 'admin-entity-management', 'admin-users-fleet',
      'admin-finance', 'admin-content', 'admin-infrastructure',
    ]);
    let adminSectionStarted = false;

    // Add each group
    for (const group of sidebarConfigGroups) {
      const groupBadge = group.items.reduce((sum, item) => {
        return sum + (item.badgeKey ? (sectionBadges[item.badgeKey] || 0) : 0);
      }, 0);

      // Insert separator before admin groups when viewing as org
      if (adminViewingOrg && ADMIN_GROUP_IDS.has(group.id) && !adminSectionStarted) {
        adminSectionStarted = true;
        items.push({
          icon: Shield,
          label: language === 'ar' ? '─── أدوات المدير ───' : '─── Admin Tools ───',
          path: '#admin-separator',
          key: '__admin-separator__',
        });
      }

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
  }, [sidebarConfigGroups, language, sectionBadges, adminViewingOrg]);

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
  const sidebarWidth = isSidebarOpen ? (isMobile ? 260 : isTablet ? 270 : 280) : 80;
  const headerHeight = isMobile ? 'h-[52px]' : 'h-16';
  const mainPadding = getResponsiveClass({
    mobile: 'px-3 pt-3 pb-0',
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
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden" dir="rtl">
        <LiveEventToast />
        {/* Desktop Sidebar — v4.0 Modern Elegant */}
        {!isMobile && (
            <aside
              className={`flex flex-col bg-sidebar-background border-l border-sidebar-border fixed right-0 top-0 h-screen z-50 overflow-hidden transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+1px)] opacity-0 pointer-events-none'
              }`}
              style={{ width: sidebarWidth }}
            >
              {/* Top: Logo + Close */}
              <div className="px-4 py-3.5 border-b border-sidebar-border">
                <div className="flex items-center justify-between gap-2">
                  <Link to="/dashboard" className="flex items-center gap-3 flex-1">
                    <PlatformLogo size={isMobile ? 'sm' : 'md'} showText={false} showSubtitle={isSidebarOpen} />
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

          {/* Account Switcher / Organization info */}
          <div className="border-b border-sidebar-border">
            <AccountSwitcher collapsed={!isSidebarOpen} />
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
            {/* Return to Admin Banner (when viewing as org) */}
            {adminViewingOrg && isSidebarOpen && (
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
              filteredMenuItems.map((item: SidebarMenuItem) => {
                // Render admin separator
                if (item.key === '__admin-separator__') {
                  return isSidebarOpen ? (
                    <div key={item.key} className="flex items-center gap-2 pt-4 pb-2 px-2">
                      <div className="flex-1 h-px bg-primary/20" />
                      <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {language === 'ar' ? 'أدوات المدير' : 'Admin Tools'}
                      </span>
                      <div className="flex-1 h-px bg-primary/20" />
                    </div>
                  ) : null;
                }
                return (
                  <SidebarNavGroup
                    key={item.key}
                    item={item}
                    isCollapsed={!isSidebarOpen}
                  />
                );
              })
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t('commandPalette.noResults')}
              </div>
            )}
            
            {/* Binding Legend */}
            <BindingLegend isCollapsed={!isSidebarOpen} />

            {/* Admin: dedicated org switcher button */}
            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-border/30 px-1">
                <AdminOrgSwitcherButton collapsed={!isSidebarOpen} />
              </div>
            )}

            {/* Action Chains Button */}
            <div className="pt-3 mt-3 border-t border-border/30">
              <ActionChainsButton isCollapsed={!isSidebarOpen} />
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
                      isCollapsed={!isSidebarOpen}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Deposit Button in Sidebar */}
            {isSidebarOpen && !isDriver && (
              <div className="pt-3 mt-3 border-t border-border">
                <DepositButton 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-10"
                />
              </div>
            )}
          </nav>

          {/* Bottom Logout + Hide Button */}
          <div className="p-2.5 border-t border-sidebar-border space-y-1.5">
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
            <div className={`flex items-center shrink-0 ${isMobile ? 'gap-1' : isTablet ? 'gap-2' : 'gap-3'}`}>
              <LiveClock />
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
                      {resolvedLogoUrl ? (
                        <img src={resolvedLogoUrl} alt={getEntityName()} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-semibold text-foreground">{getEntityName()}</p>
                      {organization?.is_verified && (
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
                    <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
                    
                    {/* Verification Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {organization?.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          <BadgeCheck className="w-3 h-3" />
                          {t('dashboard.verifiedEntity')}
                        </span>
                      )}
                      {isLegalDataComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Scale className="w-3 h-3" />
                          {t('dashboard.legalData')}
                        </span>
                      )}
                      {isDocumentsComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FolderCheck className="w-3 h-3" />
                          {t('dashboard.docsComplete')}
                        </span>
                      )}
                      {!organization?.is_verified && !isLegalDataComplete && !isDocumentsComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {t('dashboard.pleaseCompleteData')}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/organization-profile'))} className="cursor-pointer">
                    <Building2 className="ml-2 h-4 w-4" />
                    {t('sidebar.orgProfile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings?tab=profile'))} className="cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => startTransition(() => navigate('/dashboard/settings'))} className="cursor-pointer">
                    <Settings className="ml-2 h-4 w-4" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
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

                  {/* Bottom - Music Player & Logout */}
                  <div className="px-4 py-3 border-t border-border/40 shrink-0 space-y-2">
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
          <main className={`flex-1 ${mainPadding} overflow-x-hidden overflow-y-auto ${isMobile ? 'pb-[5.5rem]' : 'pb-6'} scroll-smooth min-h-0`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <DashboardBreadcrumb />
            <div className="w-full max-w-full">
              <OnboardingGuard>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {children}
                  </motion.div>
              </OnboardingGuard>
            </div>
          </main>

          {/* Floating Actions: Permits + Quick Sign — positioned above bottom nav on mobile */}
          <FloatingActionsStack
            actions={[
              {
                id: 'quick-sign',
                icon: <PenTool size={isMobile ? 18 : 20} />,
                onClick: () => navigate('/dashboard/signing-inbox'),
                label: t('dashboard.quickSign'),
                variant: 'accent',
              },
              {
                id: 'permits',
                icon: <FileText size={isMobile ? 18 : 20} />,
                onClick: () => navigate('/dashboard/driver-permits'),
                label: t('dashboard.generalPermits'),
                variant: 'primary',
              },
            ]}
            position="bottom-left"
          />

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />

          {/* Encrypted Chat Widget */}
          <Suspense fallback={null}><EncryptedChatWidget /></Suspense>

        </div>
      </div>
    </TooltipProvider>
    </FocusMusicProvider>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;

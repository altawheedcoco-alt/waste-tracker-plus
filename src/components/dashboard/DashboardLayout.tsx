import { useState, useMemo, useEffect, useCallback, memo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
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
import DashboardBreadcrumb from './DashboardBreadcrumb';
import CommandPalette from './CommandPalette';
import CreateRequestButton from './CreateRequestButton';
import AccountSwitcher from './AccountSwitcher';
import { usePartnersCount } from '@/hooks/usePartnersCount';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { initNotificationAudio, ensureSoundsEnabled } from '@/hooks/useNotificationSound';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import DepositButton from '@/components/deposits/DepositButton';
import { getAvatarEmoji, getColorTheme } from '@/components/settings/ProfileCustomization';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { getSidebarItemsFromQuickActions, getQuickActionsByType } from '@/config/quickActions';
import FloatingActionsStack from '@/components/layout/FloatingActionsStack';
import GlobalRefreshButton from './GlobalRefreshButton';
import LiveEventToast from '@/components/notifications/LiveEventToast';
import QuickActionsCustomizer from '@/components/dashboard/QuickActionsCustomizer';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import OnboardingGuard from '@/components/dashboard/OnboardingGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoized sidebar nav item for performance
const MemoizedSidebarNavItem = memo(SidebarNavItem);

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const { profile, organization, signOut, roles } = useAuth();
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

  // Auto-collapse sidebar on mobile/tablet
  useEffect(() => {
    if (shouldCollapseSidebar) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [shouldCollapseSidebar]);

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
      default:
        return Building2;
    }
  };

  const getOrganizationLabel = () => {
    if (isAdmin) {
      return 'جهة الإدارة والمراقبة';
    }
    switch (organization?.organization_type as string) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
      case 'disposal':
        return 'جهة التخلص النهائي';
      default:
        return 'جهة';
    }
  };

  const getEntityTypeLabel = () => {
    if (isAdmin) {
      return 'جهة الإدارة والمراقبة';
    }
    if (isDriver && !organization) {
      return 'سائق';
    }
    switch (organization?.organization_type as string) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
      case 'disposal':
        return 'جهة التخلص النهائي';
      default:
        return 'الجهة';
    }
  };

  const getEntityName = () => {
    if (isAdmin) {
      return 'مدير النظام';
    }
    if (isDriver && !organization) {
      return profile?.full_name || 'سائق';
    }
    return organization?.name || profile?.full_name || 'المستخدم';
  };

  const OrgIcon = getOrganizationIcon();

  // Import Key icon for team credentials
  const KeyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );

  // Driver-specific menu items (simplified) - with unique keys
  const driverMenuItems: SidebarMenuItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', key: 'driver-dashboard' },
    { icon: User, label: t('sidebar.driverProfile'), path: '/dashboard/driver-profile', key: 'driver-profile' },
    { icon: Truck, label: t('sidebar.driverData'), path: '/dashboard/driver-data', key: 'driver-data' },
    { icon: Package, label: t('sidebar.myShipments'), path: '/dashboard/transporter-shipments', badge: sectionBadges['driver-shipments'], key: 'driver-shipments' },
    { icon: MapPin, label: t('sidebar.locationMaps'), path: '#', key: 'driver-location-group', children: [
      { icon: MapPin, label: t('sidebar.myLocation'), path: '/dashboard/my-location', key: 'driver-location' },
      { icon: Bookmark, label: t('sidebar.savedLocations'), path: '/dashboard/saved-locations', key: 'driver-saved-locations' },
      { icon: Search, label: t('sidebar.map'), path: '/dashboard/map-explorer', key: 'driver-map-explorer' },
    ]},
    { icon: Send, label: t('sidebar.requestsComm'), path: '#', key: 'driver-requests-comm-group', children: [
      { icon: Send, label: t('sidebar.myRequests'), path: '/dashboard/my-requests', badge: sectionBadges['my-requests'], key: 'driver-requests' },
      { icon: MessageCircle, label: t('sidebar.chatMessages'), path: '/dashboard/chat', badge: sectionBadges['chat'], key: 'driver-chat' },
      { icon: CircleDot, label: t('sidebar.statuses'), path: '/dashboard/stories', key: 'driver-stories' },
    ]},
    { icon: Settings, label: t('sidebar.systemSupport'), path: '#', key: 'driver-system-group', badge: notificationCount, children: [
      { icon: Headphones, label: t('sidebar.techSupport'), path: '/dashboard/support', key: 'driver-support' },
      { icon: Bell, label: t('nav.notifications'), path: '/dashboard/notifications', badge: notificationCount, key: 'driver-notifications' },
      { icon: Info, label: t('sidebar.aboutPlatform'), path: '/dashboard/about-platform', key: 'driver-about' },
      { icon: Settings, label: t('nav.settings'), path: '/dashboard/settings', key: 'driver-settings' },
    ]},
  ];

  // Full menu items for organizations and admins - with unique keys (GROUPED)
  const fullMenuItems: SidebarMenuItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', key: 'dashboard' },
    { icon: Building2, label: t('sidebar.orgGroup'), path: '#', key: 'org-group', badge: sectionBadges['org-group'], children: [
      { icon: Building2, label: t('sidebar.orgProfile'), path: '/dashboard/organization-profile', key: 'org-profile' },
      { icon: Newspaper, label: t('sidebar.posts'), path: '/dashboard/organization-profile?tab=posts', key: 'posts' },
      { icon: Rss, label: t('sidebar.partnersTimeline'), path: '/dashboard/partners-timeline', badge: sectionBadges['partners-timeline'], key: 'partners-timeline' },
      { icon: Handshake, label: t('sidebar.partners'), path: '/dashboard/partners', badge: (partnersCount || 0) + (sectionBadges['partners'] || 0), key: 'partners' },
      { icon: Users, label: t('sidebar.teamData'), path: '/dashboard/team-credentials', key: 'other-team' },
    ]},
    // Shipments & Certificates group - varies by org type
    ...((organization?.organization_type as string) === 'transporter'
      ? [{
          icon: Package, label: t('sidebar.shipmentsOps'), path: '#', key: 'transporter-ops-group', badge: sectionBadges['transporter-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/transporter-shipments', badge: sectionBadges['transporter-shipments'], key: 'transporter-shipments' },
            { icon: FileText, label: t('sidebar.receiptCerts'), path: '/dashboard/transporter-receipts', key: 'transporter-receipts' },
            { icon: FileCheck, label: t('sidebar.deliveryDeclarations'), path: '/dashboard/delivery-declarations', key: 'transporter-declarations' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['transporter-certs'], key: 'transporter-certs' },
            { icon: Fingerprint, label: t('sidebar.guilloche'), path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche' },
          ]
        } as SidebarMenuItem,
        {
          icon: Users, label: t('sidebar.driversGroup'), path: '#', key: 'transporter-drivers-group', children: [
            { icon: Users, label: t('sidebar.driversGroup'), path: '/dashboard/transporter-drivers', key: 'transporter-drivers' },
            { icon: MapPin, label: t('sidebar.driverTracking'), path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking' },
          ]
        } as SidebarMenuItem]
      : (organization?.organization_type as string) === 'recycler'
      ? [{
          icon: Package, label: t('sidebar.shipmentsCerts'), path: '#', key: 'recycler-ops-group', badge: sectionBadges['recycler-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/shipments', badge: sectionBadges['recycler-shipments'], key: 'recycler-shipments' },
            { icon: FileCheck, label: t('sidebar.deliveryDeclarations'), path: '/dashboard/delivery-declarations', key: 'recycler-declarations' },
            { icon: FolderCheck, label: t('sidebar.issueRecyclingCerts'), path: '/dashboard/issue-recycling-certificates', badge: sectionBadges['issue-certs'], key: 'issue-certs' },
          ]
        } as SidebarMenuItem]
      : (organization?.organization_type as string) === 'disposal'
      ? [{
          icon: Factory, label: t('sidebar.disposalOps'), path: '#', key: 'disposal-ops-group', badge: sectionBadges['disposal-ops-group'], children: [
            { icon: Factory, label: t('sidebar.disposalOps'), path: '/dashboard/disposal/operations', key: 'disposal-operations' },
            { icon: Package, label: t('sidebar.incomingRequests'), path: '/dashboard/disposal/incoming-requests', key: 'disposal-incoming' },
            { icon: FolderCheck, label: t('sidebar.disposalCerts'), path: '/dashboard/disposal/certificates', key: 'disposal-certs' },
            { icon: BarChart3, label: t('sidebar.disposalReports'), path: '/dashboard/disposal/reports', key: 'disposal-reports' },
          ]
        } as SidebarMenuItem]
      : [{
          icon: Package, label: t('sidebar.shipmentsCerts'), path: '#', key: 'generator-ops-group', badge: sectionBadges['generator-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/shipments', badge: sectionBadges['generator-shipments'], key: 'generator-shipments' },
            { icon: FileText, label: t('sidebar.receiptCerts'), path: '/dashboard/generator-receipts', key: 'generator-receipts' },
            { icon: FileCheck, label: t('sidebar.deliveryDeclarations'), path: '/dashboard/delivery-declarations', key: 'generator-declarations' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['generator-certs'], key: 'generator-certs' },
          ]
        } as SidebarMenuItem]),
    // Admin-specific
    ...(isAdmin
      ? [{
          icon: Shield, label: t('sidebar.adminGroup'), path: '#', key: 'admin-group', badge: sectionBadges['admin-group'], children: [
            { icon: Brain, label: t('sidebar.smartEye'), path: '/dashboard/smart-insights', key: 'smart-insights' },
            { icon: Shield, label: t('sidebar.smartOnboarding'), path: '/dashboard/onboarding-review', key: 'onboarding-review' },
            { icon: Activity, label: t('sidebar.systemStatus'), path: '/dashboard/system-status', key: 'system-status' },
            { icon: CheckSquare, label: t('sidebar.companyApprovals'), path: '/dashboard/company-approvals', badge: sectionBadges['company-approvals'], key: 'company-approvals' },
            { icon: UserPlus, label: t('sidebar.driverApprovals'), path: '/dashboard/driver-approvals', badge: sectionBadges['driver-approvals'], key: 'driver-approvals' },
            { icon: FileText, label: t('sidebar.orgDocuments'), path: '/dashboard/organization-documents', badge: sectionBadges['org-docs'], key: 'org-docs' },
            { icon: MapPin, label: t('sidebar.driverTracking'), path: '/dashboard/driver-tracking', key: 'admin-driver-tracking' },
            { icon: Truck, label: t('sidebar.driversMap'), path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['admin-certs'], key: 'admin-certs' },
            { icon: Video, label: t('sidebar.videoGen'), path: '/dashboard/video-generator', key: 'video-gen' },
            { icon: TreePine, label: t('sidebar.woodMarket'), path: '/dashboard/wood-market', key: 'wood-market' },
          ]
        } as SidebarMenuItem]
      : []),
    // Reports group
    { icon: BarChart3, label: t('sidebar.reportsGroup'), path: '#', key: 'reports-group', badge: sectionBadges['reports-group'], children: [
      { icon: BarChart3, label: t('sidebar.reportsGroup'), path: '/dashboard/reports', key: 'reports' },
      { icon: FileText, label: t('sidebar.shipmentReports'), path: '/dashboard/shipment-reports', key: 'shipment-reports' },
      { icon: ClipboardList, label: t('sidebar.aggregateReport'), path: '/dashboard/aggregate-report', key: 'aggregate-report' },
      { icon: BookOpen, label: t('sidebar.reportsGuide'), path: '/dashboard/reports-guide', key: 'reports-guide' },
    ]},
    // Document Archive
    { icon: FolderOpen, label: t('sidebar.docArchive'), path: '#', key: 'doc-archive-group', children: [
      { icon: FolderOpen, label: t('sidebar.allDocs'), path: '/dashboard/document-archive', key: 'doc-archive-all' },
      { icon: Inbox, label: t('sidebar.receivedDocs'), path: '/dashboard/document-archive?tab=received', key: 'doc-archive-received' },
      { icon: Send, label: t('sidebar.sentDocs'), path: '/dashboard/document-archive?tab=sent', key: 'doc-archive-sent' },
      { icon: FileText, label: t('sidebar.issuedDocs'), path: '/dashboard/document-archive?tab=issued', key: 'doc-archive-issued' },
    ]},
    // Waste registers group
    { icon: FileSpreadsheet, label: t('sidebar.wasteRegisters'), path: '#', key: 'waste-group', children: [
      { icon: FileSpreadsheet, label: t('sidebar.nonHazardous'), path: '/dashboard/non-hazardous-register', key: 'non-hazardous' },
      { icon: AlertTriangle, label: t('sidebar.hazardous'), path: '/dashboard/hazardous-register', key: 'hazardous' },
      { icon: Layers, label: t('sidebar.wasteClassification'), path: '/dashboard/waste-types', key: 'waste-types' },
    ]},
    // Waste Exchange - only for transporter, recycler, admin
    ...((organization?.organization_type === 'transporter' || organization?.organization_type === 'recycler' || isAdmin)
      ? [{ icon: Store, label: language === 'ar' ? 'بورصة المخلفات' : 'Waste Exchange', path: '/dashboard/waste-exchange', key: 'waste-exchange' } as SidebarMenuItem]
      : []),
    // Location group
    { icon: MapPin, label: t('sidebar.locationMaps'), path: '#', key: 'location-group', children: [
      { icon: Search, label: t('sidebar.map'), path: '/dashboard/map-explorer', key: 'map-explorer' },
      { icon: Bookmark, label: t('sidebar.savedLocations'), path: '/dashboard/saved-locations', key: 'saved-locations' },
    ]},
    // Quick links group
    { icon: Zap, label: t('sidebar.quickLinks'), path: '#', key: 'quick-links-group', children: [
      { icon: LinkIcon, label: t('sidebar.quickDepositLinks'), path: '/dashboard/quick-deposit-links', key: 'quick-deposit-links' },
      { icon: Zap, label: t('sidebar.quickShipmentLinks'), path: '/dashboard/quick-shipment-links', key: 'quick-shipment-links' },
      { icon: Truck, label: t('sidebar.quickDriverLinks'), path: '/dashboard/quick-driver-links', key: 'quick-driver-links' },
    ]},
    // Communication
    { icon: MessageCircle, label: t('sidebar.communication'), path: '#', key: 'comm-group', badge: sectionBadges['comm-group'], children: [
      { icon: MessageCircle, label: t('sidebar.chatMessages'), path: '/dashboard/chat', badge: sectionBadges['chat'], key: 'chat' },
      { icon: CircleDot, label: t('sidebar.statuses'), path: '/dashboard/stories', key: 'stories' },
    ]},
    // Requests & Regulatory group
    { icon: Send, label: t('sidebar.requestsReg'), path: '#', key: 'requests-reg-group', badge: sectionBadges['requests-reg-group'], children: [
      { icon: Send, label: t('sidebar.myRequests'), path: '/dashboard/my-requests', badge: sectionBadges['my-requests'], key: 'my-requests' },
      { icon: Scale, label: t('sidebar.regulatoryLog'), path: '/dashboard/regulatory-updates', key: 'regulatory' },
      { icon: ClipboardList, label: t('sidebar.operationalPlans'), path: '/dashboard/operational-plans', key: 'operational-plans' },
      { icon: Users, label: t('sidebar.partnerAccounts'), path: '/dashboard/partner-accounts', badge: sectionBadges['partner-accounts'], key: 'partner-accounts' },
    ]},
    // ERP System group
    { icon: Boxes, label: t('sidebar.erpSystem'), path: '#', key: 'erp-group', children: [
      { icon: Calculator, label: t('sidebar.accounting'), path: '/dashboard/erp/accounting', key: 'erp-accounting' },
      { icon: Package, label: t('sidebar.inventory'), path: '/dashboard/erp/inventory', key: 'erp-inventory' },
      { icon: Users, label: t('sidebar.hr'), path: '/dashboard/erp/hr', key: 'erp-hr' },
      { icon: ShoppingCart, label: t('sidebar.purchasingSales'), path: '/dashboard/erp/purchasing-sales', key: 'erp-purchasing-sales' },
      { icon: BarChart3, label: t('sidebar.financialReports'), path: '/dashboard/erp/financial-dashboard', key: 'erp-financial-dashboard' },
      { icon: Activity, label: t('sidebar.revenueExpenses'), path: '/dashboard/erp/revenue-expenses', key: 'erp-revenue-expenses' },
      { icon: Banknote, label: t('sidebar.cogs'), path: '/dashboard/erp/cogs', key: 'erp-cogs' },
      { icon: GitCompareArrows, label: t('sidebar.financialComparisons'), path: '/dashboard/erp/financial-comparisons', key: 'erp-comparisons' },
    ]},
    // System & Support group
    { icon: Settings, label: t('sidebar.systemSupport'), path: '#', key: 'system-support-group', badge: notificationCount, children: [
      { icon: Headphones, label: t('sidebar.techSupport'), path: '/dashboard/support', key: 'support' },
      { icon: Bell, label: t('nav.notifications'), path: '/dashboard/notifications', badge: notificationCount, key: 'notifications' },
      { icon: Activity, label: t('sidebar.yourSystemStatus'), path: '/dashboard/system-status', key: 'all-system-status' },
      { icon: WifiOff, label: t('sidebar.offlineMode'), path: '/dashboard/offline-mode', key: 'offline-mode' },
      { icon: Info, label: t('sidebar.aboutPlatform'), path: '/dashboard/about-platform', key: 'about-platform' },
      { icon: Settings, label: t('nav.settings'), path: '/dashboard/settings', key: 'settings' },
    ]},
  ];

  // Use driver menu if user is a driver (not admin)
  const menuItems = isDriver && !isAdmin ? driverMenuItems : fullMenuItems;

  // Get quick actions based on user type
  const quickActionsType = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isDriver && !organization) return 'driver';
    switch (organization?.organization_type) {
      case 'transporter': return 'transporter';
      case 'generator': return 'generator';
      case 'recycler': return 'recycler';
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

  // Filter menu items based on search (deep search into children)
  const filterMenuItems = (items: SidebarMenuItem[], search: string): SidebarMenuItem[] => {
    if (!search.trim()) return items;
    const searchLower = search.toLowerCase();
    return items.reduce<SidebarMenuItem[]>((acc, item) => {
      if (item.label.toLowerCase().includes(searchLower)) {
        acc.push(item);
      } else if (item.children) {
        const filteredChildren = item.children.filter(
          child => child.label.toLowerCase().includes(searchLower)
        );
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
  const headerHeight = isMobile ? 'h-14' : 'h-16';
  const mainPadding = getResponsiveClass({
    mobile: 'p-3',
    tablet: 'p-4',
    desktop: 'p-6',
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-row-reverse" dir="rtl">
        <LiveEventToast />
        {/* Desktop Sidebar - Hidden on mobile when using display mode */}
        <AnimatePresence>
          {(isSidebarOpen || !isMobile) && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ 
                x: isSidebarOpen ? 0 : 300, 
                opacity: isSidebarOpen ? 1 : 0,
                width: isSidebarOpen ? sidebarWidth : 0
              }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`${isMobile ? 'hidden' : 'flex'} flex-col bg-card border-l border-border shadow-sm fixed right-0 top-0 h-screen z-50 overflow-hidden`}
            >
              {/* Top Toggle Button + Logo */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <Link to="/dashboard" className="flex items-center gap-3 flex-1">
                    <motion.img 
                      src={logo} 
                      alt="آي ريسايكل" 
                      className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} object-contain`}
                      whileHover={{ rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="overflow-hidden flex flex-col"
                        >
                          <h1 className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-primary whitespace-nowrap leading-tight`}>
                            {t('landing.systemName')}
                          </h1>
                          <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-semibold text-foreground/70 whitespace-nowrap leading-tight`}>
                            {t('landing.systemNameAr')}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                  
                  {/* Top Hide Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(false)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                      >
                        <motion.div
                          whileHover={{ x: 3 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{t('common.close')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

          {/* Account Switcher / Organization info */}
          <div className="border-b border-border">
            <AccountSwitcher collapsed={!isSidebarOpen} />
          </div>

          {/* Search Box */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-2 border-b border-border"
              >
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder={t('sidebar.searchPlaceholder')}
                    className="pr-9 pl-8 h-9 text-sm bg-muted/50"
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item: SidebarMenuItem) => (
                <SidebarNavGroup
                  key={item.key}
                  item={item}
                  isCollapsed={!isSidebarOpen}
                />
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t('commandPalette.noResults')}
              </div>
            )}
            
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
          <div className="p-3 border-t border-border space-y-2">
            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {t('nav.logout')}
                </span>
              )}
            </Button>
            
            {/* Hide Sidebar Button */}
            <Button
              variant="outline"
              onClick={() => setIsSidebarOpen(false)}
              className="w-full flex items-center justify-center gap-2 h-10 bg-muted/50 hover:bg-muted transition-all duration-200"
            >
              <motion.div 
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </motion.div>
              {isSidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">
                   {t('common.close')}
                 </span>
              )}
            </Button>
          </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Floating Show Sidebar Button - Visible when sidebar is hidden */}
        <AnimatePresence>
          {!isSidebarOpen && !isMobile && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-r-none rounded-l-xl h-24 w-8 flex flex-col items-center justify-center gap-1 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200"
                  >
                    <motion.div
                      animate={{ x: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                      <ChevronDown className="w-5 h-5 rotate-90 text-primary-foreground" />
                    </motion.div>
                    <span className="text-[10px] text-primary-foreground writing-mode-vertical">{t('nav.dashboard')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{t('nav.dashboard')}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content - Responsive margin */}
        <div 
          className="flex-1 flex flex-col transition-[margin] duration-300"
          style={{ 
            marginRight: !isMobile ? (isSidebarOpen ? sidebarWidth : 0) : 0 
          }}
        >
          {/* Top header - Responsive height */}
          <header className={`sticky top-0 z-40 ${headerHeight} bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm`}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${isMobile ? 'block' : 'hidden'} p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation`}
              aria-label="فتح القائمة"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile logo - Only show on mobile */}
            <div className={`${isMobile ? 'flex' : 'hidden'} items-center gap-2`}>
              <img src={logo} alt="آي ريسايكل" className="h-7 w-7 object-contain" />
              <span className="font-bold text-gradient-eco text-sm">{t('footer.brandName')}</span>
            </div>

            {/* Command Palette - Hide on mobile */}
            <div className={`${isMobile ? 'hidden' : 'block'} flex-1 max-w-md mx-4`}>
              <CommandPalette />
            </div>

            {/* Right side - Responsive spacing */}
            <div className={`flex items-center ${isMobile ? 'gap-1' : isTablet ? 'gap-2' : 'gap-3'}`}>
              {/* Global Refresh Button */}
              <GlobalRefreshButton />

              {/* Network Status Indicator */}
              <OfflineIndicator />

              {/* Focus Music Player - Hidden on mobile */}
              {!isMobile && <FocusMusicPlayer />}

              {/* Theme Customizer */}
              <ThemeCustomizer />

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
                        <AvatarImage src={profile?.avatar_url || ''} />
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
                      <p className="font-semibold text-foreground">{getEntityName()}</p>
                      {organization?.is_verified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>جهة موثقة ومعتمدة</p>
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
                          جهة موثقة
                        </span>
                      )}
                      {isLegalDataComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Scale className="w-3 h-3" />
                          بيانات قانونية
                        </span>
                      )}
                      {isDocumentsComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FolderCheck className="w-3 h-3" />
                          وثائق مكتملة
                        </span>
                      )}
                      {!organization?.is_verified && !isLegalDataComplete && !isDocumentsComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          يرجى استكمال البيانات
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
                      إرسال طلب للإدارة
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

          {/* Mobile menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-card border-b border-border overflow-hidden max-h-[70vh] overflow-y-auto"
              >
                {/* Mobile Search */}
                <div className="px-3 sm:px-4 pt-3 sm:pt-4 sticky top-0 bg-card z-10">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder={t('sidebar.searchPlaceholder')}
                      className="pr-9 pl-8 h-10 text-sm bg-muted/50"
                    />
                    {sidebarSearch && (
                      <button
                        onClick={() => setSidebarSearch('')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded touch-manipulation"
                      >
                        <XIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
                <nav className="p-3 sm:p-4 space-y-1 pb-safe">
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((item: any) => (
                      <div key={item.key || item.path} onClick={() => setIsMobileMenuOpen(false)}>
                        <SidebarNavItem
                          icon={item.icon}
                          label={item.label}
                          path={item.path}
                          isCollapsed={false}
                          badge={item.badge}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {t('commandPalette.noResults')}
                    </div>
                  )}
                  
                  {/* Quick Actions Section - Mobile */}
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
                          <div key={item.key} onClick={() => setIsMobileMenuOpen(false)}>
                            <SidebarNavItem
                              icon={item.icon}
                              label={item.label}
                              path={item.path}
                              isCollapsed={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page content - Responsive padding with proper overflow handling and bottom spacing for FABs */}
          <main className={`flex-1 ${mainPadding} overflow-x-hidden overflow-y-auto pb-24 sm:pb-6`}>
            <DashboardBreadcrumb />
            <div className="w-full max-w-full">
              <OnboardingGuard>
                {children}
              </OnboardingGuard>
            </div>
          </main>



        </div>
      </div>
    </TooltipProvider>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;

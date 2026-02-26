import { useState, useMemo, useEffect, useCallback, memo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FocusMusicProvider } from '@/contexts/FocusMusicContext';
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
import PlatformLogo from '@/components/common/PlatformLogo';
import DepositButton from '@/components/deposits/DepositButton';
import { getAvatarEmoji, getColorTheme } from '@/components/settings/ProfileCustomization';
import OfflineIndicator from '@/components/offline/OfflineIndicator';
import { getSidebarItemsFromQuickActions, getQuickActionsByType } from '@/config/quickActions';
import FloatingActionsStack from '@/components/layout/FloatingActionsStack';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import GlobalRefreshButton from './GlobalRefreshButton';
import LiveEventToast from '@/components/notifications/LiveEventToast';
import QuickActionsCustomizer from '@/components/dashboard/QuickActionsCustomizer';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import OnboardingGuard from '@/components/dashboard/OnboardingGuard';
import { lazy, Suspense } from 'react';
const EncryptedChatWidget = lazy(() => import('@/components/chat/EncryptedChatWidget'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoized sidebar nav item for performance
const MemoizedSidebarNavItem = memo(SidebarNavItem);

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
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
      case 'regulator':
        return Shield;
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
      case 'regulator':
        return 'الجهة الرقابية';
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
      case 'regulator':
        return 'الجهة الرقابية';
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
      { icon: Truck, label: 'طلبات الشحنات', path: '/dashboard/driver-offers', key: 'driver-offers' },
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
    { icon: Printer, label: language === 'ar' ? 'مركز الطباعة' : 'Print Center', path: '/dashboard/print-center', key: 'print-center' },
    { icon: PenTool, label: language === 'ar' ? 'التوقيعات والأختام' : 'Signing Status', path: '/dashboard/signing-status', key: 'signing-status' },
    
    // ═══════════════ المنظمة والهيكل ═══════════════
    { icon: Building2, label: t('sidebar.orgGroup'), path: '#', key: 'org-group', badge: sectionBadges['org-group'], children: [
      { icon: Building2, label: t('sidebar.orgProfile'), path: '/dashboard/organization-profile', key: 'org-profile' },
      { icon: Network, label: language === 'ar' ? 'الهيكل التنظيمي' : 'Org Structure', path: '/dashboard/org-structure', key: 'org-structure' },
      { icon: Users, label: language === 'ar' ? 'إدارة الموظفين' : 'Employees', path: '/dashboard/employees', key: 'employees' },
      { icon: Users, label: t('sidebar.teamData'), path: '/dashboard/team-credentials', key: 'other-team' },
      { icon: Newspaper, label: t('sidebar.posts'), path: '/dashboard/organization-profile?tab=posts', key: 'posts' },
      { icon: Rss, label: t('sidebar.partnersTimeline'), path: '/dashboard/partners-timeline', badge: sectionBadges['partners-timeline'], key: 'partners-timeline' },
      { icon: Handshake, label: t('sidebar.partners'), path: '/dashboard/partners', badge: (partnersCount || 0) + (sectionBadges['partners'] || 0), key: 'partners' },
    ]},

    // ═══════════════ العمليات حسب نوع الجهة ═══════════════
    ...((organization?.organization_type as string) === 'transporter'
      ? [{
          icon: Package, label: t('sidebar.shipmentsOps'), path: '#', key: 'transporter-ops-group', badge: sectionBadges['transporter-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/transporter-shipments', badge: sectionBadges['transporter-shipments'], key: 'transporter-shipments' },
            { icon: AlertTriangle, label: language === 'ar' ? 'الشحنات المرفوضة' : 'Rejected Shipments', path: '/dashboard/rejected-shipments', key: 'transporter-rejected' },
            { icon: FileText, label: t('sidebar.receiptCerts'), path: '/dashboard/transporter-receipts', key: 'transporter-receipts' },
            { icon: FileCheck, label: t('sidebar.deliveryDeclarations'), path: '/dashboard/delivery-declarations', key: 'transporter-declarations' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['transporter-certs'], key: 'transporter-certs' },
            { icon: Fingerprint, label: t('sidebar.guilloche'), path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche' },
            { icon: Inbox, label: language === 'ar' ? 'طلبات الجمع' : 'Collection Requests', path: '/dashboard/collection-requests', key: 'collection-requests' },
          ]
        } as SidebarMenuItem,
        {
          icon: Users, label: t('sidebar.driversGroup'), path: '#', key: 'transporter-drivers-group', children: [
            { icon: Users, label: t('sidebar.driversGroup'), path: '/dashboard/transporter-drivers', key: 'transporter-drivers' },
            { icon: MapPin, label: t('sidebar.driverTracking'), path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking' },
            { icon: Truck, label: language === 'ar' ? 'خريطة المسارات' : 'Routes Map', path: '/dashboard/shipment-routes', key: 'shipment-routes' },
            { icon: Shield, label: language === 'ar' ? 'تصاريح السائقين' : 'Driver Permits', path: '/dashboard/driver-permits', key: 'driver-permits' },
            { icon: GraduationCap, label: language === 'ar' ? 'أكاديمية السائقين' : 'Driver Academy', path: '/dashboard/driver-academy', key: 'driver-academy' },
          ]
        } as SidebarMenuItem,
        {
          icon: Wallet, label: language === 'ar' ? 'الأدوات المالية' : 'Financial Tools', path: '#', key: 'transporter-finance-group', children: [
            { icon: Umbrella, label: language === 'ar' ? 'التأمين الذكي' : 'Smart Insurance', path: '/dashboard/smart-insurance', key: 'smart-insurance' },
            { icon: TrendingUp, label: language === 'ar' ? 'العقود الآجلة' : 'Futures Market', path: '/dashboard/futures-market', key: 'futures-market' },
            { icon: Wallet, label: language === 'ar' ? 'المحفظة الرقمية' : 'Digital Wallet', path: '/dashboard/digital-wallet', key: 'digital-wallet' },
          ]
        } as SidebarMenuItem]
      : (organization?.organization_type as string) === 'recycler'
      ? [{
          icon: Package, label: t('sidebar.shipmentsCerts'), path: '#', key: 'recycler-ops-group', badge: sectionBadges['recycler-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/shipments', badge: sectionBadges['recycler-shipments'], key: 'recycler-shipments' },
            { icon: AlertTriangle, label: language === 'ar' ? 'الشحنات المرفوضة' : 'Rejected Shipments', path: '/dashboard/rejected-shipments', key: 'recycler-rejected' },
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
            { icon: Factory, label: language === 'ar' ? 'مرافق التخلص' : 'Disposal Facilities', path: '/dashboard/disposal-facilities', key: 'disposal-facilities' },
          ]
        } as SidebarMenuItem]
      : (organization?.organization_type as string) === 'regulator'
      ? [{
          icon: Shield, label: language === 'ar' ? 'المنظومة الرقابية' : 'Regulatory System', path: '#', key: 'regulator-ops-group', children: [
            { icon: BarChart3, label: language === 'ar' ? 'لوحة الرقابة' : 'Regulator Dashboard', path: '/dashboard/regulator', key: 'regulator-dashboard' },
            { icon: Building2, label: language === 'ar' ? 'سجل المنظمات' : 'Organizations Registry', path: '/dashboard/regulator', key: 'regulator-orgs' },
            { icon: ClipboardCheck, label: language === 'ar' ? 'التفتيش الميداني' : 'Field Inspections', path: '/dashboard/regulator', key: 'regulator-inspections' },
            { icon: AlertTriangle, label: language === 'ar' ? 'المخالفات' : 'Violations', path: '/dashboard/regulator', key: 'regulator-violations' },
            { icon: Scale, label: language === 'ar' ? 'القرارات والعقوبات' : 'Penalties', path: '/dashboard/regulator', key: 'regulator-penalties' },
            { icon: Building2, label: language === 'ar' ? 'الشركات المنظمة' : 'Regulated Companies', path: '/dashboard/regulated-companies', key: 'regulated-companies' },
            { icon: MapPin, label: language === 'ar' ? 'تتبع المركبات' : 'Vehicle Tracking', path: '/dashboard/driver-tracking', key: 'regulator-tracking' },
          ]
        } as SidebarMenuItem]
      : [{
          icon: Package, label: t('sidebar.shipmentsCerts'), path: '#', key: 'generator-ops-group', badge: sectionBadges['generator-ops-group'], children: [
            { icon: Package, label: t('sidebar.shipments'), path: '/dashboard/shipments', badge: sectionBadges['generator-shipments'], key: 'generator-shipments' },
            { icon: AlertTriangle, label: language === 'ar' ? 'الشحنات المرفوضة' : 'Rejected Shipments', path: '/dashboard/rejected-shipments', key: 'generator-rejected' },
            { icon: FileText, label: t('sidebar.receiptCerts'), path: '/dashboard/generator-receipts', key: 'generator-receipts' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['generator-certs'], key: 'generator-certs' },
          ]
        } as SidebarMenuItem]),

    // ═══════════════ العمليات والسجلات ═══════════════
    { icon: Activity, label: language === 'ar' ? 'العمليات والأنشطة' : 'Operations & Activity', path: '#', key: 'operations-group', children: [
      { icon: Gauge, label: language === 'ar' ? 'لوحة العمليات' : 'Operations Dashboard', path: '/dashboard/operations', key: 'operations' },
      { icon: ClipboardList, label: language === 'ar' ? 'سجل الأنشطة' : 'Activity Log', path: '/dashboard/activity-log', key: 'activity-log' },
      { icon: FileText, label: language === 'ar' ? 'السجلات الخارجية' : 'External Records', path: '/dashboard/external-records', key: 'external-records' },
      { icon: MapPin, label: language === 'ar' ? 'إعدادات GPS' : 'GPS Settings', path: '/dashboard/gps-settings', key: 'gps-settings' },
      { icon: Zap, label: language === 'ar' ? 'إعدادات IoT' : 'IoT Settings', path: '/dashboard/iot-settings', key: 'iot-settings' },
    ]},

    // ═══════════════ العقود والقانونية ═══════════════
    { icon: FileText, label: language === 'ar' ? 'العقود والقانونية' : 'Contracts & Legal', path: '#', key: 'contracts-group', children: [
      { icon: FileText, label: language === 'ar' ? 'العقود' : 'Contracts', path: '/dashboard/contracts', key: 'contracts' },
      { icon: FileText, label: language === 'ar' ? 'قوالب العقود' : 'Contract Templates', path: '/dashboard/contract-templates', key: 'contract-templates' },
      { icon: Award, label: language === 'ar' ? 'خطابات الترسية' : 'Award Letters', path: '/dashboard/award-letters', key: 'award-letters' },
      { icon: FileCheck, label: language === 'ar' ? 'قبول الشروط' : 'Terms Acceptances', path: '/dashboard/terms-acceptances', key: 'terms-acceptances' },
      { icon: Shield, label: language === 'ar' ? 'الاشتراطات والسياسات' : 'Terms & Policies', path: '/dashboard/platform-terms', key: 'platform-terms' },
      { icon: BadgeCheck, label: language === 'ar' ? 'ختم المستندات' : 'Document Stamping', path: '/dashboard/admin-document-stamping', key: 'admin-document-stamping' },
      { icon: Receipt, label: language === 'ar' ? 'الفاتورة الإلكترونية' : 'E-Invoice', path: '/dashboard/e-invoice', key: 'e-invoice' },
      { icon: Eye, label: language === 'ar' ? 'التحقق من الوثائق' : 'Document Verification', path: '/dashboard/document-verification', key: 'document-verification' },
    ]},

    // ═══════════════ لوحة الإدارة ═══════════════
    ...(isAdmin
      ? [{
          icon: Shield, label: t('sidebar.adminGroup'), path: '#', key: 'admin-group', badge: sectionBadges['admin-group'], children: [
            { icon: Brain, label: t('sidebar.smartEye'), path: '/dashboard/smart-insights', key: 'smart-insights' },
            { icon: Shield, label: t('sidebar.smartOnboarding'), path: '/dashboard/onboarding-review', key: 'onboarding-review' },
            { icon: Activity, label: t('sidebar.systemStatus'), path: '/dashboard/system-status', key: 'system-status' },
            { icon: Activity, label: language === 'ar' ? 'نظرة عامة على النظام' : 'System Overview', path: '/dashboard/system-overview', key: 'system-overview' },
            { icon: Settings, label: language === 'ar' ? 'أوامر النظام' : 'System Commands', path: '/dashboard/system-commands', key: 'system-commands' },
            { icon: CheckSquare, label: t('sidebar.companyApprovals'), path: '/dashboard/company-approvals', badge: sectionBadges['company-approvals'], key: 'company-approvals' },
            { icon: Building2, label: language === 'ar' ? 'إدارة الشركات' : 'Company Management', path: '/dashboard/company-management', key: 'company-management' },
            { icon: UserPlus, label: t('sidebar.driverApprovals'), path: '/dashboard/driver-approvals', badge: sectionBadges['driver-approvals'], key: 'driver-approvals' },
            { icon: FileText, label: t('sidebar.orgDocuments'), path: '/dashboard/organization-documents', badge: sectionBadges['org-docs'], key: 'org-docs' },
            { icon: MapPin, label: t('sidebar.driverTracking'), path: '/dashboard/driver-tracking', key: 'admin-driver-tracking' },
            { icon: Truck, label: t('sidebar.driversMap'), path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map' },
            { icon: FolderCheck, label: t('sidebar.recyclingCerts'), path: '/dashboard/recycling-certificates', badge: sectionBadges['admin-certs'], key: 'admin-certs' },
            { icon: Video, label: t('sidebar.videoGen'), path: '/dashboard/video-generator', key: 'video-gen' },
            { icon: TreePine, label: t('sidebar.woodMarket'), path: '/dashboard/wood-market', key: 'wood-market' },
            { icon: Scale, label: language === 'ar' ? 'لوحة الرقابة' : 'Regulator Dashboard', path: '/dashboard/regulator', key: 'regulator' },
            { icon: Building2, label: language === 'ar' ? 'الشركات المنظمة' : 'Regulated Companies', path: '/dashboard/regulated-companies', key: 'regulated-companies' },
            { icon: LinkIcon, label: language === 'ar' ? 'إدارة API' : 'API Management', path: '/dashboard/api', key: 'api-management' },
            { icon: Shield, label: language === 'ar' ? 'اختبار الأمان' : 'Security Testing', path: '/dashboard/security-testing', key: 'security-testing' },
            { icon: Database, label: language === 'ar' ? 'تحسين قاعدة البيانات' : 'DB Optimization', path: '/dashboard/db-optimization', key: 'db-optimization' },
            { icon: BarChart3, label: language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics', path: '/dashboard/advanced-analytics', key: 'advanced-analytics' },
            { icon: Lock, label: language === 'ar' ? 'امتثال GDPR' : 'GDPR Compliance', path: '/dashboard/gdpr-compliance', key: 'gdpr-compliance' },
            { icon: BookOpen, label: language === 'ar' ? 'بروشور المنصة' : 'Platform Brochure', path: '/dashboard/platform-brochure', key: 'platform-brochure' },
          ]
        } as SidebarMenuItem]
      : []),

    // ═══════════════ التقارير والتحليلات ═══════════════
    { icon: BarChart3, label: t('sidebar.reportsGroup'), path: '#', key: 'reports-group', badge: sectionBadges['reports-group'], children: [
      { icon: BarChart3, label: t('sidebar.reportsGroup'), path: '/dashboard/reports', key: 'reports' },
      { icon: FileText, label: t('sidebar.shipmentReports'), path: '/dashboard/shipment-reports', key: 'shipment-reports' },
      { icon: ClipboardList, label: t('sidebar.aggregateReport'), path: '/dashboard/aggregate-report', key: 'aggregate-report' },
      { icon: BookOpen, label: t('sidebar.reportsGuide'), path: '/dashboard/reports-guide', key: 'reports-guide' },
      { icon: Leaf, label: language === 'ar' ? 'البصمة الكربونية' : 'Carbon Footprint', path: '/dashboard/carbon-footprint', key: 'carbon-footprint' },
      { icon: TreePine, label: language === 'ar' ? 'الاستدامة البيئية' : 'Environmental Sustainability', path: '/dashboard/environmental-sustainability', key: 'environmental-sustainability' },
      { icon: Leaf, label: language === 'ar' ? 'تقارير ESG' : 'ESG Reports', path: '/dashboard/esg-reports', key: 'esg-reports' },
      { icon: Shield, label: language === 'ar' ? 'تقارير السلامة المهنية' : 'OHS Reports', path: '/dashboard/ohs-reports', key: 'ohs-reports' },
      { icon: BarChart3, label: language === 'ar' ? 'تحليل النفايات التفصيلي' : 'Detailed Waste Analysis', path: '/dashboard/detailed-waste-analysis', key: 'detailed-waste-analysis' },
      { icon: Activity, label: language === 'ar' ? 'خريطة تدفق النفايات' : 'Waste Flow Heatmap', path: '/dashboard/waste-flow-heatmap', key: 'waste-flow-heatmap' },
    ]},

    // ═══════════════ الأعمال اليدوية والأرشيف ═══════════════
    { icon: FolderOpen, label: language === 'ar' ? 'الأعمال اليدوية والأرشيف' : 'Manual Ops & Archive', path: '#', key: 'doc-archive-group', children: [
      { icon: FileCheck, label: language === 'ar' ? 'الأعمال اليدوية' : 'Manual Operations', path: '/dashboard/manual-operations', key: 'manual-operations' },
      { icon: FolderOpen, label: t('sidebar.allDocs'), path: '/dashboard/document-archive', key: 'doc-archive-all' },
      { icon: Inbox, label: t('sidebar.receivedDocs'), path: '/dashboard/document-archive?tab=received', key: 'doc-archive-received' },
      { icon: Send, label: t('sidebar.sentDocs'), path: '/dashboard/document-archive?tab=sent', key: 'doc-archive-sent' },
      { icon: FileText, label: t('sidebar.issuedDocs'), path: '/dashboard/document-archive?tab=issued', key: 'doc-archive-issued' },
      { icon: FileSignature, label: language === 'ar' ? 'طلبات التوقيع' : 'Signing Requests', path: '/dashboard/document-archive?tab=signing_request', key: 'doc-archive-signing' },
      { icon: Building2, label: language === 'ar' ? 'حسب الجهة' : 'By Partner', path: '/dashboard/document-archive?view=partners', key: 'doc-archive-partners' },
    ]},

    // ═══════════════ سجلات المخلفات ═══════════════
    { icon: FileSpreadsheet, label: t('sidebar.wasteRegisters'), path: '#', key: 'waste-group', children: [
      { icon: FileSpreadsheet, label: t('sidebar.nonHazardous'), path: '/dashboard/non-hazardous-register', key: 'non-hazardous' },
      { icon: AlertTriangle, label: t('sidebar.hazardous'), path: '/dashboard/hazardous-register', key: 'hazardous' },
      { icon: Layers, label: t('sidebar.wasteClassification'), path: '/dashboard/waste-types', key: 'waste-types' },
    ]},

    // ═══════════════ بورصة المخلفات والتجارة ═══════════════
    ...((organization?.organization_type === 'transporter' || organization?.organization_type === 'recycler' || isAdmin)
      ? [{ 
          icon: Store, label: language === 'ar' ? 'البورصة والتجارة' : 'Exchange & Trade', path: '#', key: 'exchange-group', children: [
            { icon: Store, label: language === 'ar' ? 'بورصة المخلفات' : 'Waste Exchange', path: '/dashboard/waste-exchange', key: 'waste-exchange' },
            { icon: Globe, label: language === 'ar' ? 'بورصة السلع العالمية' : 'Global Commodity Exchange', path: '/dashboard/commodity-exchange', key: 'commodity-exchange' },
          ]
        } as SidebarMenuItem]
      : []),

    // ═══════════════ أدوات الذكاء الاصطناعي ═══════════════
    { icon: Brain, label: language === 'ar' ? 'أدوات الذكاء الاصطناعي' : 'AI Tools', path: 
      (organization?.organization_type === 'transporter' ? '/dashboard/transporter-ai-tools' :
       organization?.organization_type === 'recycler' ? '/dashboard/recycler-ai-tools' :
       '/dashboard/ai-tools'), key: 'ai-tools' },

    // ═══════════════ الخرائط والمواقع ═══════════════
    { icon: MapPin, label: t('sidebar.locationMaps'), path: '#', key: 'location-group', children: [
      { icon: Search, label: t('sidebar.map'), path: '/dashboard/map-explorer', key: 'map-explorer' },
      { icon: Bookmark, label: t('sidebar.savedLocations'), path: '/dashboard/saved-locations', key: 'saved-locations' },
    ]},

    // ═══════════════ الروابط السريعة ═══════════════
    { icon: Zap, label: t('sidebar.quickLinks'), path: '#', key: 'quick-links-group', children: [
      { icon: LinkIcon, label: t('sidebar.quickDepositLinks'), path: '/dashboard/quick-deposit-links', key: 'quick-deposit-links' },
      { icon: Zap, label: t('sidebar.quickShipmentLinks'), path: '/dashboard/quick-shipment-links', key: 'quick-shipment-links' },
      { icon: Truck, label: t('sidebar.quickDriverLinks'), path: '/dashboard/quick-driver-links', key: 'quick-driver-links' },
    ]},

    // ═══════════════ التواصل ═══════════════
    { icon: MessageCircle, label: t('sidebar.communication'), path: '#', key: 'comm-group', badge: sectionBadges['comm-group'], children: [
      { icon: MessageCircle, label: t('sidebar.chatMessages'), path: '/dashboard/chat', badge: sectionBadges['chat'], key: 'chat' },
      { icon: CircleDot, label: t('sidebar.statuses'), path: '/dashboard/stories', key: 'stories' },
      { icon: Users, label: language === 'ar' ? 'بوابة العملاء' : 'Customer Portal', path: '/dashboard/customer-portal', key: 'customer-portal' },
    ]},

    // ═══════════════ الطلبات والتنظيمية ═══════════════
    { icon: Send, label: t('sidebar.requestsReg'), path: '#', key: 'requests-reg-group', badge: sectionBadges['requests-reg-group'], children: [
      { icon: Send, label: t('sidebar.myRequests'), path: '/dashboard/my-requests', badge: sectionBadges['my-requests'], key: 'my-requests' },
      { icon: Scale, label: t('sidebar.regulatoryLog'), path: '/dashboard/regulatory-updates', key: 'regulatory' },
      { icon: ClipboardList, label: t('sidebar.operationalPlans'), path: '/dashboard/operational-plans', key: 'operational-plans' },
      { icon: Users, label: t('sidebar.partnerAccounts'), path: '/dashboard/partner-accounts', badge: sectionBadges['partner-accounts'], key: 'partner-accounts' },
    ]},

    // ═══════════════ نظام ERP ═══════════════
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

    // ═══════════════ المفوضون والتوقيعات ═══════════════
    { icon: PenTool, label: language === 'ar' ? 'التوقيعات والتفويض' : 'Signatures & Auth', path: '#', key: 'signatures-group', children: [
      { icon: Shield, label: language === 'ar' ? 'المفوضون المعتمدون' : 'Authorized Signatories', path: '/dashboard/authorized-signatories', key: 'authorized-signatories' },
      { icon: FileText, label: language === 'ar' ? 'التصاريح والأذونات' : 'Permits', path: '/dashboard/permits', key: 'permits' },
      { icon: Shield, label: language === 'ar' ? 'الاستشاريون البيئيون' : 'Env. Consultants', path: '/dashboard/environmental-consultants', key: 'env-consultants' },
      { icon: FileText, label: language === 'ar' ? 'صندوق التوقيعات' : 'Signing Inbox', path: '/dashboard/signing-inbox', key: 'signing-inbox' },
    ]},

    // ═══════════════ الإنجازات والتقدير ═══════════════
    { icon: Trophy, label: language === 'ar' ? 'الإنجازات والتقدير' : 'Achievements', path: '#', key: 'achievements-group', children: [
      { icon: Trophy, label: language === 'ar' ? 'نظام الإنجازات' : 'Gamification', path: '/dashboard/gamification', key: 'gamification' },
      { icon: Award, label: language === 'ar' ? 'شهادات التميز' : 'Pride Certificates', path: '/dashboard/pride-certificates', key: 'pride-certificates' },
    ]},

    // ═══════════════ الملاحظات ═══════════════
    { icon: FileText, label: language === 'ar' ? 'مركز الملاحظات' : 'Notes Center', path: '/dashboard/notes', key: 'notes-center' },

    // ═══════════════ التعلم والتطوير ═══════════════
    { icon: GraduationCap, label: language === 'ar' ? 'التعلم والتطوير' : 'Learning & Dev', path: '#', key: 'learning-group', children: [
      { icon: GraduationCap, label: language === 'ar' ? 'المركز التعليمي' : 'Learning Center', path: '/dashboard/learning-center', key: 'learning-center' },
      { icon: BookOpen, label: language === 'ar' ? 'دليل المستخدم' : 'User Guide', path: '/dashboard/user-guide', key: 'user-guide' },
    ]},

    // ═══════════════ النظام والدعم ═══════════════
    { icon: Settings, label: t('sidebar.systemSupport'), path: '#', key: 'system-support-group', badge: notificationCount, children: [
      { icon: Headphones, label: t('sidebar.techSupport'), path: '/dashboard/support', key: 'support' },
      { icon: Bell, label: t('nav.notifications'), path: '/dashboard/notifications', badge: notificationCount, key: 'notifications' },
      { icon: Activity, label: t('sidebar.yourSystemStatus'), path: '/dashboard/system-status', key: 'all-system-status' },
      { icon: Wallet, label: language === 'ar' ? 'إدارة الاشتراك' : 'Subscription', path: '/dashboard/subscription', key: 'subscription' },
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
  const headerHeight = isMobile ? 'h-14' : 'h-16';
  const mainPadding = getResponsiveClass({
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
    <TooltipProvider>
      <div className="h-screen bg-background flex overflow-hidden" dir="rtl">
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
                    <PlatformLogo size={isMobile ? 'sm' : 'md'} showText={false} showSubtitle={isSidebarOpen} />
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

        {/* Main content - Responsive width */}
        <div 
          className="flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-hidden"
          style={{ 
            marginRight: !isMobile && isSidebarOpen ? `${sidebarWidth}px` : 0,
            width: !isMobile && isSidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%',
          }}
        >
          {/* Top header - Responsive height */}
          <header className={`sticky top-0 z-40 ${headerHeight} bg-card/85 backdrop-blur-xl border-b border-border/40 flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 shadow-sm`} style={{ WebkitBackdropFilter: 'blur(20px) saturate(1.5)' }}>
            <div className="flex items-center gap-2 shrink-0">
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                  aria-label="فتح القائمة"
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
              {/* Global Refresh Button - Hidden on mobile */}
              {!isMobile && <GlobalRefreshButton />}

              {/* Network Status Indicator */}
              <OfflineIndicator />

              {/* Focus Music Player - Hidden on mobile, shown in sidebar */}
              {!isMobile && <FocusMusicPlayer />}

              {/* Theme Customizer - Hidden on mobile */}
              {!isMobile && <ThemeCustomizer />}

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
                      {organization?.logo_url ? (
                        <img src={organization.logo_url} alt={getEntityName()} className="w-8 h-8 rounded-lg object-cover shrink-0" />
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
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed top-0 right-0 z-50 h-full w-[85vw] max-w-[320px] bg-card shadow-2xl lg:hidden flex flex-col touch-manipulation"
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
                  <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <PlatformLogo size="sm" showText />
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                      aria-label="إغلاق القائمة"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-3 pt-3 shrink-0">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder={t('sidebar.searchPlaceholder')}
                        className="pr-9 pl-8 h-11 text-sm bg-muted/50"
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

                  {/* Nav items - scrollable */}
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-safe overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {filteredMenuItems.length > 0 ? (
                      filteredMenuItems.map((item: SidebarMenuItem) => (
                        <div key={item.key} onClick={(e) => {
                          if ((e.target as HTMLElement).closest('a')) setIsMobileMenuOpen(false);
                        }}>
                          <SidebarNavGroup
                            item={item}
                            isCollapsed={false}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {t('commandPalette.noResults')}
                      </div>
                    )}
                    
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

                  {/* Bottom - Music Player & Logout */}
                  <div className="p-3 border-t border-border shrink-0 space-y-2">
                    <div className="flex items-center justify-center">
                      <FocusMusicPlayer />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center justify-center gap-2 h-12 text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">{t('nav.logout')}</span>
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Page content - Responsive padding with proper overflow handling and bottom spacing for bottom nav */}
          <main className={`flex-1 ${mainPadding} overflow-x-hidden overflow-y-auto ${isMobile ? 'pb-24' : 'pb-6'} scroll-smooth min-h-0`} style={{ WebkitOverflowScrolling: 'touch' }}>
            <DashboardBreadcrumb />
            <div className="w-full max-w-full">
              <OnboardingGuard>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </OnboardingGuard>
            </div>
          </main>

          {/* Floating Permits Button */}
          <FloatingActionsStack
            actions={[
              {
                id: 'permits',
                icon: <FileText size={isMobile ? 16 : 22} />,
                onClick: () => navigate('/dashboard/driver-permits'),
                label: 'التصاريح العامة',
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

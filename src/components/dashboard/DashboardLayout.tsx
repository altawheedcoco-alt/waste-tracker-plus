import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
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
import DashboardBreadcrumb from './DashboardBreadcrumb';
import CommandPalette from './CommandPalette';
import CreateRequestButton from './CreateRequestButton';
import AccountSwitcher from './AccountSwitcher';
import { usePartnersCount } from '@/hooks/usePartnersCount';
import { useNotifications } from '@/hooks/useNotifications';
import { initNotificationAudio, ensureSoundsEnabled } from '@/hooks/useNotificationSound';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import DepositButton from '@/components/deposits/DepositButton';
import OfflineIndicator from '@/components/offline/OfflineIndicator';

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
  const location = useLocation();
  const navigate = useNavigate();
  
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
    navigate('/');
  };

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isDriver = roles.includes('driver');

  const getOrganizationIcon = () => {
    if (isAdmin) {
      return Settings;
    }
    switch (organization?.organization_type) {
      case 'generator':
        return Building2;
      case 'transporter':
        return Truck;
      case 'recycler':
        return Recycle;
      default:
        return Building2;
    }
  };

  const getOrganizationLabel = () => {
    if (isAdmin) {
      return 'جهة الإدارة والمراقبة';
    }
    switch (organization?.organization_type) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
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
    switch (organization?.organization_type) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
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
  const driverMenuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', key: 'driver-dashboard' },
    { icon: User, label: 'ملف السائق', path: '/dashboard/driver-profile', key: 'driver-profile' },
    { icon: Truck, label: 'بيانات السائق', path: '/dashboard/driver-data', key: 'driver-data' },
    { icon: Package, label: 'شحناتي', path: '/dashboard/transporter-shipments', key: 'driver-shipments' },
    { icon: MapPin, label: 'موقعي', path: '/dashboard/my-location', key: 'driver-location' },
    { icon: Bookmark, label: 'المواقع المحفوظة', path: '/dashboard/saved-locations', key: 'driver-saved-locations' },
    { icon: Search, label: 'الخريطة', path: '/dashboard/map-explorer', key: 'driver-map-explorer' },
    { icon: Send, label: 'طلباتي', path: '/dashboard/my-requests', key: 'driver-requests' },
    { icon: MessageCircle, label: 'المحادثات', path: '/dashboard/chat', key: 'driver-chat' },
    { icon: Headphones, label: 'الدعم الفني', path: '/dashboard/support', key: 'driver-support' },
    { icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: notificationCount, key: 'driver-notifications' },
    { icon: Info, label: 'عن المنصة', path: '/dashboard/about-platform', key: 'driver-about' },
    { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings', key: 'driver-settings' },
  ];

  // Full menu items for organizations and admins - with unique keys
  const fullMenuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', key: 'dashboard' },
    { icon: Building2, label: 'ملف الجهة', path: '/dashboard/organization-profile', key: 'org-profile' },
    { icon: Newspaper, label: 'المنشورات', path: '/dashboard/organization-profile?tab=posts', key: 'posts' },
    { icon: Rss, label: 'تايم لاين الشركاء', path: '/dashboard/partners-timeline', key: 'partners-timeline' },
    { icon: Handshake, label: 'الشركاء', path: '/dashboard/partners', badge: partnersCount, key: 'partners' },
    ...(organization?.organization_type === 'transporter'
      ? [
          { icon: Package, label: 'الشحنات', path: '/dashboard/transporter-shipments', key: 'transporter-shipments' },
          { icon: Users, label: 'السائقين', path: '/dashboard/transporter-drivers', key: 'transporter-drivers' },
          { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking' },
          { icon: Users, label: 'بيانات الفريق', path: '/dashboard/team-credentials', key: 'transporter-team' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates', key: 'transporter-certs' },
        ]
      : organization?.organization_type === 'recycler'
      ? [
          { icon: Package, label: 'الشحنات', path: '/dashboard/shipments', key: 'recycler-shipments' },
          { icon: FolderCheck, label: 'إصدار شهادات التدوير', path: '/dashboard/issue-recycling-certificates', key: 'issue-certs' },
        ]
      : [
          { icon: Package, label: 'الشحنات', path: '/dashboard/shipments', key: 'generator-shipments' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates', key: 'generator-certs' },
        ]),
    // Add team credentials for all organization types with employees
    ...(!isTransporter && !isAdmin ? [
      { icon: Users, label: 'بيانات الفريق', path: '/dashboard/team-credentials', key: 'other-team' },
    ] : []),
    ...(isAdmin
      ? [
          { icon: Activity, label: 'حالة النظام', path: '/dashboard/system-status', key: 'system-status' },
          { icon: CheckSquare, label: 'موافقات الشركات', path: '/dashboard/company-approvals', key: 'company-approvals' },
          { icon: UserPlus, label: 'موافقات السائقين', path: '/dashboard/driver-approvals', key: 'driver-approvals' },
          { icon: FileText, label: 'وثائق الجهات', path: '/dashboard/organization-documents', key: 'org-docs' },
          { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking', key: 'admin-driver-tracking' },
          { icon: Truck, label: 'خريطة السائقين', path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates', key: 'admin-certs' },
          { icon: Video, label: 'إنشاء فيديوهات ترويجية', path: '/dashboard/video-generator', key: 'video-gen' },
        ]
      : []),
    { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports', key: 'reports' },
    { icon: FileText, label: 'تقارير الشحنات', path: '/dashboard/shipment-reports', key: 'shipment-reports' },
    { icon: ClipboardList, label: 'التقرير المجمع', path: '/dashboard/aggregate-report', key: 'aggregate-report' },
    { icon: FileSpreadsheet, label: 'سجل المخلفات الغير خطرة', path: '/dashboard/non-hazardous-register', key: 'non-hazardous' },
    { icon: AlertTriangle, label: 'سجل المخلفات الخطرة', path: '/dashboard/hazardous-register', key: 'hazardous' },
    { icon: Layers, label: 'تصنيف أنواع المخلفات', path: '/dashboard/waste-types', key: 'waste-types' },
    { icon: Search, label: 'الخريطة', path: '/dashboard/map-explorer', key: 'map-explorer' },
    { icon: Bookmark, label: 'المواقع المحفوظة', path: '/dashboard/saved-locations', key: 'saved-locations' },
    { icon: Send, label: 'طلباتي', path: '/dashboard/my-requests', key: 'my-requests' },
    { icon: Scale, label: 'سجل جهاز التنظيم', path: '/dashboard/regulatory-updates', key: 'regulatory' },
    { icon: ClipboardList, label: 'الخطط التشغيلية', path: '/dashboard/operational-plans', key: 'operational-plans' },
    { icon: MessageCircle, label: 'المحادثات', path: '/dashboard/chat', key: 'chat' },
    { icon: Users, label: 'حسابات الشركاء', path: '/dashboard/partner-accounts', key: 'partner-accounts' },
    { icon: Headphones, label: 'الدعم الفني', path: '/dashboard/support', key: 'support' },
    { icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: notificationCount, key: 'notifications' },
    { icon: Info, label: 'عن المنصة', path: '/dashboard/about-platform', key: 'about-platform' },
    { icon: BookOpen, label: 'دليل التقارير', path: '/dashboard/reports-guide', key: 'reports-guide' },
    { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings', key: 'settings' },
  ];

  // Use driver menu if user is a driver (not admin)
  const menuItems = isDriver && !isAdmin ? driverMenuItems : fullMenuItems;

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!sidebarSearch.trim()) return menuItems;
    const searchLower = sidebarSearch.toLowerCase();
    return menuItems.filter((item: any) => 
      item.label.toLowerCase().includes(searchLower) ||
      item.path.toLowerCase().includes(searchLower)
    );
  }, [menuItems, sidebarSearch]);

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
                          className="overflow-hidden"
                        >
                          <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gradient-eco whitespace-nowrap`}>
                            آي ريسايكل
                          </h1>
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
                      <p>إخفاء القائمة</p>
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
                    placeholder="بحث في القائمة..."
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
              filteredMenuItems.map((item: any) => (
                <SidebarNavItem
                  key={item.key || item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isCollapsed={!isSidebarOpen}
                  badge={item.badge}
                />
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                لا توجد نتائج
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
                  تسجيل الخروج
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
                  إخفاء القائمة
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
                    <span className="text-[10px] text-primary-foreground writing-mode-vertical">القائمة</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>إظهار القائمة</p>
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
              <span className="font-bold text-gradient-eco text-sm">آي ريسايكل</span>
            </div>

            {/* Command Palette - Hide on mobile */}
            <div className={`${isMobile ? 'hidden' : 'block'} flex-1 max-w-md mx-4`}>
              <CommandPalette />
            </div>

            {/* Right side - Responsive spacing */}
            <div className={`flex items-center ${isMobile ? 'gap-1' : isTablet ? 'gap-2' : 'gap-3'}`}>
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
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
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
                  <DropdownMenuItem onClick={() => navigate('/dashboard/organization-profile')} className="cursor-pointer">
                    <Building2 className="ml-2 h-4 w-4" />
                    ملف الجهة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer">
                    <Settings className="ml-2 h-4 w-4" />
                    الإعدادات
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
                    تسجيل الخروج
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
                      placeholder="بحث في القائمة..."
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
                      لا توجد نتائج
                    </div>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page content - Responsive padding with proper overflow handling */}
          <main className={`flex-1 ${mainPadding} overflow-x-hidden overflow-y-auto`}>
            <DashboardBreadcrumb />
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>

          {/* Floating Create Shipment Button for Transporters/Drivers - positioned to avoid chat widget */}
          {(isTransporter || isDriver) && (
            <motion.button
              onClick={() => navigate('/dashboard/shipments/new')}
              className={`fixed z-30 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center touch-manipulation ${
                isMobile ? 'bottom-4 right-4 w-12 h-12' : 'bottom-6 left-20 w-14 h-14'
              }`}
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}
              whileTap={{ scale: 0.9 }}
              title="إنشاء شحنة جديدة"
            >
              <Plus size={isMobile ? 20 : 24} />
            </motion.button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;

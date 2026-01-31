import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const { profile, organization, signOut, roles } = useAuth();
  const { count: partnersCount } = usePartnersCount();
  const { unreadCount: notificationCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
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

  // Driver-specific menu items (simplified)
  const driverMenuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard' },
    { icon: Package, label: 'شحناتي', path: '/dashboard/transporter-shipments' },
    { icon: MapPin, label: 'موقعي', path: '/dashboard/my-location' },
    { icon: Send, label: 'طلباتي', path: '/dashboard/my-requests' },
    { icon: MessageCircle, label: 'المحادثات', path: '/dashboard/chat' },
    { icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: notificationCount },
    { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
  ];

  // Full menu items for organizations and admins
  const fullMenuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard' },
    { icon: Building2, label: 'ملف الجهة', path: '/dashboard/organization-profile' },
    { icon: Newspaper, label: 'المنشورات', path: '/dashboard/organization-profile?tab=posts' },
    { icon: Rss, label: 'تايم لاين الشركاء', path: '/dashboard/partners-timeline' },
    { icon: Handshake, label: 'الشركاء', path: '/dashboard/partners', badge: partnersCount },
    ...(organization?.organization_type === 'transporter'
      ? [
          { icon: Package, label: 'الشحنات', path: '/dashboard/transporter-shipments' },
          { icon: Users, label: 'السائقين', path: '/dashboard/transporter-drivers' },
          { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking' },
          { icon: Users, label: 'بيانات الفريق', path: '/dashboard/team-credentials' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates' },
        ]
      : organization?.organization_type === 'recycler'
      ? [
          { icon: Package, label: 'الشحنات', path: '/dashboard/shipments' },
          { icon: FolderCheck, label: 'إصدار شهادات التدوير', path: '/dashboard/issue-recycling-certificates' },
        ]
      : [
          { icon: Package, label: 'الشحنات', path: '/dashboard/shipments' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates' },
        ]),
    // Add team credentials for all organization types with employees
    ...(!isTransporter && !isAdmin ? [
      { icon: Users, label: 'بيانات الفريق', path: '/dashboard/team-credentials' },
    ] : []),
    ...(isAdmin
      ? [
          { icon: CheckSquare, label: 'موافقات الشركات', path: '/dashboard/company-approvals' },
          { icon: UserPlus, label: 'موافقات السائقين', path: '/dashboard/driver-approvals' },
          { icon: FileText, label: 'وثائق الجهات', path: '/dashboard/organization-documents' },
          { icon: MapPin, label: 'تتبع السائقين', path: '/dashboard/driver-tracking' },
          { icon: Truck, label: 'خريطة السائقين', path: '/dashboard/admin-drivers-map' },
          { icon: FolderCheck, label: 'شهادات إعادة التدوير', path: '/dashboard/recycling-certificates' },
          { icon: Video, label: 'إنشاء فيديوهات ترويجية', path: '/dashboard/video-generator' },
        ]
      : []),
    { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports' },
    { icon: FileText, label: 'تقارير الشحنات', path: '/dashboard/shipment-reports' },
    { icon: ClipboardList, label: 'التقرير المجمع', path: '/dashboard/aggregate-report' },
    { icon: FileSpreadsheet, label: 'سجل المخلفات الغير خطرة', path: '/dashboard/non-hazardous-register' },
    { icon: AlertTriangle, label: 'سجل المخلفات الخطرة', path: '/dashboard/hazardous-register' },
    { icon: Layers, label: 'تصنيف أنواع المخلفات', path: '/dashboard/waste-types' },
    { icon: Send, label: 'طلباتي', path: '/dashboard/my-requests' },
    { icon: Scale, label: 'سجل جهاز التنظيم', path: '/dashboard/regulatory-updates' },
    { icon: ClipboardList, label: 'الخطط التشغيلية', path: '/dashboard/operational-plans' },
    { icon: MessageCircle, label: 'المحادثات', path: '/dashboard/chat' },
    { icon: Bell, label: 'الإشعارات', path: '/dashboard/notifications', badge: notificationCount },
    { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
  ];

  // Use driver menu if user is a driver (not admin)
  const menuItems = isDriver && !isAdmin ? driverMenuItems : fullMenuItems;

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!sidebarSearch.trim()) return menuItems;
    const searchLower = sidebarSearch.toLowerCase();
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.path.toLowerCase().includes(searchLower)
    );
  }, [menuItems, sidebarSearch]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-row-reverse" dir="rtl">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 80 }}
          className="hidden lg:flex flex-col bg-card border-l border-border shadow-sm fixed right-0 top-0 h-screen z-50"
        >
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-3">
              <motion.img 
                src={logo} 
                alt="آي ريسايكل" 
                className="h-10 w-10 object-contain"
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
                    <h1 className="text-lg font-bold text-gradient-eco whitespace-nowrap">
                      آي ريسايكل
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
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
              filteredMenuItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isCollapsed={!isSidebarOpen}
                  badge={'badge' in item ? (item.badge as number) : undefined}
                />
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                لا توجد نتائج
              </div>
            )}
          </nav>

          {/* Toggle button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full hover:bg-muted/80"
            >
              <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                <ChevronDown className="w-5 h-5 rotate-90" />
              </motion.div>
            </Button>
          </div>
        </motion.aside>

        {/* Main content - Desktop with sidebar margin */}
        <div 
          className="flex-1 flex flex-col transition-[margin] duration-200"
          style={{ 
            marginRight: isDesktop ? (isSidebarOpen ? 280 : 80) : 0 
          }}
        >
          {/* Top header */}
          <header className="sticky top-0 z-40 h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
              aria-label="فتح القائمة"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <img src={logo} alt="آي ريسايكل" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
              <span className="font-bold text-gradient-eco text-sm sm:text-base">آي ريسايكل</span>
            </div>

            {/* Command Palette - Desktop */}
            <div className="hidden lg:block flex-1 max-w-md mx-4">
              <CommandPalette />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* Focus Music Player - Hidden on very small screens */}
              <div className="hidden sm:block">
                <FocusMusicPlayer />
              </div>

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
                    filteredMenuItems.map((item) => (
                      <div key={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                        <SidebarNavItem
                          icon={item.icon}
                          label={item.label}
                          path={item.path}
                          isCollapsed={false}
                          badge={'badge' in item ? (item.badge as number) : undefined}
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

          {/* Page content */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            <DashboardBreadcrumb />
            {children}
          </main>

          {/* Floating Create Shipment Button for Transporters/Drivers */}
          {(isTransporter || isDriver) && (
            <motion.button
              onClick={() => navigate('/dashboard/shipments/new')}
              className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center touch-manipulation"
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px hsl(142, 71%, 45%, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              title="إنشاء شحنة جديدة"
            >
              <Plus size={22} className="sm:w-6 sm:h-6" />
            </motion.button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardLayout;

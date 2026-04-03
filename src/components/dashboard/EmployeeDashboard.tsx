import { useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import StoryCircles from '@/components/stories/StoryCircles';
import {
  User, Package, DollarSign, FileText, Truck, Users,
  Settings, ShieldCheck, BarChart3, Eye, ClipboardList,
  Loader2, Building2, CalendarDays
} from 'lucide-react';
import PermissionGate from '@/components/common/PermissionGate';
import EmployeeKPICards from './employee/EmployeeKPICards';
import EmployeeLeaveWidget from './employee/EmployeeLeaveWidget';
import EmployeeNotificationsWidget from './employee/EmployeeNotificationsWidget';
import EmployeeContextWidgets from './employee/EmployeeContextWidgets';
import EmployeeWelcomeStrip from './employee/EmployeeWelcomeStrip';

// Lazy load heavy tab content
const PendingApprovalsWidget = lazy(() => import('@/components/shipments/PendingApprovalsWidget'));
const UnifiedDocumentSearch = lazy(() => import('@/components/verification/UnifiedDocumentSearch'));
const DriverCodeLookup = lazy(() => import('@/components/drivers/DriverCodeLookup'));


const TabFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
  </div>
);

const orgTypeLabels: Record<string, string> = {
  generator: 'مُولّد نفايات',
  transporter: 'شركة نقل',
  recycler: 'شركة تدوير',
  disposal: 'جهة تخلص نهائي',
  transport_office: 'مكتب نقل',
  consultant: 'استشاري بيئي',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة أيزو',
};

const EmployeeDashboard = () => {
  const { profile, organization, roles } = useAuth();
  const { hasPermission, hasAnyPermission, permissions, isLoading: permsLoading } = useMyPermissions();
  const { data: stats, isLoading: statsLoading } = useEmployeeDashboardData();
  const navigate = useNavigate();
  const orgType = organization?.organization_type as string || '';

  // Build available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs: { id: string; label: string; icon: React.ElementType }[] = [
      { id: 'overview', label: 'نظرة عامة', icon: Eye },
    ];

    if (hasAnyPermission('view_shipments', 'create_shipments', 'manage_shipments')) {
      tabs.push({ id: 'shipments', label: 'الشحنات', icon: Package });
    }
    if (hasAnyPermission('view_deposits', 'create_deposits', 'manage_deposits')) {
      tabs.push({ id: 'deposits', label: 'الإيداعات', icon: DollarSign });
    }
    if (hasAnyPermission('view_accounts', 'view_account_details')) {
      tabs.push({ id: 'accounts', label: 'الحسابات', icon: BarChart3 });
    }
    if (hasAnyPermission('view_partners', 'manage_partners')) {
      tabs.push({ id: 'partners', label: 'الجهات المرتبطة', icon: Users });
    }
    if (hasAnyPermission('view_drivers', 'manage_drivers')) {
      tabs.push({ id: 'drivers', label: 'السائقين', icon: Truck });
    }
    if (hasAnyPermission('view_reports', 'create_reports', 'export_reports')) {
      tabs.push({ id: 'reports', label: 'التقارير', icon: FileText });
    }
    // Always show leave tab
    tabs.push({ id: 'leave', label: 'الإجازات', icon: CalendarDays });
    if (hasPermission('view_settings')) {
      tabs.push({ id: 'settings', label: 'الإعدادات', icon: Settings });
    }

    return tabs;
  }, [hasPermission, hasAnyPermission, permissions]);

  if (permsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <StoryCircles />

      {/* Welcome Strip */}
      <EmployeeWelcomeStrip
        employeeName={profile?.full_name || 'موظف'}
        permissionsCount={permissions.length}
      />

      {/* Employee Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              مرحباً، {profile?.full_name || 'موظف'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span>{organization?.name}</span>
              {orgType && (
                <Badge variant="secondary" className="text-xs">
                  {orgTypeLabels[orgType] || orgType}
                </Badge>
              )}
              {stats?.erpEmployee && (
                <>
                  <span className="text-xs">•</span>
                  <span className="text-xs">{stats.erpEmployee.job_title || stats.erpEmployee.department}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {stats?.erpEmployee?.employee_number && (
            <Badge variant="outline" className="gap-1 text-xs">
              رقم: {stats.erpEmployee.employee_number}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            {permissions.length === 0 ? 'بدون صلاحيات' : `${permissions.length} صلاحية`}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && <EmployeeKPICards stats={stats} orgType={orgType} />}

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs sm:text-sm">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Context-aware quick actions */}
          <EmployeeContextWidgets orgType={orgType} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leave Balances */}
            {stats && <EmployeeLeaveWidget balances={stats.leaveBalances} />}

            {/* Notifications */}
            {stats && <EmployeeNotificationsWidget notifications={stats.recentNotifications} />}
          </div>

          {/* Pending Approvals */}
          <PermissionGate permissions={['view_shipments', 'manage_shipments']}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4" />
                  الموافقات المعلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TabFallback />}>
                  <PendingApprovalsWidget />
                </Suspense>
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Document Search */}
          <Suspense fallback={<TabFallback />}>
            <UnifiedDocumentSearch />
          </Suspense>

          {/* Driver Lookup (for transport-related orgs) */}
          <PermissionGate permissions={['view_drivers']}>
            <Suspense fallback={<TabFallback />}>
              <DriverCodeLookup />
            </Suspense>
          </PermissionGate>
        </TabsContent>

        {/* Shipments Tab */}
        <PermissionGate permissions={['view_shipments']}>
          <TabsContent value="shipments" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">إدارة الشحنات</h3>
              <PermissionGate permissions={['create_shipments']}>
                <Button size="sm" onClick={() => navigate('/dashboard/shipments/new')}>
                  شحنة جديدة
                </Button>
              </PermissionGate>
            </div>
            <Suspense fallback={<TabFallback />}>
              <PendingApprovalsWidget />
            </Suspense>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/shipments')}>
              عرض كل الشحنات
            </Button>
          </TabsContent>
        </PermissionGate>

        {/* Deposits Tab */}
        <PermissionGate permissions={['view_deposits']}>
          <TabsContent value="deposits" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">الإيداعات والمعاملات المالية</h3>
              <PermissionGate permissions={['create_deposits']}>
                <Button size="sm" onClick={() => navigate('/dashboard/deposits/new')}>
                  إيداع جديد
                </Button>
              </PermissionGate>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/deposits')}>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">كل الإيداعات</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/accounts')}>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">كشف الحساب</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </PermissionGate>

        {/* Accounts Tab */}
        <PermissionGate permissions={['view_accounts']}>
          <TabsContent value="accounts" className="mt-4">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/accounts')}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">الحسابات والتقارير المالية</h3>
                <p className="text-sm text-muted-foreground mb-3">عرض كشوف الحسابات والأرصدة</p>
                <Button>فتح الحسابات</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </PermissionGate>

        {/* Partners Tab */}
        <PermissionGate permissions={['view_partners']}>
          <TabsContent value="partners" className="mt-4">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/partners')}>
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">الجهات المرتبطة</h3>
                <p className="text-sm text-muted-foreground mb-3">عرض وإدارة الشركاء والجهات</p>
                <Button>فتح الجهات المرتبطة</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </PermissionGate>

        {/* Drivers Tab */}
        <PermissionGate permissions={['view_drivers']}>
          <TabsContent value="drivers" className="mt-4 space-y-4">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/fleet')}>
              <CardContent className="p-6 text-center">
                <Truck className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">إدارة السائقين والأسطول</h3>
                <p className="text-sm text-muted-foreground mb-3">متابعة السائقين والمركبات</p>
                <Button>فتح الأسطول</Button>
              </CardContent>
            </Card>
            <Suspense fallback={<TabFallback />}>
              <DriverCodeLookup />
            </Suspense>
          </TabsContent>
        </PermissionGate>

        {/* Reports Tab */}
        <PermissionGate permissions={['view_reports']}>
          <TabsContent value="reports" className="mt-4">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/reports')}>
              <CardContent className="p-6 text-center">
                <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">التقارير</h3>
                <p className="text-sm text-muted-foreground mb-3">عرض وتصدير التقارير</p>
                <Button>فتح التقارير</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </PermissionGate>

        {/* Leave Tab - always visible */}
        <TabsContent value="leave" className="mt-4 space-y-4">
          {stats && <EmployeeLeaveWidget balances={stats.leaveBalances} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/hr/leave-requests')}>
              <CardContent className="p-4 text-center">
                <CalendarDays className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">طلبات الإجازة</p>
                {(stats?.pendingLeaveRequests || 0) > 0 && (
                  <Badge variant="secondary" className="mt-1">{stats?.pendingLeaveRequests} معلقة</Badge>
                )}
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/hr/attendance')}>
              <CardContent className="p-4 text-center">
                <ClipboardList className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">سجل الحضور</p>
                <p className="text-xs text-muted-foreground mt-1">{stats?.monthAttendanceDays || 0} يوم هذا الشهر</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <PermissionGate permissions={['view_settings']}>
          <TabsContent value="settings" className="mt-4">
            <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/settings')}>
              <CardContent className="p-6 text-center">
                <Settings className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">إعدادات المنظمة</h3>
                <p className="text-sm text-muted-foreground mb-3">إدارة إعدادات وتفضيلات الجهة</p>
                <Button>فتح الإعدادات</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </PermissionGate>
      </Tabs>

      {/* No permissions message */}
      {permissions.length === 0 && !permsLoading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">لم يتم تعيين صلاحيات بعد</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              تواصل مع مدير المنظمة لتعيين صلاحياتك. بمجرد تعيين الصلاحيات ستظهر لك الأدوات والبيانات المتاحة.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default EmployeeDashboard;

import { useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import StoryCircles from '@/components/stories/StoryCircles';
import {
  User, Package, DollarSign, FileText, Truck, Users,
  Settings, ShieldCheck, BarChart3, Eye, ClipboardList,
  Loader2, Building2
} from 'lucide-react';
import PermissionGate from '@/components/common/PermissionGate';

// Lazy load tab content
const ShipmentCard = lazy(() => import('@/components/shipments/ShipmentCard'));
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
  const navigate = useNavigate();
  const orgType = organization?.organization_type as string | undefined;

  // Build available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs: { id: string; label: string; icon: React.ElementType; permission?: string[] }[] = [
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
    if (hasPermission('view_settings')) {
      tabs.push({ id: 'settings', label: 'الإعدادات', icon: Settings });
    }

    return tabs;
  }, [hasPermission, hasAnyPermission, permissions]);

  if (permsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <StoryCircles />

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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            {permissions.length === 0 ? 'بدون صلاحيات محددة' : `${permissions.length} صلاحية`}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PermissionGate permissions={['view_shipments']}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/shipments')}>
            <CardContent className="p-4 text-center">
              <Package className="w-7 h-7 text-primary mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">الشحنات</p>
              <p className="text-sm font-medium mt-1">عرض ومتابعة</p>
            </CardContent>
          </Card>
        </PermissionGate>
        <PermissionGate permissions={['view_deposits']}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/deposits')}>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-7 h-7 text-primary mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">الإيداعات</p>
              <p className="text-sm font-medium mt-1">إدارة مالية</p>
            </CardContent>
          </Card>
        </PermissionGate>
        <PermissionGate permissions={['view_reports']}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/reports')}>
            <CardContent className="p-4 text-center">
              <FileText className="w-7 h-7 text-primary mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">التقارير</p>
              <p className="text-sm font-medium mt-1">عرض وتصدير</p>
            </CardContent>
          </Card>
        </PermissionGate>
        <PermissionGate permissions={['view_partners']}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/partners')}>
            <CardContent className="p-4 text-center">
              <Users className="w-7 h-7 text-primary mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">الشركاء</p>
              <p className="text-sm font-medium mt-1">الجهات المرتبطة</p>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>

      {/* Tabbed Content */}
      {availableTabs.length > 1 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
            {availableTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs sm:text-sm">
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  ملخص المهام
                </CardTitle>
                <CardDescription>المهام والإشعارات المخصصة لك</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TabFallback />}>
                  <PendingApprovalsWidget />
                </Suspense>
              </CardContent>
            </Card>

            <Suspense fallback={<TabFallback />}>
              <UnifiedDocumentSearch />
            </Suspense>

            <PermissionGate permissions={['view_drivers']}>
              <Suspense fallback={<TabFallback />}>
                <DriverCodeLookup />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          <PermissionGate permissions={['view_shipments']}>
            <TabsContent value="shipments" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">إدارة الشحنات</h3>
                <PermissionGate permissions={['create_shipments']}>
                  <Button size="sm" onClick={() => navigate('/dashboard/shipments')}>
                    عرض الكل
                  </Button>
                </PermissionGate>
              </div>
              <Suspense fallback={<TabFallback />}>
                <PendingApprovalsWidget />
              </Suspense>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_deposits']}>
            <TabsContent value="deposits" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">لإدارة الإيداعات والمعاملات المالية</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/deposits')}>
                    الذهاب للإيداعات
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_accounts']}>
            <TabsContent value="accounts" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">لعرض الحسابات والتقارير المالية</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/accounts')}>
                    الذهاب للحسابات
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_partners']}>
            <TabsContent value="partners" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">عرض وإدارة الجهات المرتبطة بالمنظمة</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/partners')}>
                    الذهاب للشركاء
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_drivers']}>
            <TabsContent value="drivers" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">إدارة السائقين والمركبات</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/fleet')}>
                    إدارة الأسطول
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_reports']}>
            <TabsContent value="reports" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">عرض وتصدير التقارير</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/reports')}>
                    الذهاب للتقارير
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>

          <PermissionGate permissions={['view_settings']}>
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">إعدادات المنظمة</p>
                  <Button className="mt-3" onClick={() => navigate('/dashboard/settings')}>
                    الذهاب للإعدادات
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGate>
        </Tabs>
      )}

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

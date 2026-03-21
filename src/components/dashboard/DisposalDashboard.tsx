import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useRealWeather } from '@/hooks/useRealWeather';
import { Factory, Package, Clock, CheckCircle, TrendingUp, Shield, Eye, AlertCircle, Truck, BarChart3, FileText, Leaf, HardHat, Scale, ClipboardList, Building2, Route, CheckCircle2 } from 'lucide-react';
import StoryCircles from '@/components/stories/StoryCircles';
import SmartDailyBrief from './shared/SmartDailyBrief';
import DashboardWidgetCustomizer from './DashboardWidgetCustomizer';
import { DISPOSAL_TAB_BINDINGS } from '@/config/disposal/disposalBindings';
import V2TabsNav, { TabItem } from '@/components/dashboard/shared/V2TabsNav';
import DashboardV2Header from './shared/DashboardV2Header';

const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const OrgPerformanceRadar = lazy(() => import('./shared/OrgPerformanceRadar'));
const EnvironmentalKPIWidget = lazy(() => import('./shared/EnvironmentalKPIWidget'));
const LicenseExpiryWidget = lazy(() => import('./shared/LicenseExpiryWidget'));

const RegulatoryDocumentsCenter = lazy(() => import('@/components/regulatory/RegulatoryDocumentsCenter'));
const DisposalAnnualPlan = lazy(() => import('@/components/disposal/DisposalAnnualPlan'));

import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useOperationalAlerts } from '@/hooks/useOperationalAlerts';
import { Skeleton } from '@/components/ui/skeleton';
const CommunicationHubWidget = lazy(() => import('./widgets/CommunicationHubWidget'));

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FacilityDashboardHeader from '@/components/dashboard/shared/FacilityDashboardHeader';
import FacilityCapacityCard from '@/components/dashboard/shared/FacilityCapacityCard';
import StatsCardsGrid, { StatCardItem } from '@/components/dashboard/shared/StatsCardsGrid';
import DisposalIncomingPanel from '@/components/dashboard/disposal/DisposalIncomingPanel';
import DisposalDailyOperations from '@/components/dashboard/disposal/DisposalDailyOperations';
import DisposalRecentOperations from '@/components/dashboard/disposal/DisposalRecentOperations';
import DashboardAlertsHub from '@/components/dashboard/shared/DashboardAlertsHub';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import LegalComplianceWidget from '@/components/dashboard/generator/LegalComplianceWidget';
import VehicleComplianceManager from '@/components/compliance/VehicleComplianceManager';
import DriverComplianceManager from '@/components/compliance/DriverComplianceManager';
import IncidentReportManager from '@/components/compliance/IncidentReportManager';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';


interface DisposalDashboardProps {
  embedded?: boolean;
}

interface RecentShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  driver_id: string | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
}

const DisposalDashboard = ({ embedded = false }: DisposalDashboardProps) => {
  const { profile, organization } = useAuth();
  const realWeather = useRealWeather();
  const navigate = useNavigate();
  const { data: operationalAlerts = [] } = useOperationalAlerts();
  const handleAlertClick = useCallback((alert: any) => { if (alert.route) navigate(alert.route); }, [navigate]);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.from('disposal_facilities').select('*').eq('organization_id', organization.id).maybeSingle();
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: operationsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['disposal-operations-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.from('disposal_operations').select('status, quantity').eq('organization_id', organization.id);
      return {
        total: data?.length || 0,
        pending: data?.filter(o => o.status === 'pending').length || 0,
        processing: data?.filter(o => o.status === 'processing').length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0,
        totalQuantity: data?.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0) || 0
      };
    },
    enabled: !!organization?.id
  });

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['disposal-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, driver_id,
          generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, representative_name),
          transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, representative_name),
          recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, representative_name),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (shipments || []) as unknown as RecentShipment[];
    },
    enabled: !!organization?.id
  });

  const recentShipments = shipmentsData || [];

  // Realtime subscription
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('disposal-ops-realtime'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disposal_operations', filter: `organization_id=eq.${organization.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['disposal-operations-stats'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-recent-operations'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-daily-operations'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-processing-ops'] });
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disposal_incoming_requests' },
        () => { queryClient.invalidateQueries({ queryKey: ['disposal-incoming-pending'] }); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `recycler_id=eq.${organization.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ['disposal-shipments'] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['disposal-operations-stats'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-facility'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-recent-operations'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-daily-operations'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-shipments'] });
  };

  const statsCards: StatCardItem[] = [
    { title: 'إجمالي العمليات', value: operationsStats?.total || 0, icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'شحنات واردة', value: recentShipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length, icon: Truck, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'قيد المعالجة', value: operationsStats?.processing || 0, icon: Clock, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'مكتملة', value: operationsStats?.completed || 0, icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'إجمالي الكميات', value: operationsStats?.totalQuantity?.toFixed(1) || '0', subtitle: 'طن', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  ];

  const quickActions = useQuickActions({ type: 'disposal', handlers: {
    openDepositDialog: () => setShowDepositDialog(true),
    openSmartWeightUpload: () => setShowSmartWeightUpload(true),
  }});

  return (
    <div className="space-y-6" dir="rtl">
      <SmartDailyBrief
        role="disposal"
        stats={{
          pending: operationsStats?.pending || 0,
          active: operationsStats?.processing || 0,
          completed: operationsStats?.completed || 0,
          total: operationsStats?.total || 0,
        }}
      />
      <StoryCircles />

      <DashboardV2Header
        userName={profile?.full_name || ''}
        orgName={organization?.name || ''}
        orgLabel="جهة التخلص النهائي"
        icon={Factory}
        gradient="from-destructive to-primary"
        onRefresh={handleRefresh}
        radarStats={(() => {
          const total = operationsStats?.total || 0;
          const incoming = recentShipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length;
          const processing = operationsStats?.processing || 0;
          const completed = operationsStats?.completed || 0;
          const qty = Math.round(operationsStats?.totalQuantity || 0);
          return [
            { label: 'إجمالي العمليات', value: total, icon: Package, color: 'text-primary', max: total || 1, trend: 'up' as const },
            { label: 'شحنات واردة', value: incoming, icon: Truck, color: 'text-amber-500', max: Math.max(total, 1), trend: 'up' as const },
            { label: 'قيد المعالجة', value: processing, icon: Clock, color: 'text-violet-500', max: Math.max(total, 1), trend: 'stable' as const },
            { label: 'مكتملة', value: completed, icon: CheckCircle2, color: 'text-emerald-500', max: Math.max(total, 1), trend: 'up' as const },
            { label: 'الكميات (طن)', value: qty, icon: Scale, color: 'text-primary', max: qty || 1, trend: 'up' as const },
            { label: 'المنشأة', value: facility ? 1 : 0, icon: Factory, color: 'text-destructive', max: 1, trend: 'stable' as const },
          ];
        })()}
        alerts={operationalAlerts}
        onAlertClick={handleAlertClick}
        weather={{
          temp: realWeather.temp,
          condition: realWeather.condition,
          conditionLabel: realWeather.conditionLabel,
          humidity: realWeather.humidity,
          windSpeed: realWeather.windSpeed,
          roadWarning: realWeather.roadWarning,
          feelsLike: realWeather.feelsLike,
          uvIndex: realWeather.uvIndex,
          precipProb: realWeather.precipProb,
          pressure: realWeather.pressure,
          locationName: realWeather.locationName,
          hourlyForecast: realWeather.hourlyForecast,
          isLoading: realWeather.isLoading,
          refreshFromGPS: realWeather.refreshFromGPS,
          isLocating: realWeather.isLocating,
        }}
        heatmapData={[
          { region: 'القاهرة', value: operationsStats?.processing || 0, max: 10 },
          { region: 'الجيزة', value: Math.round((operationsStats?.total || 0) * 0.25), max: 8 },
          { region: 'الإسكندرية', value: Math.round((operationsStats?.total || 0) * 0.2), max: 8 },
          { region: 'الدلتا', value: Math.round((operationsStats?.total || 0) * 0.15), max: 6 },
          { region: 'الصعيد', value: Math.round((operationsStats?.total || 0) * 0.1), max: 5 },
        ]}
      >
        <DashboardWidgetCustomizer orgType="disposal" />
        <Button
          variant="default"
          size="sm"
          className="gap-2 rounded-xl shadow-sm bg-gradient-to-r from-destructive to-primary border-0"
          onClick={() => navigate('/dashboard/disposal/mission-control')}
        >
          <Shield className="w-4 h-4" />
          مركز القيادة
        </Button>
        <Button onClick={() => setShowSmartWeightUpload(true)} variant="outline" size="sm" className="gap-2 rounded-xl">
          <Eye className="w-4 h-4" />
        </Button>
      </DashboardV2Header>


      <Suspense fallback={null}><CommunicationHubWidget /></Suspense>

      {facility && <FacilityCapacityCard facility={facility} />}
      <StatsCardsGrid stats={statsCards} isLoading={statsLoading} />
      <DashboardWidgetCustomizer orgType="disposal" />
      <AutomationSettingsDialog organizationType="disposal" />

      {/* Main Tabs — 6 optimized tabs */}
      <Tabs defaultValue="operations" className="w-full">
        <V2TabsNav tabs={[
          { value: 'operations', label: 'العمليات', icon: Package, bindingType: DISPOSAL_TAB_BINDINGS['operations']?.type },
          { value: 'shipments', label: 'الشحنات الواردة', icon: Truck, bindingType: DISPOSAL_TAB_BINDINGS['shipments']?.type },
          { value: 'compliance', label: 'الامتثال والسلامة', icon: Shield, bindingType: DISPOSAL_TAB_BINDINGS['compliance']?.type },
          { value: 'regulatory', label: 'المستندات التنظيمية', icon: Scale, bindingType: DISPOSAL_TAB_BINDINGS['regulatory']?.type },
          { value: 'fleet', label: 'الأسطول', icon: Truck, bindingType: DISPOSAL_TAB_BINDINGS['fleet']?.type },
          { value: 'reports', label: 'التقارير', icon: BarChart3, bindingType: DISPOSAL_TAB_BINDINGS['reports']?.type },
          { value: 'annual_plan', label: 'الخطة السنوية', icon: ClipboardList, bindingType: DISPOSAL_TAB_BINDINGS['annual_plan']?.type },
        ] as TabItem[]} />

        {/* 1. Operations Tab */}
        <TabsContent value="operations" className="mt-4 space-y-4">
          {/* Environmental KPIs & License Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <ErrorBoundary fallbackTitle="خطأ في مؤشرات البيئة">
                <EnvironmentalKPIWidget />
              </ErrorBoundary>
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <ErrorBoundary fallbackTitle="خطأ في تنبيهات التراخيص">
                <LicenseExpiryWidget />
              </ErrorBoundary>
            </Suspense>
          </div>

          <DisposalDailyOperations />
          <DashboardAlertsHub orgType="disposal" />

          <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <OrgPerformanceRadar />
            </Suspense>
          </ErrorBoundary>

          <DisposalIncomingPanel facilityId={facility?.id} />
          <PendingApprovalsWidget />
          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="وظائف التخلص النهائي"
          />
          <DisposalRecentOperations />
        </TabsContent>

        {/* 2. Incoming Shipments Tab */}
        <TabsContent value="shipments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <BulkCertificateButton
                    shipments={recentShipments.map(s => ({
                      id: s.id, shipment_number: s.shipment_number, status: s.status,
                      created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                      unit: s.unit, delivered_at: s.delivered_at, confirmed_at: s.confirmed_at,
                      has_report: s.has_report,
                      generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                      transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                      recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                    }))}
                    type="certificate"
                    onSuccess={handleRefresh}
                  />
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                    <Eye className="ml-2 h-4 w-4" />
                    عرض الكل
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Factory className="w-5 h-5" />
                    الشحنات الواردة للتخلص
                  </CardTitle>
                  <CardDescription>آخر 10 شحنات واردة إلى منشأة التخلص النهائي</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shipmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد شحنات واردة حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <ShipmentCard key={shipment.id} shipment={shipment} onStatusChange={handleRefresh} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Compliance & Safety Tab */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          <ErrorBoundary fallbackTitle="خطأ في بيانات الامتثال">
            <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
              {organization?.id && <LicensedWasteTypesEditor organizationId={organization.id} />}
              <WMISEventsFeed />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في الامتثال القانوني">
            <LegalComplianceWidget />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في تقارير الحوادث">
            <IncidentReportManager />
          </ErrorBoundary>
          
          {/* Safety & OHS Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <HardHat className="w-5 h-5 text-accent-foreground" />
                السلامة والصحة المهنية
              </CardTitle>
              <CardDescription>تقييم المخاطر والتفتيشات الميدانية لمرفق التخلص</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard/safety')}>
                <HardHat className="w-4 h-4" />
                فتح لوحة السلامة الكاملة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Regulatory Documents Tab */}
        <TabsContent value="regulatory" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <RegulatoryDocumentsCenter />
          </Suspense>
          <UnifiedDocumentSearch />
        </TabsContent>

        {/* 5. Fleet Tab */}
        <TabsContent value="fleet" className="mt-4 space-y-4">
          <ErrorBoundary fallbackTitle="خطأ في امتثال المركبات">
            <VehicleComplianceManager />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في امتثال السائقين">
            <DriverComplianceManager />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في بحث السائقين">
            <DriverCodeLookup />
          </ErrorBoundary>
        </TabsContent>

        {/* 6. Reports Tab (ESG + Performance) */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <ESGReportPanel />
          </Suspense>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 gap-3" onClick={() => navigate('/dashboard/disposal/reports')}>
              <BarChart3 className="w-6 h-6 text-primary" />
              <div className="text-right">
                <p className="font-semibold">تقارير التخلص</p>
                <p className="text-xs text-muted-foreground">تقارير الأداء والعمليات</p>
              </div>
            </Button>
            <Button variant="outline" className="h-20 gap-3" onClick={() => navigate('/dashboard/environmental-sustainability')}>
              <Leaf className="w-6 h-6 text-primary" />
              <div className="text-right">
                <p className="font-semibold">تقارير الاستدامة</p>
                <p className="text-xs text-muted-foreground">تحليل الأداء البيئي</p>
              </div>
            </Button>
          </div>
        </TabsContent>

        {/* 7. Annual Plan Tab */}
        <TabsContent value="annual_plan" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <DisposalAnnualPlan />
          </Suspense>
        </TabsContent>
      </Tabs>

      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
    </div>
  );
};

export default DisposalDashboard;

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useRealWeather } from '@/hooks/useRealWeather';
import StoryCircles from '@/components/stories/StoryCircles';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { GENERATOR_TAB_BINDINGS } from '@/config/generator/generatorBindings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Eye, FileCheck, Sparkles, ClipboardList, Printer, MapPin, Building2, Route, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import InteractiveStatCard from './shared/InteractiveStatCard';
import { DetailSection } from './shared/InteractiveDetailDrawer';
import DashboardV2Header from './shared/DashboardV2Header';
import V2TabsNav, { TabItem } from './shared/V2TabsNav';
import UnifiedShipmentPrint from '@/components/shipments/unified-print/UnifiedShipmentPrint';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useOperationalAlerts } from '@/hooks/useOperationalAlerts';
import GeneratorCommandCenter from './generator/GeneratorCommandCenter';
import ConnectedSmartBrief from './shared/ConnectedSmartBrief';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import DashboardAlertsHub from './shared/DashboardAlertsHub';
import DocumentVerificationWidget from './DocumentVerificationWidget';

import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import DashboardPrintReports from './shared/DashboardPrintReports';
import DashboardWidgetCustomizer from './DashboardWidgetCustomizer';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy tab content
const CommunicationHubWidget = lazy(() => import('./widgets/CommunicationHubWidget'));

const GeneratorTrackingWidget = lazy(() => import('./generator/GeneratorTrackingWidget'));
const DisposalRadarWidget = lazy(() => import('./generator/DisposalRadarWidget'));
const ESGReportWidget = lazy(() => import('./generator/ESGReportWidget'));
const LegalArchiveWidget = lazy(() => import('./generator/LegalArchiveWidget'));
const LegalComplianceWidget = lazy(() => import('./generator/LegalComplianceWidget'));
const DashboardBrief = lazy(() => import('./generator/DashboardBrief'));
const WeeklyShipmentChart = lazy(() => import('./generator/WeeklyShipmentChart'));
const FinancialSummaryWidget = lazy(() => import('./generator/FinancialSummaryWidget'));
const ComplianceGauge = lazy(() => import('./generator/ComplianceGauge'));
const DriverCodeLookup = lazy(() => import('@/components/drivers/DriverCodeLookup'));
const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const BulkCertificateButton = lazy(() => import('@/components/bulk/BulkCertificateButton'));
const WorkOrderInbox = lazy(() => import('@/components/work-orders/WorkOrderInbox'));
const CreateWorkOrderDialog = lazy(() => import('@/components/work-orders/CreateWorkOrderDialog'));
const ComplianceCertificateWidget = lazy(() => import('@/components/compliance/ComplianceCertificateWidget'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ComplianceAlertsWidget = lazy(() => import('@/components/compliance/ComplianceAlertsWidget'));
const RiskMatrixWidget = lazy(() => import('@/components/compliance/RiskMatrixWidget'));
const CorrectiveActionsWidget = lazy(() => import('@/components/compliance/CorrectiveActionsWidget'));
const AuditPortalWidget = lazy(() => import('@/components/compliance/AuditPortalWidget'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const OrgPerformanceRadar = lazy(() => import('./shared/OrgPerformanceRadar'));
const EnvironmentalKPIWidget = lazy(() => import('./shared/EnvironmentalKPIWidget'));
const LicenseExpiryWidget = lazy(() => import('./shared/LicenseExpiryWidget'));

// Generator Intelligence Suite
const GeneratorSmartKPIs = lazy(() => import('./generator/GeneratorSmartKPIs'));
const WasteGenerationIntelligence = lazy(() => import('./generator/WasteGenerationIntelligence'));
const FinancialFlowAnalyzer = lazy(() => import('./generator/FinancialFlowAnalyzer'));
const WasteGenerationForecast = lazy(() => import('./generator/WasteGenerationForecast'));
const WasteClassificationAI = lazy(() => import('./generator/WasteClassificationAI'));
const SmartCollectionScheduler = lazy(() => import('./generator/SmartCollectionScheduler'));
const InstantPickupPortal = lazy(() => import('./generator/InstantPickupPortal'));
const EnvironmentalScorecard = lazy(() => import('./generator/EnvironmentalScorecard'));

// New tabs
const GeneratorFinanceTab = lazy(() => import('./generator/GeneratorFinanceTab'));
const GeneratorPartnersHub = lazy(() => import('./generator/GeneratorPartnersHub'));
const GeneratorReportsTab = lazy(() => import('./generator/GeneratorReportsTab'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

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
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
  has_receipt?: boolean;
  has_delivery_certificate?: boolean;
}

const GeneratorDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isMobile } = useDisplayMode();
  const realWeather = useRealWeather();
  const { data: operationalAlerts = [] } = useOperationalAlerts();
  const handleAlertClick = useCallback((alert: any) => { if (alert.route) navigate(alert.route); }, [navigate]);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);

  const { data: recentShipments = [], isLoading: loading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['generator-dashboard-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data: shipmentsRaw, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate,
          driver_id, generator_id, transporter_id, recycler_id
        `)
        .eq('generator_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!shipmentsRaw) return [];

      const orgIds = [...new Set([
        ...shipmentsRaw.map(s => s.transporter_id).filter(Boolean),
        ...shipmentsRaw.map(s => s.recycler_id).filter(Boolean),
        ...shipmentsRaw.map(s => s.generator_id).filter(Boolean),
      ])] as string[];

      const orgsMap: Record<string, any> = {};
      if (orgIds.length > 0) {
        const { data: orgsData } = await supabase.from('organizations').select('*').in('id', orgIds);
        orgsData?.forEach(o => { orgsMap[o.id] = o; });
      }

      const driverIds = [...new Set(shipmentsRaw.map(s => s.driver_id).filter(Boolean))] as string[];
      const driversMap: Record<string, any> = {};
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase.from('drivers').select('license_number, vehicle_type, vehicle_plate, id, profile:profiles(full_name, phone)').in('id', driverIds);
        driversData?.forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });
      }

      const shipments = shipmentsRaw.map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      }));

      const shipmentIds = shipments.map(s => s.id);
      const [reportsRes, receiptsRes, deliveryCertsRes] = await Promise.all([
        supabase.from('recycling_reports').select('shipment_id').in('shipment_id', shipmentIds),
        supabase.from('shipment_receipts').select('shipment_id').in('shipment_id', shipmentIds),
        supabase.from('shipment_receipts').select('shipment_id').in('shipment_id', shipmentIds).eq('generator_id', organization.id),
      ]);

      const reportedIds = new Set(reportsRes.data?.map(r => r.shipment_id) || []);
      const receiptIds = new Set(receiptsRes.data?.map(r => r.shipment_id) || []);
      const deliveryCertIds = new Set(deliveryCertsRes.data?.map(r => r.shipment_id) || []);

      return shipments.map(s => ({
        ...s,
        has_report: reportedIds.has(s.id),
        has_receipt: receiptIds.has(s.id),
        has_delivery_certificate: deliveryCertIds.has(s.id),
      })) as unknown as RecentShipment[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const handlePrintShipment = (shipment: RecentShipment) => {
    setSelectedShipment(shipment);
    setShowPrintDialog(true);
  };

  const quickActions = useQuickActions({
    type: 'generator',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
      openSmartWeightUpload: () => setShowSmartWeightUpload(true),
    },
  });

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* 1. الهيدر والهوية */}
      <ConnectedSmartBrief role="generator" />
      <StoryCircles />

      {/* V2.0 Header */}
      <DashboardV2Header
        userName={profile?.full_name || ''}
        orgName={organization?.name || ''}
        orgLabel={t('dashboard.orgTypes.generator')}
        icon={Package}
        gradient="from-primary to-primary/70"
        onRefresh={() => fetchDashboardData()}
        radarStats={(() => {
          const total = recentShipments.length;
          const active = recentShipments.filter(s => ['approved', 'in_transit', 'collecting'].includes(s.status)).length;
          const pending = recentShipments.filter(s => s.status === 'new').length;
          const completed = recentShipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
          const withReports = recentShipments.filter(s => s.has_report).length;
          const transporters = new Set(recentShipments.map(s => s.transporter?.name).filter(Boolean)).size;
          return [
            { label: 'إجمالي الشحنات', value: total, icon: Package, color: 'text-primary', max: total || 1, trend: 'up' as const },
            { label: 'نشطة', value: active, icon: Route, color: 'text-amber-500', max: Math.max(total, 1), trend: 'up' as const },
            { label: 'معلقة', value: pending, icon: Clock, color: 'text-amber-500', max: Math.max(total, 1), trend: 'down' as const },
            { label: 'مكتملة', value: completed, icon: CheckCircle2, color: 'text-emerald-500', max: Math.max(total, 1), trend: 'up' as const },
            { label: 'بتقارير', value: withReports, icon: FileCheck, color: 'text-violet-500', max: Math.max(total, 1), trend: 'stable' as const },
            { label: 'ناقلون', value: transporters, icon: Building2, color: 'text-primary', max: transporters || 1, trend: 'stable' as const },
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
          { region: 'القاهرة', value: recentShipments.filter(s => s.status === 'in_transit').length, max: 10 },
          { region: 'الجيزة', value: Math.round(recentShipments.length * 0.3), max: 10 },
          { region: 'الإسكندرية', value: Math.round(recentShipments.length * 0.2), max: 8 },
          { region: 'الدلتا', value: Math.round(recentShipments.length * 0.15), max: 6 },
          { region: 'الصعيد', value: Math.round(recentShipments.length * 0.1), max: 5 },
        ]}
      >
        <DashboardWidgetCustomizer orgType="generator" />
        <DashboardPrintReports />
        <Button onClick={() => setShowWorkOrder(true)} variant="default" size={isMobile ? 'sm' : 'default'} className="gap-2 rounded-xl shadow-sm">
          <ClipboardList className="w-4 h-4" />
          {!isMobile && t('workOrder.createNew')}
        </Button>
        <Button onClick={() => setShowDocumentVerification(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className="gap-2 rounded-xl">
          <FileCheck className="w-4 h-4" />
          {!isMobile && t('docVerify.sectionBadge')}
        </Button>
        <Button onClick={() => setShowSmartWeightUpload(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className="gap-2 rounded-xl">
          <Sparkles className="w-4 h-4" />
        </Button>
      </DashboardV2Header>

      {/* 2. مركز القيادة */}
      <GeneratorCommandCenter />

      {/* 3. الإجراءات السريعة */}
      <QuickActionsGrid
        actions={quickActions}
        title={t('dashboard.quickActions')}
        subtitle={t('dashboard.quickActionsSubtitle')}
      />

      {/* 4. ملخص العمليات اليومية */}
      <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
        <DailyOperationsSummary />
      </ErrorBoundary>

      {/* 5. التنبيهات والإشعارات */}
      <DashboardAlertsHub orgType="generator" />

      {/* 6. التواصل */}
      <Suspense fallback={null}>
        <CommunicationHubWidget />
      </Suspense>

      {/* 7. التوثيق والبحث */}
      <PendingApprovalsWidget />
      <UnifiedDocumentSearch />
      <AutomationSettingsDialog organizationType="generator" />

      {/* ★ Tabbed Sections — same pattern as Transporter */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <V2TabsNav tabs={[
          { value: 'overview', label: t('dashboard.tabs.overview'), icon: Package, bindingType: GENERATOR_TAB_BINDINGS['overview']?.type },
          { value: 'shipments', label: t('dashboard.tabs.shipments'), icon: Package, bindingType: GENERATOR_TAB_BINDINGS['shipments']?.type },
          { value: 'operations', label: t('dashboard.tabs.operations'), icon: Truck, bindingType: GENERATOR_TAB_BINDINGS['operations']?.type },
          { value: 'work-orders', label: t('dashboard.tabs.workOrders'), icon: ClipboardList, bindingType: GENERATOR_TAB_BINDINGS['work-orders']?.type },
          { value: 'partners', label: t('dashboard.tabs.partners'), icon: Eye, bindingType: GENERATOR_TAB_BINDINGS['partners']?.type },
          { value: 'compliance', label: t('dashboard.tabs.legalCompliance'), icon: FileCheck, bindingType: GENERATOR_TAB_BINDINGS['compliance']?.type },
          { value: 'geofence', label: t('dashboard.tabs.shipmentTracking'), icon: MapPin, bindingType: GENERATOR_TAB_BINDINGS['geofence']?.type },
        ] as TabItem[]} />

        {/* ── نظرة عامة ── */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Environmental KPIs & License Alerts */}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في مؤشرات البيئة">
                <EnvironmentalKPIWidget />
              </ErrorBoundary>
            </Suspense>
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في تنبيهات التراخيص">
                <LicenseExpiryWidget />
              </ErrorBoundary>
            </Suspense>
          </div>

          <Suspense fallback={<TabFallback />}>
            <DashboardBrief />
          </Suspense>

          <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
            <Suspense fallback={<TabFallback />}>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <WeeklyShipmentChart />
                <ComplianceGauge />
              </div>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
            <Suspense fallback={<TabFallback />}>
              <OrgPerformanceRadar />
            </Suspense>
          </ErrorBoundary>

          <QuickActionsGrid
            actions={quickActions}
            title={t('dashboard.quickActions')}
            subtitle={t('dashboard.quickActionsSubtitle')}
          />

          <ErrorBoundary fallbackTitle="خطأ في الملخص المالي">
            <Suspense fallback={<TabFallback />}>
              <FinancialSummaryWidget />
            </Suspense>
          </ErrorBoundary>

          {/* Generator Intelligence Suite */}
          <Suspense fallback={<TabFallback />}>
            <GeneratorSmartKPIs />
          </Suspense>

          <Suspense fallback={<TabFallback />}>
            <WasteGenerationIntelligence />
          </Suspense>

          <Suspense fallback={<TabFallback />}>
            <FinancialFlowAnalyzer />
          </Suspense>

          <Suspense fallback={<TabFallback />}>
            <InstantPickupPortal />
          </Suspense>

          <Suspense fallback={<TabFallback />}>
            <EnvironmentalScorecard />
          </Suspense>
        </TabsContent>

        {/* ── الشحنات ── */}
        <TabsContent value="shipments" className="space-y-4 mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Suspense fallback={null}>
                    <BulkCertificateButton
                      shipments={recentShipments.map(s => ({
                        id: s.id, shipment_number: s.shipment_number, status: s.status,
                        created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                        unit: s.unit, delivered_at: s.delivered_at, confirmed_at: s.confirmed_at,
                        has_report: s.has_report,
                        has_delivery_certificate: s.has_delivery_certificate,
                        generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                        transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                        recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                      }))}
                      type="delivery"
                      onSuccess={fetchDashboardData}
                    />
                  </Suspense>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                    <Eye className="ml-2 h-4 w-4" />
                    {t('dashboard.viewAll')}
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Package className="w-5 h-5" />
                    {t('dashboard.latestShipments')}
                  </CardTitle>
                  <CardDescription>{t('dashboard.last10Shipments')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t('dashboard.noShipmentsYet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentShipments.map((shipment) => (
                    <div key={shipment.id} className="group relative rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden">
                      <ShipmentCard shipment={shipment} onStatusChange={fetchDashboardData} />
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-t border-border/30">
                        <Button
                          variant="outline" size="sm"
                          className="text-xs h-7 gap-1.5 rounded-full px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handlePrintShipment(shipment); }}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          طباعة
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="text-xs h-7 gap-1.5 rounded-full px-3 hover:bg-secondary hover:text-secondary-foreground mr-auto transition-colors"
                          onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── العمليات ── */}
        <TabsContent value="operations" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في التتبع">
              <GeneratorTrackingWidget />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="خطأ في رادار التخلص">
              <DisposalRadarWidget />
            </ErrorBoundary>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <ErrorBoundary fallbackTitle="خطأ في ESG">
                <ESGReportWidget />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في البحث عن السائق">
                <DriverCodeLookup />
              </ErrorBoundary>
            </div>
          </Suspense>
        </TabsContent>

        {/* ── أوامر الشغل ── */}
        <TabsContent value="work-orders" className="space-y-4 mt-4 sm:mt-6">
          <ErrorBoundary fallbackTitle="خطأ في أوامر الشغل">
            <Suspense fallback={<TabFallback />}>
              <WorkOrderInbox />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        {/* ── الجهات المرتبطة ── */}
        <TabsContent value="partners" className="space-y-4 mt-4 sm:mt-6">
          <ErrorBoundary fallbackTitle="خطأ في تقييمات الشركاء">
            <Suspense fallback={<TabFallback />}>
              <PartnerRatingsWidget />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        {/* ── الامتثال القانوني ── */}
        <TabsContent value="compliance" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <ComplianceAlertsWidget />
            <ConsultantKPIsWidget />
            <ComplianceCertificateWidget />
            <RiskMatrixWidget />
            <CorrectiveActionsWidget />
            <AuditPortalWidget />
            <LegalComplianceWidget />
            <LegalArchiveWidget />
          </Suspense>
        </TabsContent>

        {/* ── تتبع الشحنات (جيوفنس) ── */}
        <TabsContent value="geofence" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <GeofenceAlertsPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UnifiedShipmentPrint isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
      <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
        <CreateWorkOrderDialog open={showWorkOrder} onOpenChange={setShowWorkOrder} />
      </Suspense>
    </div>
  );
};

export default GeneratorDashboard;

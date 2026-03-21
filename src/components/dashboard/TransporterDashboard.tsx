import { useState, Suspense, lazy, useMemo, useEffect } from 'react';
import { useRealWeather } from '@/hooks/useRealWeather';
import QuickActionsGrid from './QuickActionsGrid';
import { Tabs } from '@/components/ui/tabs';
import { useTransporterRealtime } from '@/hooks/useTransporterRealtime';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickActions } from '@/hooks/useQuickActions';
import {
  useTransporterShipmentsPaginated,
  useTransporterStatsDB,
  useTransporterKPIsDB,
} from '@/hooks/useTransporterPaginated';
import {
  useTransporterNotifications,
} from '@/hooks/useTransporterDashboard';
import {
  useTransporterFinancials,
  useDriversSummary,
} from '@/hooks/useTransporterExtended';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import TransporterHeader from './transporter/TransporterHeader';
import TransporterNotifications from './transporter/TransporterNotifications';
import TransporterSLAAlerts from './transporter/TransporterSLAAlerts';
import TransporterIncomingRequests from './transporter/TransporterIncomingRequests';
import UnifiedShipmentPrint from '@/components/shipments/unified-print/UnifiedShipmentPrint';
import ShipmentStatusDialog from '@/components/shipments/StatusChangeDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Brain, BarChart3, CalendarDays, Cpu, Handshake, MapPin, Shield, DollarSign, Navigation, Store, Wrench, AlertTriangle, ShieldAlert, Link2, Building2, Leaf, Wifi, HardHat, FileCheck, FileText, ClipboardList, Truck, Route, CheckCircle2, Users, Package, Clock } from 'lucide-react';
import { TRANSPORTER_TAB_BINDINGS } from '@/config/transporter/transporterBindings';
import DashboardV2Header from './shared/DashboardV2Header';
import V2TabsNav from './shared/V2TabsNav';

// ★ Lazy-load ALL heavy secondary components
const StoryCircles = lazy(() => import('@/components/stories/StoryCircles'));
const TransporterCommandCenter = lazy(() => import('./transporter/TransporterCommandCenter'));
const SmartDailyBrief = lazy(() => import('./shared/SmartDailyBrief'));
const TransporterDailyPulse = lazy(() => import('./transporter/TransporterDailyPulse'));
const CommunicationHubWidget = lazy(() => import('./widgets/CommunicationHubWidget'));
const DailyOperationsSummary = lazy(() => import('./operations/DailyOperationsSummary'));
const DashboardAlertsHub = lazy(() => import('./shared/DashboardAlertsHub'));
const DashboardWidgetCustomizer = lazy(() => import('./DashboardWidgetCustomizer'));
const DocumentVerificationWidget = lazy(() => import('./DocumentVerificationWidget'));
const AutomationSettingsDialog = lazy(() => import('@/components/automation/AutomationSettingsDialog'));
const UnifiedDocumentSearch = lazy(() => import('@/components/verification/UnifiedDocumentSearch'));
const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const TransporterOperationsTabs = lazy(() => import('./transporter/tabs/TransporterOperationsTabs'));
const TransporterIntelligenceTabs = lazy(() => import('./transporter/tabs/TransporterIntelligenceTabs'));
const TransporterComplianceTabs = lazy(() => import('./transporter/tabs/TransporterComplianceTabs'));

const tabKeys = [
  { value: 'overview', labelKey: 'dashboard.tabs.overview', icon: LayoutDashboard },
  { value: 'ai', labelKey: 'dashboard.tabs.ai', icon: Brain },
  { value: 'performance', labelKey: 'dashboard.tabs.performance', icon: BarChart3 },
  { value: 'copilot', labelKey: 'dashboard.tabs.copilot', icon: Navigation },
  { value: 'pricing', labelKey: 'dashboard.tabs.pricing', icon: DollarSign },
  { value: 'marketplace', labelKey: 'dashboard.tabs.marketplace', icon: Store },
  { value: 'fleet', labelKey: 'dashboard.tabs.fleet', icon: Wrench },
  { value: 'fraud', labelKey: 'dashboard.tabs.fraud', icon: AlertTriangle },
  { value: 'risk', labelKey: 'dashboard.tabs.risk', icon: ShieldAlert },
  { value: 'custody', labelKey: 'dashboard.tabs.custody', icon: Link2 },
  { value: 'government', labelKey: 'dashboard.tabs.government', icon: Building2 },
  { value: 'carbon', labelKey: 'dashboard.tabs.carbon', icon: Leaf },
  { value: 'iot', labelKey: 'dashboard.tabs.iot', icon: Wifi },
  { value: 'calendar', labelKey: 'dashboard.tabs.calendar', icon: CalendarDays },
  { value: 'intelligence', labelKey: 'dashboard.tabs.intelligence', icon: Cpu },
  { value: 'partners', labelKey: 'dashboard.tabs.partners', icon: Handshake },
  { value: 'tracking', labelKey: 'dashboard.tabs.tracking', icon: MapPin },
  { value: 'geofence', labelKey: 'dashboard.tabs.geofence', icon: AlertTriangle },
  { value: 'esg', labelKey: 'dashboard.tabs.esg', icon: Leaf },
  { value: 'compliance', labelKey: 'dashboard.tabs.compliance', icon: Shield },
  { value: 'wmis', labelKey: 'dashboard.tabs.wmis', icon: ShieldAlert },
  { value: 'licenses', labelKey: 'dashboard.tabs.licenses', icon: FileCheck },
  { value: 'declarations', labelKey: 'dashboard.tabs.declarations', icon: FileText },
  { value: 'annual_plan', labelKey: 'dashboard.tabs.annualPlan', icon: ClipboardList },
  { value: 'ohs', labelKey: 'dashboard.tabs.ohs', icon: HardHat },
];

const TransporterDashboard = () => {
  const { organization } = useAuth();
  const { t } = useLanguage();
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<TransporterShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusShipment, setStatusShipment] = useState<TransporterShipment | null>(null);
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string | undefined>();
  const [shipmentPage, setShipmentPage] = useState(1);
  const [shipmentSearch, setShipmentSearch] = useState('');

  const { data: paginatedResult, isLoading: shipmentsLoading, refetch: refetchShipments } = useTransporterShipmentsPaginated(shipmentPage, shipmentStatusFilter, shipmentSearch);
  const shipments = paginatedResult?.data || [];
  const { data: stats, isLoading: statsLoading } = useTransporterStatsDB();
  const { data: notifications = [] } = useTransporterNotifications();
  const { data: financials, isLoading: financialsLoading } = useTransporterFinancials();
  const { data: kpis, isLoading: kpisLoading } = useTransporterKPIsDB();
  const { data: driversSummary = [], isLoading: driversLoading } = useDriversSummary();

  const quickActions = useQuickActions({
    type: 'transporter',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
      openSmartWeightUpload: () => setShowSmartWeightUpload(true),
    },
  });

  useTransporterRealtime();
  const realWeather = useRealWeather();
  const handleRefresh = () => refetchShipments();

  // Build real heatmap from shipment locations
  const heatmapRegions = useMemo(() => {
    const regionMap: Record<string, number> = {};
    const locations = shipments.flatMap(s => [
      s.pickup_address, s.delivery_address,
      s.generator?.city, s.recycler?.city,
    ].filter(Boolean));
    
    const regionKeywords: Record<string, string[]> = {
      'القاهرة': ['القاهرة', 'cairo', 'مدينة نصر', 'المعادي', 'حلوان', 'شبرا', 'عين شمس'],
      'الجيزة': ['الجيزة', 'giza', '6 أكتوبر', 'الشيخ زايد', 'الهرم', 'فيصل'],
      'الإسكندرية': ['الإسكندرية', 'alexandria', 'اسكندرية', 'برج العرب'],
      'الدلتا': ['المنصورة', 'طنطا', 'الغربية', 'الدقهلية', 'كفر الشيخ', 'دمياط', 'المنوفية', 'القليوبية', 'الشرقية'],
      'الصعيد': ['المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'بني سويف'],
      'السويس والقناة': ['السويس', 'الإسماعيلية', 'بورسعيد', 'suez'],
      'البحر الأحمر': ['الغردقة', 'hurghada', 'البحر الأحمر', 'مرسى علم'],
    };

    for (const loc of locations) {
      let matched = false;
      const locLower = (loc as string).toLowerCase();
      for (const [region, keywords] of Object.entries(regionKeywords)) {
        if (keywords.some(kw => locLower.includes(kw.toLowerCase()))) {
          regionMap[region] = (regionMap[region] || 0) + 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        regionMap['أخرى'] = (regionMap['أخرى'] || 0) + 1;
      }
    }

    const entries = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (entries.length === 0) {
      return [{ region: 'لا توجد بيانات', value: 0, max: 1 }];
    }
    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    return entries.map(([region, value]) => ({ region, value, max: Math.ceil(maxVal * 1.2) }));
  }, [shipments]);

  // Defer secondary sections for faster initial paint
  const [showSecondary, setShowSecondary] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShowSecondary(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-3 sm:space-y-6">
      <Suspense fallback={null}>
        <SmartDailyBrief
          role="transporter"
          stats={{
            pending: shipments.filter(s => s.status === 'new').length,
            active: shipments.filter(s => ['approved', 'in_transit'].includes(s.status)).length,
            completed: shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length,
            total: shipments.length,
          }}
        />
      </Suspense>
      <Suspense fallback={null}><StoryCircles /></Suspense>
      <DashboardV2Header
        userName={organization?.name || ''}
        orgName={organization?.name || ''}
        orgLabel={t('dashboard.orgTypes.certifiedTransporter')}
        icon={Truck}
        gradient="from-primary to-primary/70"
        onRefresh={handleRefresh}
        radarStats={[
          { label: 'إجمالي الشحنات', value: stats?.total || 0, icon: Package, color: 'text-primary', max: Math.max(stats?.total || 1, 50), trend: 'up' as const },
          { label: 'نشطة', value: stats?.active || 0, icon: Route, color: 'text-amber-500', max: Math.max(stats?.total || 1, 20), trend: 'up' as const },
          { label: 'السائقون', value: stats?.drivers || 0, icon: Users, color: 'text-violet-500', max: Math.max(stats?.drivers || 1, 20), trend: 'stable' as const },
          { label: 'مكتملة', value: (stats?.total || 0) - (stats?.active || 0), icon: CheckCircle2, color: 'text-emerald-500', max: Math.max(stats?.total || 1, 50), trend: 'up' as const },
          { label: 'معلقة', value: shipments.filter(s => s.status === 'new').length, icon: Clock, color: 'text-amber-500', max: 20, trend: 'down' as const },
          { label: 'الشركاء', value: stats?.partnerCompanies || 0, icon: Building2, color: 'text-primary', max: Math.max(stats?.partnerCompanies || 1, 10), trend: 'stable' as const },
        ]}
        alerts={[
          ...(shipments.filter(s => s.status === 'new').length > 5 ? [{ id: 'pending-high', message: `تحذير: ${shipments.filter(s => s.status === 'new').length} شحنة معلقة تحتاج مراجعة عاجلة`, severity: 'warning' as const }] : []),
          ...(stats?.active && stats.active > 10 ? [{ id: 'active-load', message: `${stats.active} شحنة نشطة حالياً - حمولة تشغيلية مرتفعة`, severity: 'info' as const }] : []),
          { id: 'system-ok', message: 'جميع أنظمة التتبع والمراقبة تعمل بكفاءة', severity: 'info' as const },
          { id: 'fleet-check', message: 'تذكير: فحص دوري للأسطول مطلوب خلال 48 ساعة', severity: 'warning' as const },
        ]}
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
        heatmapData={heatmapRegions}
      >
        <TransporterHeader organizationName={organization?.name || ''} />
      </DashboardV2Header>

      <Suspense fallback={null}><CommunicationHubWidget /></Suspense>
      <Suspense fallback={null}><TransporterCommandCenter /></Suspense>
      <QuickActionsGrid actions={quickActions} title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsTransporter')} />

      {showSecondary && (
        <>
          <Suspense fallback={null}><DashboardWidgetCustomizer orgType="transporter" /></Suspense>

          <ErrorBoundary fallbackTitle="خطأ في النبض اليومي">
            <Suspense fallback={null}><TransporterDailyPulse /></Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
            <Suspense fallback={null}><DailyOperationsSummary /></Suspense>
          </ErrorBoundary>

          <Suspense fallback={null}><AutomationSettingsDialog organizationType="transporter" /></Suspense>

          <Suspense fallback={null}>
            <DashboardAlertsHub
              orgType="transporter"
              notificationsComponent={<TransporterNotifications notifications={notifications} />}
              slaComponent={<TransporterSLAAlerts shipments={shipments} />}
              incomingRequestsComponent={<TransporterIncomingRequests />}
            />
          </Suspense>

          <Suspense fallback={null}><UnifiedDocumentSearch /></Suspense>
          <Suspense fallback={null}><DocumentVerificationWidget /></Suspense>
        </>
      )}

      {/* ★ Modular Tabs */}
      <div>
        <Tabs defaultValue="overview" className="w-full" dir="rtl">
          <V2TabsNav tabs={tabKeys.map(tab => ({ ...tab, label: t(tab.labelKey), bindingType: TRANSPORTER_TAB_BINDINGS[tab.value]?.type }))} />

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <TransporterOperationsTabs
              shipments={shipments}
              shipmentsLoading={shipmentsLoading}
              stats={stats}
              statsLoading={statsLoading}
              financials={financials}
              financialsLoading={financialsLoading}
              kpis={kpis}
              kpisLoading={kpisLoading}
              driversSummary={driversSummary}
              driversLoading={driversLoading}
              quickActions={quickActions}
              t={t}
              onRefresh={handleRefresh}
              onStatClick={(f) => {
                setShipmentStatusFilter(f === 'active' ? 'in_transit' : f);
                setShipmentPage(1);
              }}
              onPrintShipment={(s) => {
                setSelectedShipment(s);
                setShowPrintDialog(true);
              }}
              onChangeStatus={(s) => {
                setStatusShipment(s);
                setShowStatusDialog(true);
              }}
              shipmentStatusFilter={shipmentStatusFilter}
            />
          </Suspense>

          <Suspense fallback={null}><TransporterIntelligenceTabs /></Suspense>
          <Suspense fallback={null}><TransporterComplianceTabs organizationId={organization?.id} /></Suspense>
        </Tabs>
      </div>

      {/* Dialogs */}
      <UnifiedShipmentPrint
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        shipment={selectedShipment as any}
      />

      {statusShipment && (
        <ShipmentStatusDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setStatusShipment(null);
          }}
          shipment={statusShipment}
          onStatusChanged={handleRefresh}
        />
      )}

      <AddDepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
      />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      </Suspense>
    </div>
  );
};

export default TransporterDashboard;

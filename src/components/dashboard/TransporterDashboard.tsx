import { useState, lazy, Suspense, useMemo } from 'react';
import StoryCircles from '@/components/stories/StoryCircles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import TransporterStatsGrid from './transporter/TransporterStatsGrid';
import TransporterKPICards from './transporter/TransporterKPICards';
import TransporterNotifications from './transporter/TransporterNotifications';
import TransporterSLAAlerts from './transporter/TransporterSLAAlerts';
import TransporterIncomingRequests from './transporter/TransporterIncomingRequests';
import TransporterPartnerSummary from './transporter/TransporterPartnerSummary';
import TransporterShipmentsList from './transporter/TransporterShipmentsList';
import TransporterAggregateReport from './transporter/TransporterAggregateReport';
import QuickActionsGrid from './QuickActionsGrid';
import DashboardWidgetCustomizer from './DashboardWidgetCustomizer';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentStatusDialog from '@/components/shipments/StatusChangeDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import FleetUtilizationWidget from './operations/FleetUtilizationWidget';
import TransporterPerformanceCharts from './transporter/TransporterPerformanceCharts';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import TransporterCommandCenter from './transporter/TransporterCommandCenter';
import SmartDailyBrief from './shared/SmartDailyBrief';
import TransporterDailyPulse from './transporter/TransporterDailyPulse';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { LayoutDashboard, Brain, BarChart3, CalendarDays, Cpu, Handshake, MapPin, Shield, DollarSign, Navigation, Store, Wrench, AlertTriangle, ShieldAlert, Link2, Building2, Leaf, Wifi, HardHat, FileCheck, FileText, ClipboardList, Truck } from 'lucide-react';
import { TRANSPORTER_TAB_BINDINGS } from '@/config/transporter/transporterBindings';
import DashboardV2Header from './shared/DashboardV2Header';
import V2TabsNav from './shared/V2TabsNav';

// Lazy load heavy tab content

const DriverPerformancePanel = lazy(() => import('./transporter/DriverPerformancePanel'));
const TripCostManagement = lazy(() => import('./transporter/TripCostManagement'));
const MaintenanceScheduler = lazy(() => import('./transporter/MaintenanceScheduler'));
const ShipmentCalendarWidget = lazy(() => import('./transporter/ShipmentCalendarWidget'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const RouteOptimizerPanel = lazy(() => import('@/components/ai/RouteOptimizerPanel'));
const PartnerProfitabilityPanel = lazy(() => import('./transporter/PartnerProfitabilityPanel'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnersView = lazy(() => import('./PartnersView'));
const SignalMonitorWidget = lazy(() => import('@/components/tracking/SignalMonitorWidget'));
const DriverLinkingCode = lazy(() => import('@/components/drivers/DriverLinkingCode'));
const TransporterDriverTracking = lazy(() => import('./transporter/TransporterDriverTracking'));
const LegalComplianceWidget = lazy(() => import('./generator/LegalComplianceWidget'));
const LegalArchiveWidget = lazy(() => import('./generator/LegalArchiveWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));
const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const BulkCertificateButton = lazy(() => import('@/components/bulk/BulkCertificateButton'));
const TransporterDeliveryApproval = lazy(() => import('@/components/receipts/TransporterDeliveryApproval'));
const SmartDriverNotifications = lazy(() => import('./transporter/SmartDriverNotifications'));
const SustainabilityReportGenerator = lazy(() => import('./transporter/SustainabilityReportGenerator'));
const EnhancedDriverPerformance = lazy(() => import('./transporter/EnhancedDriverPerformance'));
const DynamicPricingEngine = lazy(() => import('./transporter/DynamicPricingEngine'));
const DriverCopilot = lazy(() => import('./transporter/DriverCopilot'));
const PredictiveFleetMaintenance = lazy(() => import('./transporter/PredictiveFleetMaintenance'));
const FraudDetectionPanel = lazy(() => import('./transporter/FraudDetectionPanel'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const PartnerRiskPanel = lazy(() => import('./transporter/PartnerRiskPanel'));
const ChainOfCustodyPanel = lazy(() => import('./transporter/ChainOfCustodyPanel'));
const GovernmentReportingPanel = lazy(() => import('./transporter/GovernmentReportingPanel'));
const CarbonCreditsPanel = lazy(() => import('./transporter/CarbonCreditsPanel'));
const IoTMonitoringPanel = lazy(() => import('./transporter/IoTMonitoringPanel'));
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const OrgPerformanceRadar = lazy(() => import('./shared/OrgPerformanceRadar'));
const TransporterLicenseRenewal = lazy(() => import('@/components/transporter/TransporterLicenseRenewal'));
const TransporterDeclarations = lazy(() => import('@/components/transporter/TransporterDeclarations'));
const TransporterAnnualPlan = lazy(() => import('@/components/transporter/TransporterAnnualPlan'));
const ShiftScheduler = lazy(() => import('@/components/transporter/ShiftScheduler'));
const SLADashboard = lazy(() => import('@/components/transporter/SLADashboard'));
const SmartPriorityQueue = lazy(() => import('@/components/transporter/SmartPriorityQueue'));
const ProfitabilityReport = lazy(() => import('@/components/transporter/ProfitabilityReport'));
const ContainerManagement = lazy(() => import('@/components/transporter/ContainerManagement'));
const VehicleReassignment = lazy(() => import('@/components/transporter/VehicleReassignment'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

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

  // Paginated data fetching
  const { data: paginatedResult, isLoading: shipmentsLoading, refetch: refetchShipments } = useTransporterShipmentsPaginated(shipmentPage, shipmentStatusFilter, shipmentSearch);
  const shipments = paginatedResult?.data || [];
  const { data: stats, isLoading: statsLoading } = useTransporterStatsDB();
  const { data: notifications = [] } = useTransporterNotifications();
  const { data: financials, isLoading: financialsLoading } = useTransporterFinancials();
  const { data: kpis, isLoading: kpisLoading } = useTransporterKPIsDB();
  const { data: driversSummary = [], isLoading: driversLoading } = useDriversSummary();

  // Quick actions
  const quickActions = useQuickActions({
    type: 'transporter',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
      openSmartWeightUpload: () => setShowSmartWeightUpload(true),
    },
  });

  // Realtime subscriptions
  useTransporterRealtime();

  const handleRefresh = () => {
    refetchShipments();
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      <SmartDailyBrief
        role="transporter"
        stats={{
          pending: shipments.filter(s => s.status === 'new').length,
          active: shipments.filter(s => ['approved', 'in_transit'].includes(s.status)).length,
          completed: shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length,
          total: shipments.length,
        }}
      />
      <StoryCircles />
      <DashboardV2Header
        userName={organization?.name || ''}
        orgName={organization?.name || ''}
        orgLabel={t('dashboard.orgTypes.certifiedTransporter')}
        icon={Truck}
        gradient="from-primary to-primary/70"
      >
        <TransporterHeader organizationName={organization?.name || ''} />
      </DashboardV2Header>
      <DashboardWidgetCustomizer orgType="transporter" />

      <TransporterCommandCenter />

      <ErrorBoundary fallbackTitle="خطأ في النبض اليومي">
        <TransporterDailyPulse />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
        <DailyOperationsSummary />
      </ErrorBoundary>

      <AutomationSettingsDialog organizationType="transporter" />

      <ErrorBoundary fallbackTitle="خطأ في التنبيهات">
        <OperationalAlertsWidget />
        <TransporterSLAAlerts shipments={shipments} />
        <TransporterIncomingRequests />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="خطأ في موافقات التسليم">
        <Suspense fallback={<TabFallback />}>
          <TransporterDeliveryApproval />
        </Suspense>
      </ErrorBoundary>

      <TransporterNotifications notifications={notifications} />
      <UnifiedDocumentSearch />
      <DocumentVerificationWidget />

      {/* ★ Enhanced Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Tabs defaultValue="overview" className="w-full" dir="rtl">
          <V2TabsNav tabs={tabKeys.map(tab => ({ ...tab, label: t(tab.labelKey), bindingType: TRANSPORTER_TAB_BINDINGS[tab.value]?.type }))} />

          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <ErrorBoundary fallbackTitle="خطأ في استخدام الأسطول">
              <FleetUtilizationWidget />
            </ErrorBoundary>

            <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
              <TransporterPerformanceCharts />
            </ErrorBoundary>

            <Suspense fallback={<TabFallback />}>
              <SmartPriorityQueue shipments={shipments} />
            </Suspense>

            <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <OrgPerformanceRadar />
              </Suspense>
            </ErrorBoundary>

            <TransporterStatsGrid stats={stats} isLoading={statsLoading} onStatClick={(f) => {
              setShipmentStatusFilter(f === 'active' ? 'in_transit' : f);
              setShipmentPage(1);
            }} />

            <TransporterKPICards
              financials={financials}
              kpis={kpis}
              financialsLoading={financialsLoading}
              kpisLoading={kpisLoading}
            />

            <TransporterPartnerSummary />

            <QuickActionsGrid
              actions={quickActions}
              title={t('dashboard.quickActions')}
              subtitle={t('dashboard.quickActionsTransporter')}
            />

            <ErrorBoundary fallbackTitle="خطأ في قائمة الشحنات">
              <TransporterShipmentsList
                shipments={shipments}
                isLoading={shipmentsLoading}
                onRefresh={handleRefresh}
                statusFilter={shipmentStatusFilter}
                onPrintShipment={(s) => {
                  setSelectedShipment(s);
                  setShowPrintDialog(true);
                }}
                onChangeStatus={(s) => {
                  setStatusShipment(s);
                  setShowStatusDialog(true);
                }}
              />
            </ErrorBoundary>

            <TransporterAggregateReport shipments={shipments} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في تحليلات الذكاء الاصطناعي">
                <TransporterAIInsights />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في لوحة الأداء">
                <EnhancedDriverPerformance />
                <DriverPerformancePanel />
                <TripCostManagement />
                <SmartDriverNotifications />
                <MaintenanceScheduler />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="copilot" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في مساعد السائق">
                <DriverCopilot />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في التسعير الذكي">
                <DynamicPricingEngine />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في السوق">
                <WasteMarketplace />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في صيانة الأسطول">
               <PredictiveFleetMaintenance />
               <ContainerManagement />
               <VehicleReassignment />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="fraud" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في كشف الاحتيال">
                <FraudDetectionPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في تحليل المخاطر">
                <PartnerRiskPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="custody" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في سلسلة الحفظ">
                <ChainOfCustodyPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="government" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في البوابة الحكومية">
                <GovernmentReportingPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="carbon" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في أرصدة الكربون">
                <CarbonCreditsPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="iot" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في IoT">
                <IoTMonitoringPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ShipmentCalendarWidget />
            </Suspense>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في الجدولة الذكية">
                <ShiftScheduler />
                <SmartSchedulerPanel />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في تحليل الربحية">
                <PartnerProfitabilityPanel />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="partners" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في تقارير الاستدامة">
                <SustainabilityReportGenerator />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في اتفاقيات مستوى الخدمة">
                <SLADashboard />
                <ProfitabilityReport />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في تقييمات الشركاء">
                <PartnerRatingsWidget />
                <PartnersView />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في مراقبة الإشارات">
                <SignalMonitorWidget />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في ربط السائقين">
                <DriverLinkingCode />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في تتبع السائقين">
                <TransporterDriverTracking drivers={driversSummary} isLoading={driversLoading} />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="geofence" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <GeofenceAlertsPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="esg" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ESGReportPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <LegalComplianceWidget />
              <LegalArchiveWidget />
              <VehicleComplianceManager />
              <DriverComplianceManager />
              <IncidentReportManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="wmis" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في نظام WMIS">
                {organization?.id && <LicensedWasteTypesEditor organizationId={organization.id} />}
                <WMISEventsFeed />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في التراخيص">
                <TransporterLicenseRenewal />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="declarations" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في الإقرارات">
                <TransporterDeclarations />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="annual_plan" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في الخطة السنوية">
                <TransporterAnnualPlan />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>

          <TabsContent value="ohs" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ErrorBoundary fallbackTitle="خطأ في تقارير السلامة المهنية">
                <SafetyManagerDashboard />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <EnhancedShipmentPrintView
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

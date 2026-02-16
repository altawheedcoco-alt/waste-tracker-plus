import { useState, lazy, Suspense } from 'react';
import StoryCircles from '@/components/stories/StoryCircles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransporterRealtime } from '@/hooks/useTransporterRealtime';
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
import DocumentVerificationWidget from './DocumentVerificationWidget';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentStatusDialog from '@/components/shipments/ShipmentStatusDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import FleetUtilizationWidget from './operations/FleetUtilizationWidget';
import TransporterPerformanceCharts from './transporter/TransporterPerformanceCharts';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import TransporterCommandCenter from './transporter/TransporterCommandCenter';
import TransporterDailyPulse from './transporter/TransporterDailyPulse';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { LayoutDashboard, Brain, BarChart3, CalendarDays, Cpu, Handshake, MapPin, Shield, DollarSign, Navigation, Store, Wrench, AlertTriangle } from 'lucide-react';

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

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const tabItems = [
  { value: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { value: 'ai', label: 'الذكاء الاصطناعي', icon: Brain },
  { value: 'performance', label: 'الأداء والتكاليف', icon: BarChart3 },
  { value: 'copilot', label: 'مساعد السائق', icon: Navigation },
  { value: 'pricing', label: 'التسعير الذكي', icon: DollarSign },
  { value: 'marketplace', label: 'السوق', icon: Store },
  { value: 'fleet', label: 'صيانة الأسطول', icon: Wrench },
  { value: 'fraud', label: 'كشف الاحتيال', icon: AlertTriangle },
  { value: 'calendar', label: 'التقويم', icon: CalendarDays },
  { value: 'intelligence', label: 'الأتمتة', icon: Cpu },
  { value: 'partners', label: 'الشركاء', icon: Handshake },
  { value: 'tracking', label: 'تتبع السائقين', icon: MapPin },
  { value: 'compliance', label: 'الامتثال', icon: Shield },
];

const TransporterDashboard = () => {
  const { organization } = useAuth();
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
      <StoryCircles />
      <TransporterHeader organizationName={organization?.name || ''} />

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
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-1 sm:p-1.5">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-0.5 sm:gap-1 h-auto p-0">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-[10px] sm:text-sm whitespace-nowrap gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-sm hover:text-foreground transition-all duration-200"
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <ErrorBoundary fallbackTitle="خطأ في استخدام الأسطول">
              <FleetUtilizationWidget />
            </ErrorBoundary>

            <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
              <TransporterPerformanceCharts />
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
              title="الإجراءات السريعة"
              subtitle="إدارة الشحنات والسائقين والتقارير"
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

          <TabsContent value="calendar" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <ShipmentCalendarWidget />
            </Suspense>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <SmartSchedulerPanel />
              <RouteOptimizerPanel driverId="" destinations={[]} />
              <PartnerProfitabilityPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="partners" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <SustainabilityReportGenerator />
              <PartnerRatingsWidget />
              <PartnersView />
            </Suspense>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4 mt-6">
            <Suspense fallback={<TabFallback />}>
              <SignalMonitorWidget />
              <DriverLinkingCode />
              <TransporterDriverTracking drivers={driversSummary} isLoading={driversLoading} />
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

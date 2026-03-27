/**
 * تبويبات العمليات الميدانية للناقل (مدمجة)
 * overview | operations (calendar) | fleet (+ iot) | tracking (+ geofence) | performance (+ copilot)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import TransporterStatsGrid from '@/components/dashboard/transporter/TransporterStatsGrid';
import TransporterKPICards from '@/components/dashboard/transporter/TransporterKPICards';
import TransporterShipmentsList from '@/components/dashboard/transporter/TransporterShipmentsList';
import TransporterAggregateReport from '@/components/dashboard/transporter/TransporterAggregateReport';
import TransporterPerformanceCharts from '@/components/dashboard/transporter/TransporterPerformanceCharts';
import FleetUtilizationWidget from '@/components/dashboard/operations/FleetUtilizationWidget';
import type { TransporterShipment } from '@/hooks/useTransporterDashboard';

const LiveOperationsBoard = lazy(() => import('@/components/dashboard/transporter/LiveOperationsBoard'));
const FleetStatusMini = lazy(() => import('@/components/dashboard/transporter/FleetStatusMini'));
const RevenueSnapshotMini = lazy(() => import('@/components/dashboard/transporter/RevenueSnapshotMini'));
const DriverPerformancePanel = lazy(() => import('@/components/dashboard/transporter/DriverPerformancePanel'));
const TransporterPartnerSummary = lazy(() => import('@/components/dashboard/transporter/TransporterPartnerSummary'));
const MaintenanceScheduler = lazy(() => import('@/components/dashboard/transporter/MaintenanceScheduler'));
const ShipmentCalendarWidget = lazy(() => import('@/components/dashboard/transporter/ShipmentCalendarWidget'));
const SmartDriverNotifications = lazy(() => import('@/components/dashboard/transporter/SmartDriverNotifications'));
const EnhancedDriverPerformance = lazy(() => import('@/components/dashboard/transporter/EnhancedDriverPerformance'));
const DriverCopilot = lazy(() => import('@/components/dashboard/transporter/DriverCopilot'));
const PredictiveFleetMaintenance = lazy(() => import('@/components/dashboard/transporter/PredictiveFleetMaintenance'));
const ContainerManagement = lazy(() => import('@/components/transporter/ContainerManagement'));
const VehicleReassignment = lazy(() => import('@/components/transporter/VehicleReassignment'));
const SignalMonitorWidget = lazy(() => import('@/components/tracking/SignalMonitorWidget'));
const DriverLinkingCode = lazy(() => import('@/components/drivers/DriverLinkingCode'));
const TransporterDriverTracking = lazy(() => import('@/components/dashboard/transporter/TransporterDriverTracking'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const SmartPriorityQueue = lazy(() => import('@/components/transporter/SmartPriorityQueue'));
const OrgPerformanceRadar = lazy(() => import('@/components/dashboard/shared/OrgPerformanceRadar'));
const EnvironmentalKPIWidget = lazy(() => import('@/components/dashboard/shared/EnvironmentalKPIWidget'));
const LicenseExpiryWidget = lazy(() => import('@/components/dashboard/shared/LicenseExpiryWidget'));
const TransporterSectionsSummary = lazy(() => import('@/components/dashboard/transporter/TransporterSectionsSummary'));
const IoTMonitoringPanel = lazy(() => import('@/components/dashboard/transporter/IoTMonitoringPanel'));
const TransporterSmartKPIs = lazy(() => import('@/components/dashboard/transporter/TransporterSmartKPIs'));
const SmartETAWidget = lazy(() => import('@/components/dashboard/transporter/SmartETAWidget'));
const SmartRouteOptimizer = lazy(() => import('@/components/dashboard/transporter/SmartRouteOptimizer'));
const LoadConsolidator = lazy(() => import('@/components/dashboard/transporter/LoadConsolidator'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

interface OperationsTabsProps {
  shipments: TransporterShipment[];
  shipmentsLoading: boolean;
  stats: any;
  statsLoading: boolean;
  financials: any;
  financialsLoading: boolean;
  kpis: any;
  kpisLoading: boolean;
  driversSummary: any[];
  driversLoading: boolean;
  quickActions: any[];
  t: (key: string) => string;
  onRefresh: () => void;
  onStatClick: (filter: string) => void;
  onPrintShipment: (s: TransporterShipment) => void;
  onChangeStatus: (s: TransporterShipment) => void;
  shipmentStatusFilter?: string;
}

const TransporterOperationsTabs = ({
  shipments, shipmentsLoading, stats, statsLoading,
  financials, financialsLoading, kpis, kpisLoading,
  driversSummary, driversLoading, quickActions, t,
  onRefresh, onStatClick, onPrintShipment, onChangeStatus,
  shipmentStatusFilter,
}: OperationsTabsProps) => (
  <>
    {/* ══════ 1. نظرة عامة (مخففة) ══════ */}
    <TabsContent value="overview" className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
      {/* Smart KPIs */}
      <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
        <ErrorBoundary fallbackTitle="خطأ في مؤشرات الأداء الذكية">
          <TransporterSmartKPIs />
        </ErrorBoundary>
      </Suspense>

      {/* Smart ETA */}
      <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
        <ErrorBoundary fallbackTitle="خطأ في وقت الوصول الذكي">
          <SmartETAWidget />
        </ErrorBoundary>
      </Suspense>

      <TransporterStatsGrid stats={stats} isLoading={statsLoading} onStatClick={onStatClick} />
      <TransporterKPICards financials={financials} kpis={kpis} financialsLoading={financialsLoading} kpisLoading={kpisLoading} />

      <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
        <ErrorBoundary fallbackTitle="خطأ في لوحة العمليات">
          <LiveOperationsBoard />
        </ErrorBoundary>
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <ErrorBoundary fallbackTitle="خطأ في تنبيهات التراخيص"><LicenseExpiryWidget /></ErrorBoundary>
        </Suspense>
      </div>

      <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية"><TransporterPerformanceCharts /></ErrorBoundary>

      <ErrorBoundary fallbackTitle="خطأ في قائمة الشحنات">
        <TransporterShipmentsList
          shipments={shipments} isLoading={shipmentsLoading} onRefresh={onRefresh}
          statusFilter={shipmentStatusFilter} onPrintShipment={onPrintShipment} onChangeStatus={onChangeStatus}
        />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="خطأ في التقرير التجميعي">
        <TransporterAggregateReport shipments={shipments} />
      </ErrorBoundary>
    </TabsContent>

    {/* ══════ 2. العمليات (calendar + load consolidation مدمج) ══════ */}
    <TabsContent value="operations" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تجميع الحمولات">
          <LoadConsolidator />
        </ErrorBoundary>
        <ShipmentCalendarWidget />
      </Suspense>
    </TabsContent>

    {/* ══════ 3. الأسطول والصيانة (+ IoT + استخدام الأسطول) ══════ */}
    <TabsContent value="fleet" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <Suspense fallback={<Skeleton className="h-[180px] rounded-xl" />}>
          <ErrorBoundary fallbackTitle="خطأ في حالة الأسطول"><FleetStatusMini /></ErrorBoundary>
        </Suspense>
        <ErrorBoundary fallbackTitle="خطأ في استخدام الأسطول"><FleetUtilizationWidget /></ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في صيانة الأسطول">
          <PredictiveFleetMaintenance />
          <ContainerManagement />
          <VehicleReassignment />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في IoT">
          <IoTMonitoringPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 4. التتبع (+ geofence مدمج) ══════ */}
    <TabsContent value="tracking" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في محسّن المسار"><SmartRouteOptimizer /></ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في مراقبة الإشارات"><SignalMonitorWidget /></ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في ربط السائقين"><DriverLinkingCode /></ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تتبع السائقين">
          <TransporterDriverTracking drivers={driversSummary} isLoading={driversLoading} />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تنبيهات السياج الجغرافي">
          <GeofenceAlertsPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 5. الأداء والتحليلات (+ copilot + رادار) ══════ */}
    <TabsContent value="performance" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في لوحة الأداء">
          <EnhancedDriverPerformance />
          <DriverPerformancePanel />
          <SmartDriverNotifications />
          <MaintenanceScheduler />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}><OrgPerformanceRadar /></Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في مساعد السائق">
          <DriverCopilot />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>
  </>
);

export default TransporterOperationsTabs;

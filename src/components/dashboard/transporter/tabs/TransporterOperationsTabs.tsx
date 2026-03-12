/**
 * تبويبات العمليات الميدانية للناقل
 * (overview, performance, fleet, tracking, calendar, geofence, copilot)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import TransporterStatsGrid from '../transporter/TransporterStatsGrid';
import TransporterKPICards from '../transporter/TransporterKPICards';
import TransporterPartnerSummary from '../transporter/TransporterPartnerSummary';
import TransporterShipmentsList from '../transporter/TransporterShipmentsList';
import TransporterAggregateReport from '../transporter/TransporterAggregateReport';
import TransporterPerformanceCharts from '../transporter/TransporterPerformanceCharts';
import FleetUtilizationWidget from '../operations/FleetUtilizationWidget';
import QuickActionsGrid from '../QuickActionsGrid';
import type { TransporterShipment } from '@/hooks/useTransporterDashboard';

const DriverPerformancePanel = lazy(() => import('../transporter/DriverPerformancePanel'));
const TripCostManagement = lazy(() => import('../transporter/TripCostManagement'));
const MaintenanceScheduler = lazy(() => import('../transporter/MaintenanceScheduler'));
const ShipmentCalendarWidget = lazy(() => import('../transporter/ShipmentCalendarWidget'));
const SmartDriverNotifications = lazy(() => import('../transporter/SmartDriverNotifications'));
const EnhancedDriverPerformance = lazy(() => import('../transporter/EnhancedDriverPerformance'));
const DriverCopilot = lazy(() => import('../transporter/DriverCopilot'));
const PredictiveFleetMaintenance = lazy(() => import('../transporter/PredictiveFleetMaintenance'));
const ContainerManagement = lazy(() => import('@/components/transporter/ContainerManagement'));
const VehicleReassignment = lazy(() => import('@/components/transporter/VehicleReassignment'));
const SignalMonitorWidget = lazy(() => import('@/components/tracking/SignalMonitorWidget'));
const DriverLinkingCode = lazy(() => import('@/components/drivers/DriverLinkingCode'));
const TransporterDriverTracking = lazy(() => import('../transporter/TransporterDriverTracking'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const SmartPriorityQueue = lazy(() => import('@/components/transporter/SmartPriorityQueue'));
const OrgPerformanceRadar = lazy(() => import('../shared/OrgPerformanceRadar'));

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
      <TransporterStatsGrid stats={stats} isLoading={statsLoading} onStatClick={onStatClick} />
      <TransporterKPICards financials={financials} kpis={kpis} financialsLoading={financialsLoading} kpisLoading={kpisLoading} />
      <TransporterPartnerSummary />
      <QuickActionsGrid actions={quickActions} title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsTransporter')} />
      <ErrorBoundary fallbackTitle="خطأ في قائمة الشحنات">
        <TransporterShipmentsList
          shipments={shipments}
          isLoading={shipmentsLoading}
          onRefresh={onRefresh}
          statusFilter={shipmentStatusFilter}
          onPrintShipment={onPrintShipment}
          onChangeStatus={onChangeStatus}
        />
      </ErrorBoundary>
      <TransporterAggregateReport shipments={shipments} />
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

    <TabsContent value="fleet" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في صيانة الأسطول">
          <PredictiveFleetMaintenance />
          <ContainerManagement />
          <VehicleReassignment />
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

    <TabsContent value="calendar" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ShipmentCalendarWidget />
      </Suspense>
    </TabsContent>
  </>
);

export default TransporterOperationsTabs;

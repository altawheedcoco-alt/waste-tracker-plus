import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { ChartSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

const PerformanceAnalyticsDashboard = lazy(() => import('@/components/analytics/PerformanceAnalyticsDashboard'));
const PerformanceComparisonDashboard = lazy(() => import('@/components/analytics/PerformanceComparisonDashboard'));
const OperationalHealthScore = lazy(() => import('@/components/analytics/OperationalHealthScore'));
const EntityRankingWidget = lazy(() => import('@/components/analytics/EntityRankingWidget'));
const CircularEconomyIndex = lazy(() => import('@/components/analytics/CircularEconomyIndex'));
const SmartInsightsWidget = lazy(() => import('@/components/dashboard/shared/SmartInsightsWidget'));
const EntityPerformanceCards = lazy(() => import('@/components/dashboard/shared/EntityPerformanceCards'));
const PDFReportGenerator = lazy(() => import('@/components/reports/PDFReportGenerator'));
const PartnerPerformanceMatrix = lazy(() => import('@/components/analytics/PartnerPerformanceMatrix'));
const GoalTrackingDashboard = lazy(() => import('@/components/analytics/GoalTrackingDashboard'));
const WasteFlowSankey = lazy(() => import('@/components/analytics/WasteFlowSankey'));
const ActivityHeatmap = lazy(() => import('@/components/analytics/ActivityHeatmap'));
const CostOptimizationEngine = lazy(() => import('@/components/analytics/CostOptimizationEngine'));
const ComplianceTracker = lazy(() => import('@/components/analytics/ComplianceTracker'));
const DailyPulseWidget = lazy(() => import('@/components/dashboard/shared/DailyPulseWidget'));
const OrganizationTimeline = lazy(() => import('@/components/analytics/OrganizationTimeline'));
const BenchmarkIndicator = lazy(() => import('@/components/analytics/BenchmarkIndicator'));
const RevenueForecast = lazy(() => import('@/components/analytics/RevenueForecast'));
const WorkPatternAnalysis = lazy(() => import('@/components/analytics/WorkPatternAnalysis'));
const QuickKPIStrip = lazy(() => import('@/components/dashboard/shared/QuickKPIStrip'));
const CustomerRetentionAnalysis = lazy(() => import('@/components/analytics/CustomerRetentionAnalysis'));
const WasteCompositionChart = lazy(() => import('@/components/analytics/WasteCompositionChart'));
const GeographicDistribution = lazy(() => import('@/components/analytics/GeographicDistribution'));
const DriverPerformanceLeaderboard = lazy(() => import('@/components/analytics/DriverPerformanceLeaderboard'));
const InvoiceAgingReport = lazy(() => import('@/components/analytics/InvoiceAgingReport'));
const WasteRecoveryRate = lazy(() => import('@/components/analytics/WasteRecoveryRate'));
const ShipmentVelocityTracker = lazy(() => import('@/components/analytics/ShipmentVelocityTracker'));
const EnvironmentalPassportWidget = lazy(() => import('@/components/analytics/EnvironmentalPassportWidget'));
const AnomalyDetectionWidget = lazy(() => import('@/components/analytics/AnomalyDetectionWidget'));
const PredictiveMaintenanceWidget = lazy(() => import('@/components/analytics/PredictiveMaintenanceWidget'));
const FleetUtilizationWidget = lazy(() => import('@/components/analytics/FleetUtilizationWidget'));
const InventoryTurnoverWidget = lazy(() => import('@/components/analytics/InventoryTurnoverWidget'));
const LiveAlertsDashboard = lazy(() => import('@/components/analytics/LiveAlertsDashboard'));
const ExportCenterWidget = lazy(() => import('@/components/analytics/ExportCenterWidget'));
const RevenueByWasteTypeWidget = lazy(() => import('@/components/analytics/RevenueByWasteTypeWidget'));
const MonthlyGrowthWidget = lazy(() => import('@/components/analytics/MonthlyGrowthWidget'));
const TopClientsWidget = lazy(() => import('@/components/analytics/TopClientsWidget'));
const PaymentStatusWidget = lazy(() => import('@/components/analytics/PaymentStatusWidget'));
const PeakHoursWidget = lazy(() => import('@/components/analytics/PeakHoursWidget'));
const SLAComplianceWidget = lazy(() => import('@/components/analytics/SLAComplianceWidget'));

const CardSkeleton = () => <Skeleton className="h-[200px] w-full rounded-xl" />;

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />

        {/* Quick KPI Strip */}
        <Suspense fallback={<Skeleton className="h-10 w-full rounded-lg" />}>
          <QuickKPIStrip />
        </Suspense>

        {/* Daily Pulse */}
        <Suspense fallback={<CardSkeleton />}>
          <DailyPulseWidget />
        </Suspense>

        {/* Entity Performance Cards */}
        <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>}>
          <EntityPerformanceCards />
        </Suspense>

        <AnalyticsDashboard />

        {/* Benchmark + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <BenchmarkIndicator />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <OrganizationTimeline />
          </Suspense>
        </div>

        {/* Smart Insights + PDF Export */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <SmartInsightsWidget />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <PDFReportGenerator />
          </Suspense>
        </div>
        
        {/* Health Score + Ranking + Circular Economy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <OperationalHealthScore />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <CircularEconomyIndex />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <EntityRankingWidget />
          </Suspense>
        </div>

        {/* Partner Performance Matrix + Waste Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <PartnerPerformanceMatrix />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <WasteFlowSankey />
          </Suspense>
        </div>

        {/* Goal Tracking */}
        <Suspense fallback={<ChartSkeleton />}>
          <GoalTrackingDashboard />
        </Suspense>

        {/* Revenue Forecast */}
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueForecast />
        </Suspense>

        {/* Activity Heatmap + Work Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <ActivityHeatmap />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <WorkPatternAnalysis />
          </Suspense>
        </div>

        {/* Cost Optimization + Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <CostOptimizationEngine />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ComplianceTracker />
          </Suspense>
        </div>

        {/* Performance Comparison */}
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceComparisonDashboard />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceAnalyticsDashboard />
        </Suspense>

        {/* Customer Retention + Waste Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <CustomerRetentionAnalysis />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <WasteCompositionChart />
          </Suspense>
        </div>

        {/* Geographic Distribution */}
        <Suspense fallback={<ChartSkeleton />}>
          <GeographicDistribution />
        </Suspense>

        {/* Environmental Passport */}
        <Suspense fallback={<ChartSkeleton />}>
          <EnvironmentalPassportWidget />
        </Suspense>

        {/* Driver Leaderboard + Invoice Aging */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <DriverPerformanceLeaderboard />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <InvoiceAgingReport />
          </Suspense>
        </div>

        {/* Waste Recovery + Shipment Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <WasteRecoveryRate />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ShipmentVelocityTracker />
          </Suspense>
        </div>

        {/* AI: Anomaly Detection + Live Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <AnomalyDetectionWidget />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <LiveAlertsDashboard />
          </Suspense>
        </div>

        {/* Fleet + Predictive Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <FleetUtilizationWidget />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <PredictiveMaintenanceWidget />
          </Suspense>
        </div>

        {/* Inventory Turnover + Export Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <InventoryTurnoverWidget />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ExportCenterWidget />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;

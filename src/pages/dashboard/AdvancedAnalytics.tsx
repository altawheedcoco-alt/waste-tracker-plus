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

const CardSkeleton = () => <Skeleton className="h-[200px] w-full rounded-xl" />;

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />

        {/* Entity Performance Cards */}
        <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>}>
          <EntityPerformanceCards />
        </Suspense>

        <AnalyticsDashboard />

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

        {/* Performance Comparison */}
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceComparisonDashboard />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceAnalyticsDashboard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;

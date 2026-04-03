import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { ChartSkeleton } from '@/components/skeletons/DashboardSkeleton';

const PerformanceAnalyticsDashboard = lazy(() => import('@/components/analytics/PerformanceAnalyticsDashboard'));
const PerformanceComparisonDashboard = lazy(() => import('@/components/analytics/PerformanceComparisonDashboard'));
const OperationalHealthScore = lazy(() => import('@/components/analytics/OperationalHealthScore'));
const EntityRankingWidget = lazy(() => import('@/components/analytics/EntityRankingWidget'));
const CircularEconomyIndex = lazy(() => import('@/components/analytics/CircularEconomyIndex'));

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />
        <AnalyticsDashboard />
        
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

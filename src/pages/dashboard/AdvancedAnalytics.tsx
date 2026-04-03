import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { ChartSkeleton } from '@/components/skeletons/DashboardSkeleton';

const PerformanceAnalyticsDashboard = lazy(() => import('@/components/analytics/PerformanceAnalyticsDashboard'));
const PerformanceComparisonDashboard = lazy(() => import('@/components/analytics/PerformanceComparisonDashboard'));
const OperationalHealthScore = lazy(() => import('@/components/analytics/OperationalHealthScore'));
const EntityRankingWidget = lazy(() => import('@/components/analytics/EntityRankingWidget'));

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />
        <AnalyticsDashboard />
        
        {/* New: Health Score + Ranking side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <OperationalHealthScore />
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

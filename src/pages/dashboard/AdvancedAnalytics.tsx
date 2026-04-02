import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { ChartSkeleton } from '@/components/skeletons/DashboardSkeleton';

const PerformanceAnalyticsDashboard = lazy(() => import('@/components/analytics/PerformanceAnalyticsDashboard'));

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <AnalyticsDashboard />
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceAnalyticsDashboard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;

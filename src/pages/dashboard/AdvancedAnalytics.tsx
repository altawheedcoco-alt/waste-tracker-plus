import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

const AdvancedAnalytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;

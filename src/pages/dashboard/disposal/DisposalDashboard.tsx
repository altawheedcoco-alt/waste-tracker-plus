import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DisposalDashboard from '@/components/dashboard/DisposalDashboard';
import BackButton from '@/components/ui/back-button';

const DisposalDashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <BackButton />
        <DisposalDashboard />
      </div>
    </DashboardLayout>
  );
};

export default DisposalDashboardPage;

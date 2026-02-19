import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PartnersView from '@/components/dashboard/PartnersView';
import BackButton from '@/components/ui/back-button';

const Partners = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <PartnersView />
      </div>
    </DashboardLayout>
  );
};

export default Partners;

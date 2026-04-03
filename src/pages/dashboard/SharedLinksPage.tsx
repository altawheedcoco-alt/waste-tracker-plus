import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { MySharedLinks } from '@/components/sharing/MySharedLinks';

const SharedLinksPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
        <BackButton />
        <MySharedLinks />
      </div>
    </DashboardLayout>
  );
};

export default SharedLinksPage;

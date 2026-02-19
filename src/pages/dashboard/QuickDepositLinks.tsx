import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import DepositLinksManager from '@/components/deposits/DepositLinksManager';

const QuickDepositLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">روابط الإيداع السريع</h1>
          <p className="text-muted-foreground">
            أنشئ وأدر روابط مخصصة للجهات المرتبطة لإرسال الإيداعات بسهولة
          </p>
        </div>
        <DepositLinksManager />
      </div>
    </DashboardLayout>
  );
};

export default QuickDepositLinks;

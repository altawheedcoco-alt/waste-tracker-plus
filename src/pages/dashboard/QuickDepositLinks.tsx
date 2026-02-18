import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DepositLinksManager from '@/components/deposits/DepositLinksManager';

const QuickDepositLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
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

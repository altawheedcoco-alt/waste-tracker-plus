import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DriverLinksManager from '@/components/drivers/DriverLinksManager';

const QuickDriverLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">روابط السائقين السريعة</h1>
          <p className="text-muted-foreground">
            أنشئ وأدر روابط مخصصة لتسجيل السائقين وتحديث بياناتهم بسهولة
          </p>
        </div>
        <DriverLinksManager />
      </div>
    </DashboardLayout>
  );
};

export default QuickDriverLinks;

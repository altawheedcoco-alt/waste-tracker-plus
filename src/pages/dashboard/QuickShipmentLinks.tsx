import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentLinksManager from '@/components/shipments/ShipmentLinksManager';

const QuickShipmentLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">روابط الشحنات السريعة</h1>
          <p className="text-muted-foreground">
            أنشئ وأدر روابط مخصصة للجهات المرتبطة لتسجيل الشحنات بسهولة
          </p>
        </div>
        <ShipmentLinksManager />
      </div>
    </DashboardLayout>
  );
};

export default QuickShipmentLinks;

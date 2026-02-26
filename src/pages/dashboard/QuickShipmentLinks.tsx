import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentLinksManager from '@/components/shipments/ShipmentLinksManager';
import QuickLinksManager from '@/components/quick-links/QuickLinksManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Link2 } from 'lucide-react';

const QuickShipmentLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">روابط الشحنات السريعة</h1>
          <p className="text-muted-foreground">
            أنشئ وأدر روابط مخصصة للسائقين والجهات المرتبطة لتسجيل الشحنات بسهولة
          </p>
        </div>
        <Tabs defaultValue="advanced" dir="rtl">
          <TabsList>
            <TabsTrigger value="advanced" className="gap-1.5">
              <Zap className="h-4 w-4" />
              روابط متقدمة (Form Builder)
            </TabsTrigger>
            <TabsTrigger value="classic" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              روابط كلاسيكية
            </TabsTrigger>
          </TabsList>
          <TabsContent value="advanced">
            <QuickLinksManager />
          </TabsContent>
          <TabsContent value="classic">
            <ShipmentLinksManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default QuickShipmentLinks;

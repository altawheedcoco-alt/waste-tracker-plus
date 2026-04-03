import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import SmartInventoryDashboard from '@/components/inventory/SmartInventoryDashboard';

const SmartInventory = () => (
  <DashboardLayout>
    <ComingSoonOverlay title="المخزون الذكي" description="تتبع المواد والمخلفات بنظام FIFO/LIFO مع تنبيهات إعادة الطلب">
      <SmartInventoryDashboard />
    </ComingSoonOverlay>
  </DashboardLayout>
);
export default SmartInventory;

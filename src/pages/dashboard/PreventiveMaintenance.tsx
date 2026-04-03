import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import PreventiveMaintenanceDashboard from '@/components/maintenance/PreventiveMaintenanceDashboard';

const PreventiveMaintenance = () => (
  <DashboardLayout>
    <ComingSoonOverlay title="الصيانة الوقائية والتنبؤية" description="إدارة ذكية لصيانة الأسطول والمعدات بناءً على بيانات الاستخدام الفعلي">
      <PreventiveMaintenanceDashboard />
    </ComingSoonOverlay>
  </DashboardLayout>
);
export default PreventiveMaintenance;

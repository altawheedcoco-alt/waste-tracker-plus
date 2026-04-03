import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import RecurringServicesDashboard from '@/components/services/RecurringServicesDashboard';
const RecurringServices = () => (<DashboardLayout><ComingSoonOverlay title="الخدمات الدورية" description="جدولة وفوترة تلقائية للخدمات المتكررة"><RecurringServicesDashboard /></ComingSoonOverlay></DashboardLayout>);
export default RecurringServices;

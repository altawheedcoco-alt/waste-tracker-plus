import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import EmergencyResponseDashboard from '@/components/emergency/EmergencyResponseDashboard';
const EmergencyResponse = () => (<DashboardLayout><ComingSoonOverlay title="الاستجابة للطوارئ" description="بروتوكولات تلقائية للتعامل مع حالات الطوارئ البيئية"><EmergencyResponseDashboard /></ComingSoonOverlay></DashboardLayout>);
export default EmergencyResponse;

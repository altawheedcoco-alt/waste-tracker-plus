import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import PredictiveFailureDashboard from '@/components/analytics/PredictiveFailureDashboard';
const PredictiveFailure = () => (<DashboardLayout><ComingSoonOverlay title="التنبؤ بالأعطال" description="ذكاء اصطناعي يراقب صحة المعدات ويتنبأ بالأعطال"><PredictiveFailureDashboard /></ComingSoonOverlay></DashboardLayout>);
export default PredictiveFailure;

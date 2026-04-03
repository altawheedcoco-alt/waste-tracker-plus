import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import BenchmarkingDashboard from '@/components/analytics/BenchmarkingDashboard';
const Benchmarking = () => (<DashboardLayout><ComingSoonOverlay title="المقارنة المعيارية" description="قارن أداء منظمتك مع متوسط القطاع"><BenchmarkingDashboard /></ComingSoonOverlay></DashboardLayout>);
export default Benchmarking;

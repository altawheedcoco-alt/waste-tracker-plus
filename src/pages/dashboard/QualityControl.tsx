import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import QualityControlDashboard from '@/components/quality/QualityControlDashboard';
const QualityControl = () => (<DashboardLayout><ComingSoonOverlay title="ضبط الجودة QA/QC" description="نظام فحص وتصنيف جودة المخلفات وفقاً لمعايير ISO"><QualityControlDashboard /></ComingSoonOverlay></DashboardLayout>);
export default QualityControl;

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import DynamicPricingDashboard from '@/components/pricing/DynamicPricingDashboard';
const DynamicPricing = () => (<DashboardLayout><ComingSoonOverlay title="التسعير الديناميكي" description="تسعير ذكي يعتمد على العرض والطلب والمسافة"><DynamicPricingDashboard /></ComingSoonOverlay></DashboardLayout>);
export default DynamicPricing;

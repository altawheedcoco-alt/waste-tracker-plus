import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComingSoonOverlay from '@/components/ui/ComingSoonOverlay';
import B2BLoyaltyDashboard from '@/components/loyalty/B2BLoyaltyDashboard';
const B2BLoyalty = () => (<DashboardLayout><ComingSoonOverlay title="برنامج ولاء B2B" description="نظام نقاط ومكافآت للشركاء والجهات المتعاملة"><B2BLoyaltyDashboard /></ComingSoonOverlay></DashboardLayout>);
export default B2BLoyalty;

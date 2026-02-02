import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PartnerBalancesTab from '@/components/accounting/PartnerBalancesTab';

export default function AccountingPartners() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/accounting')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">حسابات الشركاء</h1>
            <p className="text-muted-foreground">أرصدة المولدين والمدورين</p>
          </div>
        </div>

        {/* Content */}
        <PartnerBalancesTab />
      </div>
    </DashboardLayout>
  );
}

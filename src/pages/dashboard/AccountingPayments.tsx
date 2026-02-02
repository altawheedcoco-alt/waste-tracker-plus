import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentsTab from '@/components/accounting/PaymentsTab';
import CreatePaymentDialog from '@/components/accounting/CreatePaymentDialog';

export default function AccountingPayments() {
  const navigate = useNavigate();
  const [showCreatePayment, setShowCreatePayment] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/accounting')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">المدفوعات</h1>
              <p className="text-muted-foreground">تتبع المدفوعات الواردة والصادرة</p>
            </div>
          </div>
          <Button onClick={() => setShowCreatePayment(true)} className="gap-2">
            <CreditCard className="h-4 w-4" />
            تسجيل دفعة
          </Button>
        </div>

        {/* Content */}
        <PaymentsTab />

        {/* Dialog */}
        <CreatePaymentDialog 
          open={showCreatePayment} 
          onOpenChange={setShowCreatePayment} 
        />
      </div>
    </DashboardLayout>
  );
}

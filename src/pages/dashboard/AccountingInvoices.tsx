import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InvoicesTab from '@/components/accounting/InvoicesTab';
import CreateInvoiceDialog from '@/components/accounting/CreateInvoiceDialog';

export default function AccountingInvoices() {
  const navigate = useNavigate();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

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
              <h1 className="text-2xl font-bold">الفواتير</h1>
              <p className="text-muted-foreground">إدارة فواتير المبيعات والمشتريات</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            فاتورة جديدة
          </Button>
        </div>

        {/* Content */}
        <InvoicesTab />

        {/* Dialog */}
        <CreateInvoiceDialog 
          open={showCreateInvoice} 
          onOpenChange={setShowCreateInvoice} 
        />
      </div>
    </DashboardLayout>
  );
}

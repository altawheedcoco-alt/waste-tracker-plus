import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpensesTab from '@/components/accounting/ExpensesTab';
import CreateExpenseDialog from '@/components/accounting/CreateExpenseDialog';

export default function AccountingExpenses() {
  const navigate = useNavigate();
  const [showCreateExpense, setShowCreateExpense] = useState(false);

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
              <h1 className="text-2xl font-bold">المصروفات</h1>
              <p className="text-muted-foreground">تتبع المصروفات التشغيلية</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateExpense(true)} className="gap-2">
            <Wallet className="h-4 w-4" />
            تسجيل مصروف
          </Button>
        </div>

        {/* Content */}
        <ExpensesTab />

        {/* Dialog */}
        <CreateExpenseDialog 
          open={showCreateExpense} 
          onOpenChange={setShowCreateExpense} 
        />
      </div>
    </DashboardLayout>
  );
}

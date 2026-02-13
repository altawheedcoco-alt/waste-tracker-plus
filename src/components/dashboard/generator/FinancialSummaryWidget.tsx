import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, TrendingUp, Receipt, CreditCard, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FinancialSummaryWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['financial-summary', organization?.id],
    queryFn: async () => {
      const [invoicesRes, depositsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('organization_id', organization?.id!),
        supabase
          .from('deposits')
          .select('amount')
          .eq('organization_id', organization?.id!),
      ]);

      const invoices = invoicesRes.data || [];
      const deposits = depositsRes.data || [];

      const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid' || i.status === 'draft').reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const paidInvoices = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const totalDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

      return { totalInvoiced, unpaidInvoices, paidInvoices, totalDeposits };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: 'إجمالي الفواتير',
      value: data?.totalInvoiced || 0,
      icon: Receipt,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'غير مدفوعة',
      value: data?.unpaidInvoices || 0,
      icon: CreditCard,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'المدفوعة',
      value: data?.paidInvoices || 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'إجمالي الإيداعات',
      value: data?.totalDeposits || 0,
      icon: Banknote,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => navigate('/dashboard/accounting')}
          >
            <ArrowUpRight className="w-3 h-3" />
            التفاصيل
          </Button>
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="w-5 h-5 text-primary" />
            الملخص المالي
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 text-right" dir="rtl">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="font-bold text-sm">
                  {item.value.toLocaleString('ar-EG')} <span className="text-[10px] text-muted-foreground">ج.م</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryWidget;

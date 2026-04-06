/**
 * فواتير ومستحقات الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, CheckCircle2, Clock, AlertTriangle, DollarSign } from 'lucide-react';

const invoices = [
  { client: 'شركة الدلتا', amount: '45,000', status: 'partial', paid: '30,000', date: '2026-04-01' },
  { client: 'مستشفى السلام', amount: '14,000', status: 'pending', paid: '0', date: '2026-04-05' },
  { client: 'مصنع الزجاج', amount: '18,000', status: 'paid', paid: '18,000', date: '2026-03-28' },
  { client: 'هيئة الاستثمار', amount: '20,000', status: 'pending', paid: '0', date: '2026-04-06' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوع', color: 'text-green-600' },
  partial: { label: 'جزئي', color: 'text-amber-600' },
  pending: { label: 'معلّق', color: 'text-red-600' },
};

const ConsultantInvoices = () => {
  const totalDue = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + parseInt(i.amount.replace(',', '')) - parseInt(i.paid.replace(',', '')), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          الفواتير والمستحقات
          <Badge variant="outline" className="mr-auto text-[9px]">
            مستحق: {totalDue.toLocaleString()} ج.م
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invoices.map((inv, i) => {
          const cfg = statusConfig[inv.status];
          return (
            <div key={i} className="flex items-center gap-2 p-2 rounded border">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{inv.client}</p>
                <p className="text-[10px] text-muted-foreground">{inv.amount} ج.م • {new Date(inv.date).toLocaleDateString('ar-EG')}</p>
              </div>
              <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ConsultantInvoices;

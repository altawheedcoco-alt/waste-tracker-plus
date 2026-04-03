/**
 * InvoiceAgingReport — تقرير أعمار الفواتير
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AGING_BUCKETS = [
  { key: 'current', label: 'حالية (0-30)', color: 'hsl(142, 76%, 36%)', maxDays: 30 },
  { key: 'days30', label: '31-60 يوم', color: 'hsl(48, 96%, 53%)', maxDays: 60 },
  { key: 'days60', label: '61-90 يوم', color: 'hsl(24, 94%, 50%)', maxDays: 90 },
  { key: 'overdue', label: '+90 يوم', color: 'hsl(346, 87%, 50%)', maxDays: Infinity },
];

export default function InvoiceAgingReport() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-aging', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_amount, status, due_date, created_at')
        .eq('organization_id', orgId)
        .in('status', ['pending', 'sent', 'overdue', 'partially_paid']);

      const now = new Date();
      const buckets = AGING_BUCKETS.map(b => ({ ...b, count: 0, amount: 0 }));
      let totalOutstanding = 0;

      (invoices || []).forEach(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at);
        const daysOld = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        const amount = inv.total_amount || 0;
        totalOutstanding += amount;

        for (const bucket of buckets) {
          if (daysOld <= bucket.maxDays) {
            bucket.count++;
            bucket.amount += amount;
            break;
          }
        }
      });

      const chartData = buckets.map(b => ({
        name: b.label,
        amount: Math.round(b.amount),
        count: b.count,
        color: b.color,
      }));

      const overdueCount = buckets[2].count + buckets[3].count;
      const overdueAmount = Math.round(buckets[2].amount + buckets[3].amount);

      return { chartData, totalOutstanding: Math.round(totalOutstanding), overdueCount, overdueAmount, totalInvoices: (invoices || []).length };
    },
    enabled: !!orgId,
    staleTime: 15 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            أعمار الفواتير المعلقة
          </CardTitle>
          {data && data.overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {data.overdueCount} متأخرة
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.totalInvoices}</p>
                <p className="text-[10px] text-muted-foreground">فاتورة معلقة</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{(data.totalOutstanding / 1000).toFixed(0)}k</p>
                <p className="text-[10px] text-muted-foreground">إجمالي (ج.م)</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <p className="text-lg font-bold text-destructive">{(data.overdueAmount / 1000).toFixed(0)}k</p>
                <p className="text-[10px] text-muted-foreground">متأخرة (ج.م)</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                  formatter={(val: number) => [`${val.toLocaleString()} ج.م`, 'المبلغ']} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {data.chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

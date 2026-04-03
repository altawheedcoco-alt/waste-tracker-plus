/**
 * PaymentStatusWidget — حالة المدفوعات
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوع', color: 'hsl(var(--chart-2))' },
  pending: { label: 'معلق', color: 'hsl(var(--chart-4))' },
  overdue: { label: 'متأخر', color: 'hsl(var(--destructive))' },
  partial: { label: 'جزئي', color: 'hsl(var(--chart-3))' },
  draft: { label: 'مسودة', color: 'hsl(var(--muted-foreground))' },
};

export default function PaymentStatusWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['payment-status', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('status, total_amount')
        .eq('organization_id', orgId!);
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!invoices) return [];
    const map: Record<string, number> = {};
    invoices.forEach(inv => {
      const s = inv.status || 'draft';
      map[s] = (map[s] || 0) + (Number(inv.total_amount) || 0);
    });
    return Object.entries(map).map(([status, value]) => ({
      name: STATUS_MAP[status]?.label || status,
      value: Math.round(value),
      color: STATUS_MAP[status]?.color || 'hsl(var(--muted))',
    }));
  }, [invoices]);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-primary" />
          حالة المدفوعات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد فواتير</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={40} outerRadius={70}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toLocaleString('ar-EG')} ج.م`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-medium">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

const DisposalFinancialFlow = () => {
  const { organization } = useAuth();

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['disposal-financial', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('accounting_ledger')
        .select('id, amount, entry_type, entry_date')
        .eq('organization_id', organization.id)
        .order('entry_date', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const analysis = useMemo(() => {
    if (!ledger?.length) return null;
    const totalReceived = ledger.filter(e => e.entry_type === 'credit').reduce((s, e) => s + Math.abs(e.amount), 0);
    const totalPaid = ledger.filter(e => e.entry_type === 'debit').reduce((s, e) => s + Math.abs(e.amount), 0);
    const net = totalReceived - totalPaid;

    const monthlyMap = new Map<string, { received: number; costs: number }>();
    ledger.forEach(e => {
      const month = e.entry_date?.substring(0, 7) || '';
      const existing = monthlyMap.get(month) || { received: 0, costs: 0 };
      if (e.entry_type === 'credit') existing.received += Math.abs(e.amount);
      else existing.costs += Math.abs(e.amount);
      monthlyMap.set(month, existing);
    });

    const chartData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([m, d]) => ({
        month: new Date(m + '-01').toLocaleDateString('ar-EG', { month: 'short' }),
        'رسوم تخلص': Math.round(d.received),
        'تكاليف تشغيل': Math.round(d.costs),
      }));

    return { totalReceived, totalPaid, net, chartData };
  }, [ledger]);

  if (isLoading) return <Skeleton className="h-[300px]" />;
  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <DollarSign className="w-5 h-5" />
            التدفق المالي — التخلص
          </CardTitle>
          <CardDescription>إيرادات رسوم التخلص مقابل تكاليف التشغيل</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <ArrowDownRight className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{analysis.totalReceived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">رسوم تخلص (ج.م)</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
            <ArrowUpRight className="w-4 h-4 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600">{analysis.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">تكاليف (ج.م)</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${analysis.net >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <DollarSign className={`w-4 h-4 mx-auto mb-1 ${analysis.net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-lg font-bold ${analysis.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(analysis.net).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{analysis.net >= 0 ? 'صافي ربح' : 'صافي خسارة'}</p>
          </div>
        </div>
        {analysis.chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="رسوم تخلص" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="تكاليف تشغيل" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DisposalFinancialFlow;

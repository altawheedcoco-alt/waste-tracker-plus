import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

const FinancialFlowAnalyzer = () => {
  const { organization } = useAuth();

  const { data: ledgerEntries, isLoading } = useQuery({
    queryKey: ['generator-financial-flow', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('accounting_ledger')
        .select('id, amount, entry_type, entry_category, entry_date, description, partner_organization_id')
        .eq('organization_id', organization.id)
        .order('entry_date', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const analysis = useMemo(() => {
    if (!ledgerEntries?.length) return null;

    const totalPaid = ledgerEntries
      .filter(e => e.entry_type === 'debit')
      .reduce((s, e) => s + Math.abs(e.amount), 0);

    const totalReceived = ledgerEntries
      .filter(e => e.entry_type === 'credit')
      .reduce((s, e) => s + Math.abs(e.amount), 0);

    const net = totalReceived - totalPaid;

    // Monthly breakdown
    const monthlyMap = new Map<string, { paid: number; received: number }>();
    ledgerEntries.forEach(e => {
      const month = e.entry_date?.substring(0, 7) || 'unknown';
      const existing = monthlyMap.get(month) || { paid: 0, received: 0 };
      if (e.entry_type === 'debit') existing.paid += Math.abs(e.amount);
      else existing.received += Math.abs(e.amount);
      monthlyMap.set(month, existing);
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short' }),
        'مدفوعات': Math.round(data.paid),
        'إيرادات': Math.round(data.received),
      }));

    return { totalPaid, totalReceived, net, monthlyData, count: ledgerEntries.length };
  }, [ledgerEntries]);

  if (isLoading) return <Skeleton className="h-[350px]" />;
  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <DollarSign className="w-5 h-5" />
            محلل التدفق المالي
          </CardTitle>
          <CardDescription>مدفوعات التخلص مقابل إيرادات التدوير</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
            <ArrowUpRight className="w-4 h-4 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600">{analysis.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">مدفوعات (ج.م)</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <ArrowDownRight className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{analysis.totalReceived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إيرادات (ج.م)</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${analysis.net >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <DollarSign className={`w-4 h-4 mx-auto mb-1 ${analysis.net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-lg font-bold ${analysis.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(analysis.net).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{analysis.net >= 0 ? 'صافي إيراد' : 'صافي تكلفة'}</p>
          </div>
        </div>

        {/* Chart */}
        {analysis.monthlyData.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analysis.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="مدفوعات" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="إيرادات" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialFlowAnalyzer;

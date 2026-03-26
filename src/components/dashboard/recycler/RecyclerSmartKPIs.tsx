import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Recycle, DollarSign, TrendingDown, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

const RecyclerSmartKPIs = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['recycler-kpi-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, status, waste_type, quantity, created_at, delivered_at, confirmed_at')
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: reports } = useQuery({
    queryKey: ['recycler-kpi-reports', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('recycling_reports')
        .select('id, input_weight, output_weight, recycling_rate, created_at')
        .eq('recycler_id', organization.id)
        .limit(200);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const kpis = useMemo(() => {
    if (!shipments?.length) return null;

    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
    const totalInput = completed.reduce((s, sh) => s + (sh.quantity || 0), 0);

    // From recycling reports
    const totalOutput = reports?.reduce((s, r) => s + (r.output_weight || 0), 0) || 0;
    const avgRecyclingRate = reports?.length
      ? Math.round(reports.reduce((s, r) => s + (r.recycling_rate || 0), 0) / reports.length)
      : totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0;

    const rejectionRate = totalInput > 0 ? Math.round(((totalInput - totalOutput) / totalInput) * 100) : 0;
    const revenuePerTon = totalOutput > 0 ? Math.round(totalOutput * 150) : 0; // Estimated

    return { avgRecyclingRate, rejectionRate, revenuePerTon, totalInput, totalOutput, completed: completed.length };
  }, [shipments, reports]);

  if (isLoading) return <Skeleton className="h-[180px]" />;
  if (!kpis) return null;

  const cards = [
    {
      title: 'كفاءة التدوير',
      value: `${kpis.avgRecyclingRate}%`,
      icon: Recycle,
      color: kpis.avgRecyclingRate >= 70 ? 'text-green-600' : 'text-yellow-600',
      subtitle: `${kpis.completed} عملية`,
    },
    {
      title: 'معدل الرفض',
      value: `${kpis.rejectionRate}%`,
      icon: TrendingDown,
      color: kpis.rejectionRate <= 20 ? 'text-green-600' : 'text-red-600',
      subtitle: 'من إجمالي المدخلات',
    },
    {
      title: 'إجمالي المدخلات',
      value: `${kpis.totalInput.toLocaleString()} طن`,
      icon: BarChart3,
      color: 'text-primary',
      subtitle: 'مواد واردة',
    },
    {
      title: 'إجمالي المخرجات',
      value: `${kpis.totalOutput.toLocaleString()} طن`,
      icon: DollarSign,
      color: 'text-primary',
      subtitle: 'مواد مُعاد تدويرها',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.title}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecyclerSmartKPIs;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Recycle, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

const GeneratorSmartKPIs = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['generator-kpi-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, status, waste_type, quantity, unit, created_at, approved_at, delivered_at, confirmed_at, recycler_id')
        .eq('generator_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: invoices } = useQuery({
    queryKey: ['generator-kpi-invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('invoices')
        .select('id, total_amount, invoice_type, status, created_at')
        .eq('organization_id', organization.id)
        .limit(200);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const kpis = useMemo(() => {
    if (!shipments?.length) return null;

    const total = shipments.length;
    const delivered = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
    const recycled = delivered.filter(s => s.recycler_id);
    const diversionRate = total > 0 ? Math.round((recycled.length / Math.max(delivered.length, 1)) * 100) : 0;

    // Average response time (created -> approved)
    const withApproval = shipments.filter(s => s.approved_at && s.created_at);
    const avgResponseHours = withApproval.length > 0
      ? Math.round(withApproval.reduce((sum, s) => {
          const diff = new Date(s.approved_at!).getTime() - new Date(s.created_at).getTime();
          return sum + diff / (1000 * 60 * 60);
        }, 0) / withApproval.length)
      : 0;

    // Financial
    const totalPaid = invoices?.filter(i => i.invoice_type === 'expense' || !i.invoice_type)
      .reduce((s, i) => s + (i.total_amount || 0), 0) || 0;
    const totalReceived = invoices?.filter(i => i.invoice_type === 'revenue')
      .reduce((s, i) => s + (i.total_amount || 0), 0) || 0;
    const netCost = totalPaid - totalReceived;

    // Total weight
    const totalWeight = delivered.reduce((s, sh) => s + (sh.quantity || 0), 0);

    return { diversionRate, avgResponseHours, netCost, totalWeight, totalPaid, totalReceived, total, delivered: delivered.length };
  }, [shipments, invoices]);

  if (isLoading) return <Skeleton className="h-[200px]" />;

  if (!kpis) return null;

  const cards = [
    {
      title: 'معدل التحويل للتدوير',
      value: `${kpis.diversionRate}%`,
      icon: Recycle,
      color: kpis.diversionRate >= 60 ? 'text-green-600' : kpis.diversionRate >= 30 ? 'text-yellow-600' : 'text-red-600',
      subtitle: `${kpis.delivered} شحنة مكتملة`,
    },
    {
      title: 'صافي التكلفة/الإيراد',
      value: `${Math.abs(kpis.netCost).toLocaleString()} ج.م`,
      icon: DollarSign,
      color: kpis.netCost <= 0 ? 'text-green-600' : 'text-red-600',
      subtitle: kpis.netCost <= 0 ? 'إيراد صافي' : 'تكلفة صافية',
    },
    {
      title: 'وقت استجابة الناقل',
      value: `${kpis.avgResponseHours} ساعة`,
      icon: Clock,
      color: kpis.avgResponseHours <= 24 ? 'text-green-600' : 'text-yellow-600',
      subtitle: 'متوسط من الإنشاء للموافقة',
    },
    {
      title: 'إجمالي الكميات المُخرجة',
      value: `${kpis.totalWeight.toLocaleString()} طن`,
      icon: BarChart3,
      color: 'text-primary',
      subtitle: `من ${kpis.total} شحنة`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <Card key={i} className="relative overflow-hidden">
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

export default GeneratorSmartKPIs;

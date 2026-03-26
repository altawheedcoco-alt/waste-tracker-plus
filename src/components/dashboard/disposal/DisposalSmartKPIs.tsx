import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Factory, TrendingUp, Truck, Shield } from 'lucide-react';
import { useMemo } from 'react';

const DisposalSmartKPIs = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['disposal-kpi-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, status, quantity, created_at, waste_type')
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      return data;
    },
    enabled: !!organization?.id,
  });

  const kpis = useMemo(() => {
    if (!shipments?.length) return null;
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
    const totalReceived = completed.reduce((s, sh) => s + (sh.quantity || 0), 0);

    // Daily average (last 30 days)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = completed.filter(s => new Date(s.created_at) >= thirtyDaysAgo);
    const dailyAvg = recent.length > 0 ? Math.round(recent.reduce((s, sh) => s + (sh.quantity || 0), 0) / 30) : 0;

    // Capacity remaining
    const capacity = facility?.max_capacity || 0;
    const remaining = capacity > 0 ? Math.max(0, capacity - totalReceived) : 0;
    const capacityPercent = capacity > 0 ? Math.round((remaining / capacity) * 100) : 100;

    return { totalReceived, dailyAvg, remaining, capacityPercent, capacity, completed: completed.length };
  }, [shipments, facility]);

  if (isLoading) return <Skeleton className="h-[180px]" />;
  if (!kpis) return null;

  const cards = [
    {
      title: 'إجمالي المستقبَل',
      value: `${kpis.totalReceived.toLocaleString()} طن`,
      icon: Factory,
      color: 'text-primary',
      subtitle: `${kpis.completed} شحنة`,
    },
    {
      title: 'المعدل اليومي',
      value: `${kpis.dailyAvg} طن/يوم`,
      icon: Truck,
      color: 'text-primary',
      subtitle: 'آخر ٣٠ يوم',
    },
    {
      title: 'السعة المتبقية',
      value: kpis.capacity > 0 ? `${kpis.capacityPercent}%` : 'غير محدد',
      icon: TrendingUp,
      color: kpis.capacityPercent > 30 ? 'text-green-600' : kpis.capacityPercent > 10 ? 'text-yellow-600' : 'text-red-600',
      subtitle: kpis.capacity > 0 ? `${kpis.remaining.toLocaleString()} طن` : 'حدد سعة المنشأة',
    },
    {
      title: 'حالة الامتثال',
      value: kpis.capacityPercent > 10 ? 'مطابق' : 'تحذير',
      icon: Shield,
      color: kpis.capacityPercent > 10 ? 'text-green-600' : 'text-red-600',
      subtitle: 'الرصد البيئي',
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

export default DisposalSmartKPIs;

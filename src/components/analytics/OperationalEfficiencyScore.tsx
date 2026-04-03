/**
 * OperationalEfficiencyScore — مؤشر الكفاءة التشغيلية المركب
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function OperationalEfficiencyScore() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['ops-efficiency', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [shipRes, ledgerRes, invoiceRes] = await Promise.all([
        supabase.from('shipments').select('status, created_at, delivered_at, actual_weight')
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`).limit(500),
        supabase.from('accounting_ledger').select('entry_type, amount')
          .eq('organization_id', orgId!).limit(500),
        supabase.from('invoices').select('status').eq('organization_id', orgId!).limit(200),
      ]);
      return {
        shipments: shipRes.data || [],
        ledger: ledgerRes.data || [],
        invoices: invoiceRes.data || [],
      };
    },
  });

  const radarData = useMemo(() => {
    if (!data) return [];
    const { shipments, ledger, invoices } = data;

    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const deliveryRate = shipments.length > 0 ? Math.round((delivered / shipments.length) * 100) : 0;

    let totalDeliveryHours = 0;
    let deliveredWithTime = 0;
    shipments.forEach(s => {
      if (s.status === 'delivered' && s.delivered_at) {
        totalDeliveryHours += (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / 3600000;
        deliveredWithTime++;
      }
    });
    const avgDeliveryH = deliveredWithTime > 0 ? totalDeliveryHours / deliveredWithTime : 999;
    const speedScore = Math.min(100, Math.max(0, Math.round(100 - (avgDeliveryH / 48) * 50)));

    const totalWeight = shipments.reduce((s, x) => s + (Number(x.actual_weight) || 0), 0);
    const capacityScore = Math.min(100, Math.round((totalWeight / Math.max(shipments.length, 1)) / 20 * 100));

    const income = ledger.filter(l => l.entry_type === 'credit').reduce((s, l) => s + Number(l.amount), 0);
    const expense = ledger.filter(l => l.entry_type === 'debit').reduce((s, l) => s + Number(l.amount), 0);
    const profitScore = income > 0 ? Math.min(100, Math.round(((income - expense) / income) * 100)) : 50;

    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const collectionRate = invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 0;

    return [
      { metric: 'التسليم', value: deliveryRate },
      { metric: 'السرعة', value: speedScore },
      { metric: 'الحمولة', value: capacityScore },
      { metric: 'الربحية', value: Math.max(0, profitScore) },
      { metric: 'التحصيل', value: collectionRate },
      { metric: 'الحجم', value: Math.min(100, Math.round(shipments.length / 5)) },
    ];
  }, [data]);

  const overallScore = useMemo(() => {
    if (radarData.length === 0) return 0;
    return Math.round(radarData.reduce((s, d) => s + d.value, 0) / radarData.length);
  }, [radarData]);

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  const getGrade = (s: number) => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B+' : s >= 60 ? 'B' : s >= 50 ? 'C' : 'D';

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-5 w-5 text-primary" />
          مؤشر الكفاءة التشغيلية
          <span className="mr-auto text-2xl font-bold text-primary">{getGrade(overallScore)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-2">
          <span className="text-3xl font-bold">{overallScore}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" fontSize={11} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

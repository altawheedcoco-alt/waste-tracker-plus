/**
 * EntityPerformanceCards — بطاقات أداء محسنة للجهات
 * تعرض sparkline مصغر + مقارنة مع الفترة السابقة
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Truck, DollarSign, Recycle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MetricCard {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  icon: typeof Truck;
  color: string;
  suffix?: string;
  sparkline?: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function EntityPerformanceCards() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: metrics } = useQuery({
    queryKey: ['entity-perf-cards', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // Fetch 6 months for sparkline
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const [currentRes, prevRes, sparkRes, partnersRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, quantity, unit, status', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', thisMonth),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', lastMonth)
          .lt('created_at', thisMonth),
        supabase.from('shipments')
          .select('created_at')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', sixMonthsAgo),
        supabase.from('external_partners')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgId)
          .eq('is_active', true),
      ]);

      const current = currentRes.data || [];
      const curCount = currentRes.count || 0;
      const prevCount = prevRes.count || 0;
      const partnerCount = partnersRes.count || 0;

      const totalTons = current.reduce((s, sh) => {
        const q = sh.quantity || 0;
        return s + (sh.unit === 'kg' ? q / 1000 : q);
      }, 0);

      // Build sparkline (6 months)
      const monthCounts: number[] = Array(6).fill(0);
      (sparkRes.data || []).forEach(s => {
        const d = new Date(s.created_at);
        const monthIdx = 5 - (now.getMonth() - d.getMonth() + (now.getFullYear() - d.getFullYear()) * 12);
        if (monthIdx >= 0 && monthIdx < 6) monthCounts[monthIdx]++;
      });

      const shipmentChange = prevCount > 0 ? Math.round(((curCount - prevCount) / prevCount) * 100) : 0;

      const cards: MetricCard[] = [
        {
          id: 'shipments', label: 'الشحنات', value: curCount,
          previousValue: prevCount, change: shipmentChange,
          icon: Truck, color: 'hsl(var(--primary))',
          sparkline: monthCounts,
        },
        {
          id: 'tonnage', label: 'الحمولة', value: `${Math.round(totalTons * 10) / 10}`,
          icon: Recycle, color: '#22c55e', suffix: 'طن',
          sparkline: monthCounts.map(c => c * 2.5), // approximate
        },
        {
          id: 'partners', label: 'الشركاء النشطون', value: partnerCount,
          icon: Users, color: '#8b5cf6',
        },
        {
          id: 'completion', label: 'معدل الإنجاز',
          value: curCount > 0 ? `${Math.round((current.filter(s => ['delivered', 'confirmed'].includes(s.status)).length / curCount) * 100)}` : '0',
          icon: DollarSign, color: '#f59e0b', suffix: '%',
        },
      ];

      return cards;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  if (!metrics?.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map(card => {
        const Icon = card.icon;
        const isPositive = (card.change ?? 0) > 0;
        const isNegative = (card.change ?? 0) < 0;
        return (
          <Card key={card.id} className="border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                {card.change !== undefined && card.change !== 0 && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 ${isPositive ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3 ml-0.5" /> : <TrendingDown className="h-3 w-3 ml-0.5" />}
                    {Math.abs(card.change)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}{card.suffix && <span className="text-sm font-normal text-muted-foreground mr-1">{card.suffix}</span>}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </div>
                {card.sparkline && <MiniSparkline data={card.sparkline} color={card.color} />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

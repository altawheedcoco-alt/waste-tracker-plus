/**
 * QuickKPIStrip — شريط مؤشرات سريع
 * يعرض KPIs مصغرة متحركة في شريط علوي
 */
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Truck, Recycle, DollarSign, Users, Leaf, TrendingUp,
  CheckCircle2, Clock, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuickKPI {
  icon: typeof Truck;
  label: string;
  value: string;
  color: string;
}

export default function QuickKPIStrip() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { data: kpis } = useQuery({
    queryKey: ['quick-kpi-strip', orgId],
    queryFn: async (): Promise<QuickKPI[]> => {
      if (!orgId) return [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      const [monthRes, yearRes, pendingRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, status, quantity, unit', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', monthStart),
        supabase.from('shipments')
          .select('id, quantity, unit', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', yearStart)
          .in('status', ['delivered', 'confirmed'] as any[]),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .in('status', ['new', 'approved'] as any[]),
      ]);

      const monthData = monthRes.data || [];
      const monthCount = monthRes.count || 0;
      const yearCount = yearRes.count || 0;
      const pendingCount = pendingRes.count || 0;
      const completed = monthData.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const rate = monthCount > 0 ? Math.round((completed / monthCount) * 100) : 0;

      const yearTons = (yearRes.data || []).reduce((s, sh) => s + (sh.unit === 'kg' ? (sh.quantity || 0) / 1000 : (sh.quantity || 0)), 0);
      const co2 = Math.round(yearTons * 0.8 * 10) / 10;

      return [
        { icon: Truck, label: 'شحنات الشهر', value: `${monthCount}`, color: 'text-primary' },
        { icon: CheckCircle2, label: 'معدل الإنجاز', value: `${rate}%`, color: 'text-emerald-600' },
        { icon: Clock, label: 'معلقة', value: `${pendingCount}`, color: 'text-amber-600' },
        { icon: Activity, label: 'شحنات السنة', value: `${yearCount}`, color: 'text-blue-600' },
        { icon: Recycle, label: 'حمولة السنة', value: `${Math.round(yearTons * 10) / 10} طن`, color: 'text-purple-600' },
        { icon: Leaf, label: 'CO₂ موفر', value: `${co2} طن`, color: 'text-emerald-600' },
      ];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-scroll animation
  useEffect(() => {
    if (!scrollRef.current || isPaused || !kpis?.length) return;
    const el = scrollRef.current;
    let animId: number;
    let pos = 0;

    const step = () => {
      pos += 0.5;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, kpis]);

  if (!kpis?.length) return null;

  // Duplicate for infinite scroll effect
  const items = [...kpis, ...kpis];

  return (
    <div
      ref={scrollRef}
      className="overflow-hidden whitespace-nowrap py-2 px-1 bg-muted/20 rounded-lg border border-border"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="inline-flex gap-4">
        {items.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-card border border-border/50">
              <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              <span className="text-[11px] text-muted-foreground">{kpi.label}:</span>
              <span className="text-[11px] font-semibold">{kpi.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

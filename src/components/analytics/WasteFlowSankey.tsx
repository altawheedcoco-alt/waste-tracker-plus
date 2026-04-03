/**
 * WasteFlowSankey — مخطط تدفق المخلفات
 * يعرض تدفق المخلفات من المصدر إلى الوجهة النهائية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FlowNode {
  from: string;
  to: string;
  value: number;
  wasteType: string;
}

const COLORS = [
  'hsl(var(--primary))', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#14b8a6',
];

export default function WasteFlowSankey() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['waste-flow', orgId],
    queryFn: async () => {
      if (!orgId) return { flows: [], totalTons: 0 };

      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

      const { data: shipments } = await supabase
        .from('shipments')
        .select('waste_type, quantity, unit, generator_id, transporter_id, recycler_id, disposal_facility_id')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .in('status', ['delivered', 'confirmed'] as any[])
        .gte('created_at', yearStart)
        .limit(500);

      if (!shipments?.length) return { flows: [], totalTons: 0 };

      // Collect org IDs
      const orgIds = new Set<string>();
      shipments.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id, s.disposal_facility_id].forEach(id => {
          if (id) orgIds.add(id);
        });
      });

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', Array.from(orgIds).slice(0, 30));

      const orgMap = new Map((orgs || []).map(o => [o.id, { name: o.name, type: o.organization_type }]));

      // Build flow map: waste_type -> { from_type -> to_type -> tons }
      const flowMap = new Map<string, number>();
      let totalTons = 0;

      shipments.forEach(s => {
        const wt = s.waste_type || 'أخرى';
        const q = s.quantity || 0;
        const tons = s.unit === 'kg' ? q / 1000 : q;
        totalTons += tons;

        const genType = orgMap.get(s.generator_id || '')?.type || 'مولد';
        const destType = s.recycler_id
          ? (orgMap.get(s.recycler_id)?.type || 'مدور')
          : (orgMap.get(s.disposal_facility_id || '')?.type || 'تخلص');

        const key = `${genType}→${destType}→${wt}`;
        flowMap.set(key, (flowMap.get(key) || 0) + tons);
      });

      const flows: FlowNode[] = Array.from(flowMap.entries())
        .map(([key, value]) => {
          const [from, to, wasteType] = key.split('→');
          return { from, to, value: Math.round(value * 10) / 10, wasteType };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return { flows, totalTons: Math.round(totalTons * 10) / 10 };
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const maxValue = useMemo(() => Math.max(...(data?.flows || []).map(f => f.value), 1), [data]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-5 w-5 text-primary" />
            تدفق المخلفات
          </CardTitle>
          {data?.totalTons ? (
            <Badge variant="secondary" className="text-xs">{data.totalTons} طن إجمالي</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
        ) : !data?.flows?.length ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
            لا توجد بيانات تدفق كافية
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.flows.map((flow, idx) => {
              const widthPct = Math.max((flow.value / maxValue) * 100, 8);
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={idx} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-16 truncate text-right">{flow.from}</span>
                    <div className="flex-1 relative h-7 rounded-md overflow-hidden bg-muted/20">
                      <div
                        className="absolute inset-y-0 right-0 rounded-md flex items-center justify-center transition-all duration-500"
                        style={{ width: `${widthPct}%`, backgroundColor: `${color}20`, borderRight: `3px solid ${color}` }}
                      >
                        <span className="text-[10px] font-medium px-2 truncate" style={{ color }}>{flow.wasteType}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-16 truncate">{flow.to}</span>
                    <span className="text-xs font-semibold w-14 text-left">{flow.value} طن</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * PartnerPerformanceMatrix — مصفوفة أداء الشركاء
 * تعرض أداء أفضل الشركاء بناءً على الشحنات والأوزان
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PartnerStat {
  name: string;
  shipments: number;
  tons: number;
  score: number;
}

export default function PartnerPerformanceMatrix() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partner-perf-matrix', orgId],
    queryFn: async (): Promise<PartnerStat[]> => {
      if (!orgId) return [];

      // Get shipments with partner org names
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id, disposal_facility_id, quantity, unit, status')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .in('status', ['delivered', 'confirmed'] as any[])
        .limit(500);

      if (!shipments?.length) return [];

      // Collect partner org IDs
      const partnerIds = new Set<string>();
      shipments.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id, s.disposal_facility_id].forEach(id => {
          if (id && id !== orgId) partnerIds.add(id);
        });
      });

      if (partnerIds.size === 0) return [];

      // Fetch org names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(partnerIds).slice(0, 20));

      const orgMap = new Map((orgs || []).map(o => [o.id, o.name]));

      // Aggregate per partner
      const statsMap = new Map<string, { shipments: number; tons: number }>();
      shipments.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id, s.disposal_facility_id].forEach(id => {
          if (id && id !== orgId && orgMap.has(id)) {
            const cur = statsMap.get(id) || { shipments: 0, tons: 0 };
            cur.shipments++;
            const q = s.quantity || 0;
            cur.tons += s.unit === 'kg' ? q / 1000 : q;
            statsMap.set(id, cur);
          }
        });
      });

      const maxShipments = Math.max(...Array.from(statsMap.values()).map(v => v.shipments), 1);

      return Array.from(statsMap.entries())
        .map(([id, stat]) => ({
          name: orgMap.get(id) || 'غير معروف',
          shipments: stat.shipments,
          tons: Math.round(stat.tons * 10) / 10,
          score: Math.round((stat.shipments / maxShipments) * 100),
        }))
        .sort((a, b) => b.shipments - a.shipments)
        .slice(0, 8);
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const tierColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 50) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
    if (score >= 25) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
    return 'text-muted-foreground bg-muted/30';
  };

  const tierLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 50) return 'جيد';
    if (score >= 25) return 'متوسط';
    return 'مبتدئ';
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            مصفوفة أداء الشركاء
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/partners')} className="text-xs">
            عرض الكل <ArrowRight className="h-3 w-3 mr-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}</div>
        ) : !partners?.length ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            لا توجد بيانات شركاء كافية
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {idx < 3 ? <Award className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{p.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColor(p.score)}`}>
                      {tierLabel(p.score)}
                    </Badge>
                  </div>
                  <Progress value={p.score} className="h-1.5" />
                </div>
                <div className="text-left shrink-0">
                  <p className="text-sm font-semibold">{p.shipments}</p>
                  <p className="text-[10px] text-muted-foreground">{p.tons} طن</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

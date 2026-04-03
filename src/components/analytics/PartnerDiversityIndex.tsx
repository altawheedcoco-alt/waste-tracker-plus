/**
 * PartnerDiversityIndex — مؤشر تنوع الشركاء
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Network, AlertTriangle, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerDiversityIndex() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['partner-diversity', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id, transporter_id, total_value')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .limit(500);
      return data || [];
    },
  });

  const analysis = useMemo(() => {
    if (!shipments || shipments.length === 0) return null;
    const partnerRevenue: Record<string, number> = {};
    shipments.forEach(s => {
      const partners = [s.generator_id, s.recycler_id, s.transporter_id].filter(id => id && id !== orgId);
      partners.forEach(id => {
        if (id) partnerRevenue[id] = (partnerRevenue[id] || 0) + (Number(s.total_value) || 0);
      });
    });

    const partnerCount = Object.keys(partnerRevenue).length;
    const totalRevenue = Object.values(partnerRevenue).reduce((s, v) => s + v, 0);
    const sorted = Object.values(partnerRevenue).sort((a, b) => b - a);
    
    // Concentration risk: top partner percentage
    const topPartnerPct = totalRevenue > 0 && sorted.length > 0 ? Math.round((sorted[0] / totalRevenue) * 100) : 0;
    const top3Pct = totalRevenue > 0 ? Math.round((sorted.slice(0, 3).reduce((s, v) => s + v, 0) / totalRevenue) * 100) : 0;
    
    // Diversity score (higher is better - more diverse)
    const diversityScore = Math.min(100, Math.max(0, 100 - topPartnerPct + Math.min(partnerCount * 5, 30)));
    const riskLevel = topPartnerPct > 60 ? 'high' : topPartnerPct > 40 ? 'medium' : 'low';

    return { partnerCount, topPartnerPct, top3Pct, diversityScore, riskLevel };
  }, [shipments, orgId]);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-5 w-5 text-primary" />
          مؤشر تنوع الشركاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{analysis.diversityScore}</div>
              <p className="text-xs text-muted-foreground">درجة التنوع</p>
            </div>
            <Progress value={analysis.diversityScore} className="h-2" />
            
            <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
              {analysis.riskLevel === 'high' ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Shield className="h-4 w-4 text-green-500" />
              )}
              <span className="text-xs">
                {analysis.riskLevel === 'high' ? 'تركيز عالٍ — خطر الاعتماد على شريك واحد' :
                 analysis.riskLevel === 'medium' ? 'تركيز متوسط — يُنصح بتنويع الشركاء' :
                 'تنوع جيد — مخاطر منخفضة'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-bold text-lg">{analysis.partnerCount}</div>
                <div className="text-muted-foreground">شريك</div>
              </div>
              <div>
                <div className="font-bold text-lg">{analysis.topPartnerPct}%</div>
                <div className="text-muted-foreground">أكبر شريك</div>
              </div>
              <div>
                <div className="font-bold text-lg">{analysis.top3Pct}%</div>
                <div className="text-muted-foreground">أكبر 3</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

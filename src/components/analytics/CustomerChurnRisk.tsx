/**
 * CustomerChurnRisk — مؤشر مخاطر فقدان العملاء
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMinus, AlertTriangle, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerChurnRisk() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['churn-risk', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 6);
      const { data } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id, created_at')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', threeMonthsAgo.toISOString())
        .limit(500);
      return data || [];
    },
  });

  const { data: orgNames } = useQuery({
    queryKey: ['churn-org-names', orgId],
    enabled: !!orgId && !!shipments,
    queryFn: async () => {
      const ids = new Set<string>();
      (shipments || []).forEach(s => {
        if (s.generator_id && s.generator_id !== orgId) ids.add(s.generator_id);
        if (s.recycler_id && s.recycler_id !== orgId) ids.add(s.recycler_id);
      });
      if (ids.size === 0) return {};
      const { data } = await supabase.from('organizations').select('id, name').in('id', Array.from(ids).slice(0, 30));
      const map: Record<string, string> = {};
      (data || []).forEach(o => { map[o.id] = o.name; });
      return map;
    },
  });

  const atRisk = useMemo(() => {
    if (!shipments) return [];
    const now = new Date();
    const partnerActivity: Record<string, Date[]> = {};
    
    shipments.forEach(s => {
      const partnerId = s.generator_id !== orgId ? s.generator_id : s.recycler_id;
      if (!partnerId || partnerId === orgId) return;
      if (!partnerActivity[partnerId]) partnerActivity[partnerId] = [];
      partnerActivity[partnerId].push(new Date(s.created_at));
    });

    return Object.entries(partnerActivity)
      .map(([id, dates]) => {
        dates.sort((a, b) => b.getTime() - a.getTime());
        const lastActivity = dates[0];
        const daysSince = Math.ceil((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        const frequency = dates.length;
        const risk = daysSince > 60 ? 'high' : daysSince > 30 ? 'medium' : 'low';
        return { id, name: orgNames?.[id] || 'جهة', daysSince, frequency, risk };
      })
      .filter(p => p.risk !== 'low')
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 6);
  }, [shipments, orgId, orgNames]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserMinus className="h-5 w-5 text-primary" />
          مخاطر فقدان العملاء
          {atRisk.length > 0 && <Badge variant="destructive" className="mr-auto text-[10px]">{atRisk.length} تحذير</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <div className="text-center py-6">
            <TrendingDown className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد مخاطر حالياً — عملاؤك نشطون! 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRisk.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${p.risk === 'high' ? 'text-destructive' : 'text-primary'}`} />
                  <div>
                    <div className="text-xs font-medium">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.frequency} شحنة سابقة</div>
                  </div>
                </div>
                <Badge variant={p.risk === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {p.daysSince} يوم بدون نشاط
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

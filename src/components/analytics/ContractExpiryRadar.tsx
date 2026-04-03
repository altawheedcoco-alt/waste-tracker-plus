/**
 * ContractExpiryRadar — رادار انتهاء التراخيص
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileWarning, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContractExpiryRadar() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: permits, isLoading } = useQuery({
    queryKey: ['contract-expiry', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('permits')
        .select('permit_type, valid_until, status, permit_number')
        .eq('organization_id', orgId!)
        .order('valid_until', { ascending: true })
        .limit(20);
      return data || [];
    },
  });

  const categorized = useMemo(() => {
    const now = new Date();
    const expired: typeof permits = [];
    const critical: typeof permits = [];
    const warning: typeof permits = [];
    const safe: typeof permits = [];

    (permits || []).forEach(p => {
      if (!p.valid_until) return safe!.push(p);
      const days = Math.ceil((new Date(p.valid_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) expired!.push(p);
      else if (days <= 15) critical!.push(p);
      else if (days <= 45) warning!.push(p);
      else safe!.push(p);
    });

    return { expired: expired!, critical: critical!, warning: warning!, safe: safe! };
  }, [permits]);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-xl" />;

  const total = (permits || []).length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-5 w-5 text-primary" />
          رادار انتهاء التراخيص
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد تراخيص</p>
        ) : (
          <div className="space-y-3">
            {categorized.expired.length > 0 && (
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-bold text-destructive">منتهية ({categorized.expired.length})</span>
                </div>
                {categorized.expired.slice(0, 3).map((p, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground">{p.permit_type} - {p.permit_number}</div>
                ))}
              </div>
            )}
            {categorized.critical.length > 0 && (
              <div className="p-2 rounded-lg border border-orange-500/20" style={{ backgroundColor: 'hsl(var(--chart-4) / 0.1)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" style={{ color: 'hsl(var(--chart-4))' }} />
                  <span className="text-xs font-bold" style={{ color: 'hsl(var(--chart-4))' }}>حرجة - أقل من 15 يوم ({categorized.critical.length})</span>
                </div>
                {categorized.critical.slice(0, 3).map((p, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground">{p.permit_type} - ينتهي {p.valid_until}</div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-destructive/10">
                <div className="text-lg font-bold text-destructive">{categorized.expired.length}</div>
                <div className="text-[10px] text-muted-foreground">منتهية</div>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-4) / 0.1)' }}>
                <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-4))' }}>{categorized.critical.length + categorized.warning.length}</div>
                <div className="text-[10px] text-muted-foreground">تحذير</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-primary">{categorized.safe.length}</div>
                <div className="text-[10px] text-muted-foreground">سارية</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

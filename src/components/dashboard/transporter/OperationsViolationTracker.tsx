/**
 * مقارنة التراخيص بالعمليات الفعلية - كشف عمليات خارج النطاق - فكرة #9
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ShieldAlert, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function OperationsViolationTracker() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['ops-violations', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [permits, shipments] = await Promise.all([
        supabase.from('permits' as any).select('conditions, status, permit_type').eq('organization_id', orgId!).in('status', ['active', 'approved']),
        supabase.from('shipments' as any).select('waste_type, pickup_governorate, delivery_governorate, status, created_at')
          .eq('transporter_id', orgId!)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())
          .limit(200),
      ]);
      return { permits: permits.data || [], shipments: shipments.data || [] };
    },
  });

  const analysis = useMemo(() => {
    if (!data) return { violations: [], compliant: 0, total: 0 };

    // Extract authorized waste types & governorates from permits
    const authTypes = new Set<string>();
    const authGovs = new Set<string>();
    let nationwide = false;

    data.permits.forEach(p => {
      const cond = p.conditions as any;
      if (cond?.waste_types) (Array.isArray(cond.waste_types) ? cond.waste_types : []).forEach((t: string) => authTypes.add(t));
      if (cond?.governorates) {
        if (cond.governorates === 'nationwide' || cond.nationwide) nationwide = true;
        else if (Array.isArray(cond.governorates)) cond.governorates.forEach((g: string) => authGovs.add(g));
      }
    });

    const violations: Array<{ type: string; detail: string; severity: 'high' | 'medium' }> = [];
    let compliant = 0;

    data.shipments.forEach(s => {
      let hasIssue = false;

      // Check waste type
      if (s.waste_type && authTypes.size > 0 && !authTypes.has(s.waste_type)) {
        violations.push({
          type: 'نوع مخلفات غير مصرح',
          detail: `${s.waste_type} - غير مدرج في التصاريح`,
          severity: 'high',
        });
        hasIssue = true;
      }

      // Check governorate
      if (!nationwide && authGovs.size > 0) {
        if (s.pickup_governorate && !authGovs.has(s.pickup_governorate)) {
          violations.push({
            type: 'منطقة خارج النطاق',
            detail: `الجمع من ${s.pickup_governorate} - خارج التصريح`,
            severity: 'medium',
          });
          hasIssue = true;
        }
      }

      if (!hasIssue) compliant++;
    });

    return { violations: violations.slice(0, 5), compliant, total: data.shipments.length };
  }, [data]);

  if (isLoading) return <Skeleton className="h-[240px] w-full rounded-xl" />;

  const complianceRate = analysis.total > 0
    ? Math.round((analysis.compliant / analysis.total) * 100)
    : 100;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-primary" />
            رقابة العمليات
          </CardTitle>
          <Badge variant={complianceRate >= 95 ? 'default' : complianceRate >= 80 ? 'secondary' : 'destructive'}>
            {complianceRate}% متوافق
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {analysis.violations.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-600">جميع العمليات متوافقة</p>
            <p className="text-[10px] text-muted-foreground mt-1">{analysis.total} عملية في آخر 30 يوم</p>
          </div>
        ) : (
          <div className="space-y-2">
            {analysis.violations.map((v, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${
                v.severity === 'high' ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <ShieldAlert className={`h-4 w-4 shrink-0 mt-0.5 ${v.severity === 'high' ? 'text-destructive' : 'text-amber-500'}`} />
                <div>
                  <p className="text-xs font-medium">{v.type}</p>
                  <p className="text-[10px] text-muted-foreground">{v.detail}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              {analysis.compliant} عملية متوافقة من {analysis.total}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

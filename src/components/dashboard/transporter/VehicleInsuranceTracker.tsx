/**
 * إدارة تأمين الأسطول - فكرة #26
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function VehicleInsuranceTracker() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicle-insurance', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('vehicles' as any)
        .select('id, plate_number, insurance_expiry, insurance_company, insurance_policy_number, status')
        .eq('organization_id', orgId!)
        .order('insurance_expiry', { ascending: true });
      return data || [];
    },
  });

  const categorized = useMemo(() => {
    const now = new Date();
    const expired: typeof vehicles = [];
    const expiring: typeof vehicles = [];
    const active: typeof vehicles = [];

    (vehicles || []).forEach(v => {
      if (!v.insurance_expiry) { expired!.push(v); return; }
      const days = Math.ceil((new Date(v.insurance_expiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) expired!.push(v);
      else if (days <= 30) expiring!.push(v);
      else active!.push(v);
    });

    return { expired: expired!, expiring: expiring!, active: active! };
  }, [vehicles]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          تأمين الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{categorized.expired.length}</div>
            <div className="text-[9px] text-muted-foreground">منتهي</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="text-lg font-bold text-amber-600">{categorized.expiring.length}</div>
            <div className="text-[9px] text-muted-foreground">يقترب</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-600">{categorized.active.length}</div>
            <div className="text-[9px] text-muted-foreground">ساري</div>
          </div>
        </div>

        {categorized.expired.length > 0 && (
          <div className="space-y-1">
            {categorized.expired.slice(0, 3).map(v => (
              <div key={v.id} className="flex items-center justify-between p-1.5 rounded bg-destructive/5 text-xs">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  {v.plate_number}
                </span>
                <Badge variant="destructive" className="text-[9px]">منتهي</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

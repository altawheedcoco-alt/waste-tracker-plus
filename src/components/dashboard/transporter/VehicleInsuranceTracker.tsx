/**
 * إدارة تأمين الأسطول - فكرة #26
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
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
        .from('fleet_vehicles')
        .select('id, plate_number, status')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const categorized = useMemo(() => {
    const active = (vehicles || []).filter((v: any) => v.status === 'active');
    const maintenance = (vehicles || []).filter((v: any) => v.status === 'maintenance');
    const inactive = (vehicles || []).filter((v: any) => v.status !== 'active' && v.status !== 'maintenance');

    return { active, maintenance, inactive };
  }, [vehicles]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          حالة الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-lg font-bold text-emerald-600">{categorized.active.length}</div>
            <div className="text-[9px] text-muted-foreground">نشطة</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="text-lg font-bold text-amber-600">{categorized.maintenance.length}</div>
            <div className="text-[9px] text-muted-foreground">صيانة</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{categorized.inactive.length}</div>
            <div className="text-[9px] text-muted-foreground">أخرى</div>
          </div>
        </div>

        {categorized.maintenance.length > 0 && (
          <div className="space-y-1">
            {categorized.maintenance.slice(0, 3).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-1.5 rounded bg-amber-500/5 text-xs">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {v.plate_number}
                </span>
                <Badge variant="secondary" className="text-[9px]">صيانة</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
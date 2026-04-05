/**
 * نظام توزيع الشحنات الذكي - فكرة #47
 * AI يختار أفضل سائق ومركبة
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, User, Truck, MapPin, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function SmartDispatchWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['smart-dispatch', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [pending, drivers, vehicles] = await Promise.all([
        supabase.from('shipments').select('id, tracking_number, waste_type, pickup_governorate, actual_weight')
          .eq('transporter_id', orgId!).in('status', ['approved']).limit(5),
        supabase.from('drivers').select('id, full_name, current_status, rating, total_trips')
          .eq('organization_id', orgId!).eq('is_active', true),
        supabase.from('vehicles').select('id, plate_number, capacity_tons, status, vehicle_type')
          .eq('organization_id', orgId!).eq('status', 'active'),
      ]);
      return {
        pending: pending.data || [],
        availableDrivers: (drivers.data || []).filter(d => d.current_status !== 'driving'),
        availableVehicles: vehicles.data || [],
      };
    },
  });

  if (isLoading) return <Skeleton className="h-[240px] w-full rounded-xl" />;

  const pendingCount = data?.pending.length || 0;
  const driversAvail = data?.availableDrivers.length || 0;
  const vehiclesAvail = data?.availableVehicles.length || 0;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          التوزيع الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <div className="text-lg font-bold text-amber-600">{pendingCount}</div>
            <div className="text-[9px] text-muted-foreground">شحنة بانتظار التوزيع</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <User className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-600">{driversAvail}</div>
            <div className="text-[9px] text-muted-foreground">سائق متاح</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Truck className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-600">{vehiclesAvail}</div>
            <div className="text-[9px] text-muted-foreground">مركبة متاحة</div>
          </div>
        </div>

        {pendingCount > 0 && driversAvail > 0 && (
          <Button variant="outline" size="sm" className="w-full text-xs">
            <Brain className="h-3.5 w-3.5 ml-1" />
            توزيع تلقائي بالذكاء الاصطناعي
          </Button>
        )}

        {pendingCount === 0 && (
          <div className="text-center py-2">
            <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">جميع الشحنات موزعة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * بطاقة هوية رقمية لكل مركبة - فكرة #16
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Shield, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VehicleIdentityCard() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicle-cards', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('fleet_vehicles')
        .select('id, plate_number, vehicle_type, status, year, model')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []) as any[];
    },
  });

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5 text-primary" />
          بطاقات المركبات
          <Badge variant="outline" className="text-[10px]">{vehicles?.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!vehicles?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد مركبات مسجلة</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {vehicles.map((v: any) => (
                <div key={v.id} className="p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold">{v.plate_number || 'بدون لوحة'}</span>
                    </div>
                    <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="text-[9px]">
                      {v.status === 'active' ? 'نشطة' : v.status === 'maintenance' ? 'صيانة' : v.status || 'غير محدد'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>النوع:</span>
                      <span className="font-medium text-foreground">{v.vehicle_type || '—'}</span>
                    </div>
                    {v.model && (
                      <div className="flex items-center gap-1">
                        <span>الموديل:</span>
                        <span className="font-medium text-foreground">{v.model} {v.year || ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
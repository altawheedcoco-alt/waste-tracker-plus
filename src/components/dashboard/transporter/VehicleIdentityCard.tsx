/**
 * بطاقة هوية رقمية لكل مركبة - فكرة #16
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Shield, Fuel, Wrench, Calendar } from 'lucide-react';
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
        .from('vehicles')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  const getStatusBadge = (vehicle: any) => {
    const now = new Date();
    const insExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null;
    const techDate = vehicle.technical_inspection_date ? new Date(vehicle.technical_inspection_date) : null;

    if (insExpiry && insExpiry < now) return { label: 'تأمين منتهي', variant: 'destructive' as const };
    if (vehicle.status === 'maintenance') return { label: 'صيانة', variant: 'secondary' as const };
    if (vehicle.status === 'active') return { label: 'نشطة', variant: 'default' as const };
    return { label: vehicle.status || 'غير محدد', variant: 'outline' as const };
  };

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
              {vehicles.map(v => {
                const status = getStatusBadge(v);
                return (
                  <div key={v.id} className="p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold">{v.plate_number || 'بدون لوحة'}</span>
                      </div>
                      <Badge variant={status.variant} className="text-[9px]">{status.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>النوع:</span>
                        <span className="font-medium text-foreground">{v.vehicle_type || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>الحمولة:</span>
                        <span className="font-medium text-foreground">{v.capacity_tons ? `${v.capacity_tons} طن` : '—'}</span>
                      </div>
                      {v.insurance_expiry && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>التأمين: {new Date(v.insurance_expiry).toLocaleDateString('ar-EG')}</span>
                        </div>
                      )}
                      {v.technical_inspection_date && (
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span>الفحص: {new Date(v.technical_inspection_date).toLocaleDateString('ar-EG')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

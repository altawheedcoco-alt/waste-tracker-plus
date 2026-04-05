/**
 * مركز ملفات السائقين الشامل - فكرة #31
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function DriverProfileHub() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['driver-profiles-hub', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, profile_id, license_number, license_expiry, vehicle_type, vehicle_plate, is_available')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(15);
      return (data || []) as any[];
    },
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  const activeCount = drivers?.filter((d: any) => d.is_available).length || 0;
  const total = drivers?.length || 0;
  const now = new Date();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            فريق السائقين
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="default" className="text-[10px]">{activeCount} متاح</Badge>
            <Badge variant="outline" className="text-[10px]">{total} إجمالي</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!drivers?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا يوجد سائقون مسجلون</p>
        ) : (
          <ScrollArea className="h-[220px]">
            <div className="space-y-2 pr-2">
              {drivers.map((d: any) => {
                const licenseExpired = d.license_expiry ? new Date(d.license_expiry) < now : false;
                const initials = (d.license_number || '').slice(0, 2);
                return (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {initials || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">رخصة: {d.license_number || 'بدون'}</p>
                        {!d.is_available && <Badge variant="secondary" className="text-[8px]">غير متاح</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {d.vehicle_plate && <span>{d.vehicle_plate}</span>}
                        {d.vehicle_type && <span>{d.vehicle_type}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {licenseExpired ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
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
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
        .select('id, full_name, phone, license_expiry, license_type, is_active, rating, total_trips, training_status')
        .eq('organization_id', orgId!)
        .order('is_active', { ascending: false })
        .limit(15);
      return data || [];
    },
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  const activeCount = drivers?.filter(d => d.is_active).length || 0;
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
            <Badge variant="default" className="text-[10px]">{activeCount} نشط</Badge>
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
              {drivers.map(d => {
                const licenseExpired = d.license_expiry ? new Date(d.license_expiry) < now : false;
                const initials = (d.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2);
                return (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {initials || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">{d.full_name || 'بدون اسم'}</p>
                        {!d.is_active && <Badge variant="secondary" className="text-[8px]">غير نشط</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {d.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{d.phone}</span>}
                        {d.total_trips != null && <span>{d.total_trips} رحلة</span>}
                        {d.rating != null && (
                          <span className="flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 text-amber-500" />
                            {Number(d.rating).toFixed(1)}
                          </span>
                        )}
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

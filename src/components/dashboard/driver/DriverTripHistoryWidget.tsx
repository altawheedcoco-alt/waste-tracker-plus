/**
 * ودجة سجل الرحلات للسائق
 * يعرض آخر الرحلات مع حالاتها
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, CheckCircle2, Clock, XCircle, MapPin, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const DriverTripHistoryWidget = () => {
  const { profile } = useAuth();

  const { data: trips } = useQuery({
    queryKey: ['driver-trips-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, status, pickup_address, delivery_address, created_at, actual_weight, quantity')
        .eq('driver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 3,
  });

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    delivered: { icon: <CheckCircle2 className="h-3 w-3 text-green-500" />, color: 'bg-green-500/10 text-green-700 dark:text-green-300', label: 'تم التسليم' },
    confirmed: { icon: <CheckCircle2 className="h-3 w-3 text-green-500" />, color: 'bg-green-500/10 text-green-700 dark:text-green-300', label: 'مؤكد' },
    in_transit: { icon: <Clock className="h-3 w-3 text-blue-500" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', label: 'في الطريق' },
    pending: { icon: <Clock className="h-3 w-3 text-amber-500" />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'معلق' },
    cancelled: { icon: <XCircle className="h-3 w-3 text-destructive" />, color: 'bg-red-500/10 text-red-700 dark:text-red-300', label: 'ملغي' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" />
          سجل الرحلات الأخيرة
          {trips && trips.length > 0 && (
            <Badge variant="secondary" className="text-[9px] mr-auto">
              {trips.length} رحلة
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!trips?.length ? (
          <div className="text-center py-4">
            <Route className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد رحلات بعد</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {trips.map((trip: any) => {
              const config = statusConfig[trip.status] || statusConfig.pending;
              return (
                <div key={trip.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  {config.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {trip.pickup_address?.split(',')[0] || 'نقطة الاستلام'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {Number(trip.actual_weight || trip.quantity || 0).toLocaleString('ar-EG')} كجم • {formatDistanceToNow(new Date(trip.created_at), { locale: ar, addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[8px] border-0 ${config.color}`}>
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverTripHistoryWidget;

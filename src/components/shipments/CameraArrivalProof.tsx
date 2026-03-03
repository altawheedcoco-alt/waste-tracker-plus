import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, Clock, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CameraArrivalProofProps {
  shipmentId: string;
  compact?: boolean;
}

const CameraArrivalProof = ({ shipmentId, compact = false }: CameraArrivalProofProps) => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['camera-arrivals', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camera_arrival_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_timestamp', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!shipmentId,
  });

  if (isLoading || events.length === 0) {
    if (compact) return null;
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="py-4 text-center text-muted-foreground text-sm">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>لم يتم رصد وصول بالكاميرا بعد</p>
        </CardContent>
      </Card>
    );
  }

  const latestEvent = events[0] as any;
  const isVerified = latestEvent.arrival_verified;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
        isVerified 
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
      }`}>
        {isVerified ? (
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="font-medium">
          {isVerified ? 'وصول مؤكد بالكاميرا' : 'تم رصد مركبة - بدون مطابقة'}
        </span>
        <span className="text-[10px] opacity-70 mr-auto">
          {format(new Date(latestEvent.event_timestamp), 'HH:mm · dd/MM', { locale: ar })}
        </span>
      </div>
    );
  }

  return (
    <Card className={isVerified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30'}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Camera className="w-4 h-4 text-primary" />
          تأكيد الوصول بالكاميرا
          <Badge 
            variant="outline" 
            className={`mr-auto text-[10px] ${
              isVerified 
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
            }`}
          >
            {isVerified ? 'مؤكد ✓' : 'قيد التحقق'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event: any) => (
          <div key={event.id} className="flex gap-3 items-start">
            {event.photo_url ? (
              <img
                src={event.photo_url}
                alt="صورة الكاميرا"
                className="w-20 h-14 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center">
                <Camera className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {event.arrival_verified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  لوحة: {event.plate_number}
                </span>
                {event.confidence_score && (
                  <Badge variant="outline" className="text-[9px]">
                    دقة {Math.round(event.confidence_score * 100)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(event.event_timestamp), 'HH:mm:ss · yyyy/MM/dd', { locale: ar })}
                </span>
                {event.plate_matched && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <MapPin className="w-3 h-3" />
                    مطابقة مؤكدة
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CameraArrivalProof;

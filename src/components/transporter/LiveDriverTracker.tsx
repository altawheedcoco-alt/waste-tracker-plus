/**
 * تتبع السائق المعيّن لحظياً — عرض للناقل أثناء الرحلة
 * مشابه لشاشة تتبع أوبر/ديدي
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Phone, Navigation, Truck, Clock,
  Loader2, CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const TRIP_STAGES = [
  { key: 'approved', label: 'تم القبول', icon: CheckCircle2, color: 'text-emerald-500' },
  { key: 'collecting', label: 'متجه للاستلام', icon: Navigation, color: 'text-blue-500' },
  { key: 'in_transit', label: 'في الطريق', icon: Truck, color: 'text-primary' },
  { key: 'delivered', label: 'تم التسليم', icon: CheckCircle2, color: 'text-emerald-600' },
];

const LiveDriverTracker = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: activeTrips = [], isLoading } = useQuery({
    queryKey: ['transporter-active-trips', orgId],
    enabled: !!orgId,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, status, waste_type, quantity, unit,
          pickup_address, delivery_address, driver_id,
          approved_at, collection_started_at, in_transit_at, delivered_at
        `)
        .eq('transporter_id', orgId!)
        .not('driver_id', 'is', null)
        .in('status', ['approved', 'collecting', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      if (!data?.length) return [];

      const driverIds = [...new Set(data.map(s => s.driver_id).filter(Boolean))] as string[];
      
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_plate, vehicle_type, rating, total_trips, is_available, profile_id')
        .in('id', driverIds);

      const profileIds = (drivers || []).map(d => d.profile_id).filter(Boolean) as string[];
      const { data: profiles } = profileIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, phone, avatar_url').in('id', profileIds)
        : { data: [] };

      const driverMap = new Map((drivers || []).map(d => [d.id, d]));
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return data.map(shipment => {
        const driver = driverMap.get(shipment.driver_id!) || null;
        const driverProfile = driver?.profile_id ? profileMap.get(driver.profile_id) || null : null;
        return { ...shipment, driver, driverProfile };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activeTrips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Navigation className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold text-sm mb-1">لا توجد رحلات نشطة</h3>
          <p className="text-xs text-muted-foreground">
            عندما يبدأ سائق رحلة، ستظهر هنا مع التتبع اللحظي
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Navigation className="w-5 h-5 text-primary" />
        تتبع الرحلات النشطة
        <Badge variant="default" className="text-xs">{activeTrips.length}</Badge>
      </h2>

      {activeTrips.map((trip: any) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

const TripCard = ({ trip }: { trip: any }) => {
  const currentStageIndex = TRIP_STAGES.findIndex(s => s.key === trip.status);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const startTime = trip.approved_at ? new Date(trip.approved_at).getTime() : Date.now();
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      setElapsed(h > 0 ? `${h}س ${m}د` : `${m} دقيقة`);
    }, 1000);
    return () => clearInterval(iv);
  }, [trip.approved_at]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20 overflow-hidden">
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStageIndex + 1) / TRIP_STAGES.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="w-3 h-3" /> {elapsed}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">{trip.shipment_number}</span>
              <p className="text-[10px] text-muted-foreground">{trip.waste_type} • {trip.quantity} {trip.unit}</p>
            </div>
          </div>

          {/* Driver info */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {trip.driverProfile?.phone && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => window.open(`tel:${trip.driverProfile.phone}`)}
                >
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{trip.driverProfile?.full_name || 'السائق'}</p>
              <div className="flex items-center gap-2 justify-end text-[10px] text-muted-foreground">
                <span>🚛 {trip.driver?.vehicle_plate}</span>
                <span>⭐ {trip.driver?.rating?.toFixed(1)}</span>
                <span>{trip.driver?.total_trips || 0} رحلة</span>
              </div>
            </div>
          </div>

          {/* Trip stages */}
          <div className="flex items-center justify-between px-1">
            {TRIP_STAGES.map((stage, i) => {
              const isCompleted = i <= currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const StageIcon = stage.icon;
              return (
                <div key={stage.key} className="flex flex-col items-center gap-1 flex-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                    isCurrent ? 'border-primary bg-primary/10 scale-110' :
                    isCompleted ? 'border-emerald-500 bg-emerald-500/10' :
                    'border-border bg-muted/50'
                  )}>
                    <StageIcon className={cn(
                      'w-3.5 h-3.5',
                      isCurrent ? 'text-primary' :
                      isCompleted ? 'text-emerald-500' :
                      'text-muted-foreground/50'
                    )} />
                  </div>
                  <span className={cn(
                    'text-[8px] text-center leading-tight',
                    isCurrent ? 'text-primary font-bold' :
                    isCompleted ? 'text-foreground' :
                    'text-muted-foreground/50'
                  )}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Route */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground truncate">{trip.pickup_address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground truncate">{trip.delivery_address}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiveDriverTracker;

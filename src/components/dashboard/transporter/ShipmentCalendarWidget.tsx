import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Truck, MapPin, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CalendarShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  pickup_address: string;
  delivery_address: string;
  generator_name: string;
  recycler_name: string;
}

const ShipmentCalendarWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 6 }); // Saturday
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['transporter-calendar', orgId, weekOffset],
    queryFn: async () => {
      if (!orgId) return [];

      const rangeStart = format(weekDays[0], 'yyyy-MM-dd');
      const rangeEnd = format(addDays(weekDays[6], 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, pickup_date, expected_delivery_date, pickup_address, delivery_address, generator_id, recycler_id')
        .eq('transporter_id', orgId)
        .not('status', 'in', '("cancelled","confirmed")')
        .or(`pickup_date.gte.${rangeStart},expected_delivery_date.gte.${rangeStart}`)
        .or(`pickup_date.lte.${rangeEnd},expected_delivery_date.lte.${rangeEnd}`)
        .order('pickup_date', { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      // Fetch org names
      const allIds = [...new Set([
        ...data.map(s => s.generator_id),
        ...data.map(s => s.recycler_id),
      ].filter(Boolean))] as string[];

      const orgMap = new Map<string, string>();
      if (allIds.length > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', allIds);
        orgs?.forEach(o => orgMap.set(o.id, o.name));
      }

      return data.map(s => ({
        ...s,
        generator_name: s.generator_id ? orgMap.get(s.generator_id) || '' : '',
        recycler_name: s.recycler_id ? orgMap.get(s.recycler_id) || '' : '',
      }));
    },
    enabled: !!orgId,
  });

  const getShipmentsForDay = (day: Date) => {
    return shipments.filter(s => {
      const pickup = s.pickup_date ? parseISO(s.pickup_date) : null;
      const delivery = s.expected_delivery_date ? parseISO(s.expected_delivery_date) : null;
      return (pickup && isSameDay(pickup, day)) || (delivery && isSameDay(delivery, day));
    });
  };

  const statusDot: Record<string, string> = {
    new: 'bg-blue-500',
    approved: 'bg-amber-500',
    in_transit: 'bg-purple-500',
    delivered: 'bg-emerald-500',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Calendar className="w-5 h-5" /> تقويم الشحنات</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(p => p - 1)}>→</Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(0)}>اليوم</Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(p => p + 1)}>←</Button>
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="w-5 h-5 text-primary" />
            تقويم الشحنات
          </CardTitle>
        </div>
        <CardDescription className="text-right">
          {format(weekDays[0], 'dd MMM', { locale: ar })} - {format(weekDays[6], 'dd MMM yyyy', { locale: ar })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1" dir="rtl">
          {/* Day headers */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'text-center text-xs font-medium py-1 rounded-t',
                isToday(day) && 'bg-primary/10 text-primary'
              )}
            >
              {format(day, 'EEE', { locale: ar })}
              <div className={cn(
                'text-lg font-bold',
                isToday(day) && 'text-primary'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
          {/* Day cells */}
          {weekDays.map((day) => {
            const dayShipments = getShipmentsForDay(day);
            return (
              <div
                key={`cell-${day.toISOString()}`}
                className={cn(
                  'min-h-[80px] border rounded-b p-1 text-xs space-y-0.5',
                  isToday(day) && 'border-primary/30 bg-primary/5'
                )}
              >
                {dayShipments.slice(0, 3).map((s) => {
                  const isPickup = s.pickup_date && isSameDay(parseISO(s.pickup_date), day);
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        'rounded px-1 py-0.5 truncate flex items-center gap-1',
                        isPickup ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      )}
                      title={`${s.shipment_number} - ${isPickup ? 'استلام' : 'تسليم'}`}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[s.status] || 'bg-muted-foreground')} />
                      <span className="truncate">{isPickup ? '↑' : '↓'} {s.shipment_number.slice(-4)}</span>
                    </div>
                  );
                })}
                {dayShipments.length > 3 && (
                  <span className="text-muted-foreground text-[10px]">+{dayShipments.length - 3} أخرى</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> استلام</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> تسليم</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipmentCalendarWidget;

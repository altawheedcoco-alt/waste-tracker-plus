import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Clock,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface SlotBookingWidgetProps {
  recyclerOrganizationId: string;
  shipmentId: string;
  onBooked?: (bookingId: string) => void;
}

const SlotBookingWidget = ({ recyclerOrganizationId, shipmentId, onBooked }: SlotBookingWidgetProps) => {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedSlot, setSelectedSlot] = useState<{ timeslotId: string; date: Date; start: string; end: string } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({ vehicle_plate: '', driver_name: '', driver_phone: '', notes: '' });

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Fetch timeslots for this recycler
  const { data: timeslots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['recycler-timeslots', recyclerOrganizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recycler_timeslots')
        .select('*')
        .eq('organization_id', recyclerOrganizationId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing bookings for this week
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['slot-bookings', recyclerOrganizationId, weekStart.toISOString()],
    queryFn: async () => {
      const start = format(weekDates[0], 'yyyy-MM-dd');
      const end = format(weekDates[6], 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('recycler_organization_id', recyclerOrganizationId)
        .eq('status', 'confirmed')
        .gte('booking_date', start)
        .lte('booking_date', end);
      if (error) throw error;
      return data;
    },
  });

  // Check if shipment already booked
  const { data: existingBooking } = useQuery({
    queryKey: ['shipment-booking', shipmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('slot_bookings')
        .select('*')
        .eq('shipment_id', shipmentId)
        .eq('status', 'confirmed')
        .maybeSingle();
      return data;
    },
  });

  const getAvailability = (timeslotId: string, date: Date): number => {
    const slot = timeslots.find(s => s.id === timeslotId);
    if (!slot) return 0;
    const dateStr = format(date, 'yyyy-MM-dd');
    const booked = bookings.filter(b => b.timeslot_id === timeslotId && b.booking_date === dateStr).length;
    return slot.max_capacity - booked;
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !organization?.id) throw new Error('Missing data');
      const { error } = await supabase.from('slot_bookings').insert({
        timeslot_id: selectedSlot.timeslotId,
        shipment_id: shipmentId,
        recycler_organization_id: recyclerOrganizationId,
        booked_by_organization_id: organization.id,
        booked_by_user_id: profile?.id,
        booking_date: format(selectedSlot.date, 'yyyy-MM-dd'),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        vehicle_plate: bookingDetails.vehicle_plate || null,
        driver_name: bookingDetails.driver_name || null,
        driver_phone: bookingDetails.driver_phone || null,
        notes: bookingDetails.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-booking'] });
      setShowConfirmDialog(false);
      setSelectedSlot(null);
      toast.success('✅ تم حجز الموعد بنجاح');
      onBooked?.('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isLoading = loadingSlots || loadingBookings;

  if (existingBooking) {
    return (
      <Card className="border-primary/30 bg-primary/5" dir="rtl">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-primary">تم حجز موعد</p>
            <p className="text-sm text-muted-foreground">
              📅 {existingBooking.booking_date} | ⏰ {existingBooking.start_time?.slice(0, 5)} - {existingBooking.end_time?.slice(0, 5)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (timeslots.length === 0) {
    return (
      <Card dir="rtl">
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>لا توجد فترات زمنية متاحة لدى جهة الاستلام</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => addDays(prev, 7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(weekDates[0], 'd MMM', { locale: ar })} - {format(weekDates[6], 'd MMM yyyy', { locale: ar })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => addDays(prev, -7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slots grid */}
      <div className="space-y-2">
        {weekDates.map((date, di) => {
          const daySlots = timeslots.filter(s => s.day_of_week === date.getDay());
          if (daySlots.length === 0) return null;
          const isToday = isSameDay(date, new Date());
          const isPast = date < new Date() && !isToday;

          return (
            <div key={di} className={cn('rounded-lg border p-2', isToday && 'border-primary/50 bg-primary/5')}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('text-xs font-semibold', isToday && 'text-primary')}>
                  {DAYS_AR[date.getDay()]} {format(date, 'd/M')}
                </span>
                {isToday && <Badge variant="default" className="text-[10px] px-1.5 py-0">اليوم</Badge>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {daySlots.map(slot => {
                  const avail = getAvailability(slot.id, date);
                  const isFull = avail <= 0;
                  const isSelected = selectedSlot?.timeslotId === slot.id && isSameDay(selectedSlot.date, date);

                  return (
                    <button
                      key={slot.id}
                      disabled={isFull || isPast}
                      onClick={() => {
                        setSelectedSlot({
                          timeslotId: slot.id,
                          date,
                          start: slot.start_time,
                          end: slot.end_time,
                        });
                        setShowConfirmDialog(true);
                      }}
                      className={cn(
                        'p-2 rounded-md border text-xs text-center transition-all',
                        isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/30' :
                        isFull ? 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50' :
                        isPast ? 'bg-muted/30 cursor-not-allowed opacity-40' :
                        avail <= 1 ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' :
                        'hover:border-primary/50 hover:bg-primary/5'
                      )}
                    >
                      <div className="font-mono font-medium">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </div>
                      <div className={cn(
                        'text-[10px] mt-0.5',
                        isFull ? 'text-destructive' : avail <= 1 ? 'text-amber-600' : 'text-muted-foreground'
                      )}>
                        {isFull ? 'ممتلئ' : `${avail} متاح`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              تأكيد حجز الموعد
            </DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  📅 {format(selectedSlot.date, 'EEEE d MMMM yyyy', { locale: ar })}
                  {' | '}⏰ {selectedSlot.start.slice(0, 5)} - {selectedSlot.end.slice(0, 5)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>رقم لوحة المركبة (اختياري)</Label>
              <Input
                value={bookingDetails.vehicle_plate}
                onChange={e => setBookingDetails(p => ({ ...p, vehicle_plate: e.target.value }))}
                placeholder="مثال: أ ب ت 1234"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم السائق</Label>
                <Input
                  value={bookingDetails.driver_name}
                  onChange={e => setBookingDetails(p => ({ ...p, driver_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>هاتف السائق</Label>
                <Input
                  value={bookingDetails.driver_phone}
                  onChange={e => setBookingDetails(p => ({ ...p, driver_phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={bookingDetails.notes}
                onChange={e => setBookingDetails(p => ({ ...p, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
              />
            </div>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="w-full gap-2"
            >
              {bookMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              تأكيد الحجز
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlotBookingWidget;

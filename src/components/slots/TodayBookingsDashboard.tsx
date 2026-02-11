import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TodayBookingsDashboard = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['today-bookings', orgId, today],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('slot_bookings')
        .select(`
          *,
          shipment:shipments(shipment_number, waste_type, quantity)
        `)
        .eq('recycler_organization_id', orgId)
        .eq('booking_date', today)
        .neq('status', 'cancelled')
        .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const handleCheckIn = async (bookingId: string) => {
    const { error } = await supabase
      .from('slot_bookings')
      .update({ checked_in_at: new Date().toISOString() } as any)
      .eq('id', bookingId);
    if (error) { toast.error('خطأ'); return; }
    toast.success('✅ تم تسجيل الدخول');
    refetch();
  };

  const handleCheckOut = async (bookingId: string) => {
    const { error } = await supabase
      .from('slot_bookings')
      .update({ checked_out_at: new Date().toISOString(), status: 'completed' } as any)
      .eq('id', bookingId);
    if (error) { toast.error('خطأ'); return; }
    toast.success('✅ تم تسجيل الخروج');
    refetch();
  };

  const handleNoShow = async (bookingId: string) => {
    const { error } = await supabase
      .from('slot_bookings')
      .update({ status: 'no_show' } as any)
      .eq('id', bookingId);
    if (error) { toast.error('خطأ'); return; }
    toast.success('تم تسجيل عدم الحضور');
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const statusBadge = (b: any) => {
    if (b.status === 'completed') return <Badge className="bg-emerald-100 text-emerald-700 border-0">مكتمل</Badge>;
    if (b.status === 'no_show') return <Badge variant="destructive">لم يحضر</Badge>;
    if (b.checked_in_at) return <Badge className="bg-blue-100 text-blue-700 border-0">داخل الموقع</Badge>;
    return <Badge variant="outline">في الانتظار</Badge>;
  };

  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          حجوزات اليوم
          <Badge variant="secondary">{bookings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد حجوزات اليوم</p>
        ) : (
          bookings.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
              <div className="flex items-center gap-2">
                {b.status === 'confirmed' && !b.checked_in_at && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCheckIn(b.id)}>
                      <CheckCircle2 className="h-3 w-3" /> دخول
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive gap-1" onClick={() => handleNoShow(b.id)}>
                      <XCircle className="h-3 w-3" /> لم يحضر
                    </Button>
                  </>
                )}
                {b.checked_in_at && !b.checked_out_at && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCheckOut(b.id)}>
                    <Truck className="h-3 w-3" /> خروج
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 text-right">
                {statusBadge(b)}
                <div>
                  <div className="font-medium">{(b.shipment as any)?.shipment_number || '—'}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                    {b.driver_name && ` | ${b.driver_name}`}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TodayBookingsDashboard;

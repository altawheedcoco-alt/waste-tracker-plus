import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, Truck, Calendar, MapPin, DollarSign } from 'lucide-react';

interface Props {
  bookings: any[];
  onRefresh: () => void;
  isOwner?: boolean;
}

const BookingRequestsPanel = ({ bookings, onRefresh, isOwner }: Props) => {
  const handleAction = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'approved') updates.approved_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase.from('vehicle_bookings').update(updates).eq('id', id);
    if (error) { toast.error('خطأ في تحديث الحالة'); return; }
    toast.success('تم تحديث الحالة');
    onRefresh();
  };

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'معلق', variant: 'secondary', icon: Clock },
    approved: { label: 'موافق عليه', variant: 'default', icon: CheckCircle2 },
    rejected: { label: 'مرفوض', variant: 'destructive', icon: XCircle },
    in_progress: { label: 'قيد التنفيذ', variant: 'outline', icon: Truck },
    completed: { label: 'مكتمل', variant: 'default', icon: CheckCircle2 },
    cancelled: { label: 'ملغى', variant: 'destructive', icon: XCircle },
  };

  const bookingTypeLabels: Record<string, string> = {
    single_trip: 'رحلة واحدة',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
  };

  if (bookings.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد طلبات حجز</CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map(b => {
        const sc = statusConfig[b.status] || statusConfig.pending;
        const StatusIcon = sc.icon;
        return (
          <Card key={b.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={sc.variant}><StatusIcon className="w-3 h-3 mr-1" />{sc.label}</Badge>
                    <Badge variant="outline">{bookingTypeLabels[b.booking_type] || b.booking_type}</Badge>
                  </div>
                  <p className="font-semibold flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    {b.fleet_vehicles?.plate_number || 'مركبة'}
                    {' - '}
                    {b.fleet_vehicles?.vehicle_type === 'truck' ? 'شاحنة' : b.fleet_vehicles?.vehicle_type}
                  </p>
                  {b.requester?.name && <p className="text-sm text-muted-foreground">الطالب: {b.requester.name}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.start_date}</span>
                    {b.pickup_location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.pickup_location}</span>}
                    {b.agreed_price && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{b.agreed_price} ج.م</span>}
                    {b.waste_type && <span>نوع المخلف: {b.waste_type}</span>}
                  </div>
                  {b.requester_notes && <p className="text-xs bg-muted p-2 rounded mt-1">{b.requester_notes}</p>}
                </div>

                {isOwner && b.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleAction(b.id, 'approved')} className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> موافقة
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(b.id, 'rejected')} className="gap-1">
                      <XCircle className="w-3 h-3" /> رفض
                    </Button>
                  </div>
                )}
                {isOwner && b.status === 'approved' && (
                  <Button size="sm" onClick={() => handleAction(b.id, 'completed')} className="gap-1">
                    <CheckCircle2 className="w-3 h-3" /> إكمال
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BookingRequestsPanel;

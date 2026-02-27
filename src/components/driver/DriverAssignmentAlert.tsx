import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  MapPin,
  Package,
  Building2,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTabChannelName } from '@/lib/tabSession';
import { playNotificationSound } from '@/hooks/useNotificationSound';
import { useNavigate } from 'react-router-dom';

interface AssignmentNotification {
  id: string;
  title: string;
  message: string;
  shipment_id: string | null;
  metadata: {
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    generator_name: string;
    transporter_name: string;
    recycler_name: string;
    disposal_name: string;
    pickup_address: string;
    delivery_address: string;
    driver_name: string;
    status: string;
    notes: string;
  };
  created_at: string;
}

const DriverAssignmentAlert = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AssignmentNotification | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check for unread driver_assignment notifications on mount
    const checkExisting = async () => {
      const { data } = await (supabase.from('notifications') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'driver_assignment')
        .eq('is_read', false)
        .eq('priority', 'urgent')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setAlert(data[0]);
        setOpen(true);
      }
    };

    checkExisting();

    // Listen for new driver_assignment notifications in realtime
    const channel = supabase
      .channel(getTabChannelName('driver-assignment-alert'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const notif = payload.new;
          if (notif.type === 'driver_assignment' && notif.priority === 'urgent') {
            setAlert(notif);
            setOpen(true);
            playNotificationSound('shipment_created');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcknowledge = async () => {
    if (!alert) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', alert.id);
    setOpen(false);
  };

  const handleNavigateToShipment = async () => {
    if (!alert?.shipment_id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', alert.id);
    setOpen(false);
    navigate(`/dashboard`);
  };

  if (!alert) return null;

  const meta = alert.metadata;
  const destination = meta?.recycler_name || meta?.disposal_name || 'غير محدد';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleAcknowledge(); setOpen(v); }}>
      <DialogContent className="max-w-md p-0 overflow-y-auto border-2 border-amber-500/50 rounded-2xl" dir="rtl">
        {/* Urgent Header */}
        <div className="bg-gradient-to-l from-amber-500 to-orange-600 p-4 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <div className="p-2 bg-white/20 rounded-full animate-pulse">
                <Truck className="w-6 h-6" />
              </div>
              مهمة شحنة جديدة!
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/90 text-sm mt-2">
            تم تعيينك لنقل شحنة جديدة. يرجى مراجعة التفاصيل والتحرك.
          </p>
        </div>

        {/* Shipment Details */}
        <div className="p-4 space-y-3">
          {/* Shipment Number */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-sm px-3 py-1">
              {meta?.shipment_number || 'غير محدد'}
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 gap-1">
              <AlertTriangle className="w-3 h-3" />
              عاجل
            </Badge>
          </div>

          {/* Waste Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">نوع المخلفات:</span>
              <strong>{meta?.waste_type || 'غير محدد'}</strong>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">الكمية:</span>
              <strong>{meta?.quantity || 0} {meta?.unit || 'طن'}</strong>
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-2">
            {/* Pickup */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
              <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900 mt-0.5">
                <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">نقطة الاستلام (المولد)</p>
                <p className="font-semibold text-sm">{meta?.generator_name || 'غير محدد'}</p>
                {meta?.pickup_address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.pickup_address}</p>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="p-1 rounded-full bg-muted">
                <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
              </div>
            </div>

            {/* Delivery */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900 mt-0.5">
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">نقطة التسليم (الوجهة)</p>
                <p className="font-semibold text-sm">{destination}</p>
                {meta?.delivery_address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.delivery_address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {meta?.notes && (
            <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground">
              <strong>ملاحظات:</strong> {meta.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAcknowledge}
            >
              تم الاطلاع
            </Button>
            <Button
              className="flex-1 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-2"
              onClick={handleNavigateToShipment}
            >
              <CheckCircle2 className="w-4 h-4" />
              فتح الشحنة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriverAssignmentAlert;

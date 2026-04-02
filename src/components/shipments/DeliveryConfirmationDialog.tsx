import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Upload, Camera, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DeliveryConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
  };
  onConfirmed?: () => void;
}

const DeliveryConfirmationDialog = ({
  isOpen,
  onClose,
  shipment,
  onConfirmed,
}: DeliveryConfirmationDialogProps) => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    receiverName: '',
    receiverNationalId: '',
    weightAtDelivery: '',
    conditionNotes: '',
    notes: '',
  });

  const captureGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success('تم تحديد الموقع');
      },
      () => {
        setGpsLoading(false);
        toast.error('تعذر تحديد الموقع');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || photos.length >= 3) return;
    for (const file of Array.from(files).slice(0, 3 - photos.length)) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!organization?.id || !shipment?.id) return;

    setIsSubmitting(true);
    try {
      // Create delivery confirmation
      const { error: confirmError } = await supabase
        .from('delivery_confirmations')
        .insert({
          shipment_id: shipment.id,
          confirmed_by_organization_id: organization.id,
          confirmed_by_user_id: user?.id,
          confirmation_type: 'digital',
          receiver_name: form.receiverName || null,
          receiver_national_id: form.receiverNationalId || null,
          weight_at_delivery: form.weightAtDelivery ? parseFloat(form.weightAtDelivery) : null,
          weight_unit: shipment.unit,
          condition_notes: form.conditionNotes || null,
          notes: form.notes || null,
        });

      if (confirmError) throw confirmError;

      // Update shipment status
      const { error: statusError } = await supabase
        .from('shipments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      if (statusError) throw statusError;

      toast.success('تم تأكيد استلام الشحنة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
      queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
      queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
      onConfirmed?.();
      onClose();
    } catch (err: any) {
      console.error('Delivery confirmation error:', err);
      toast.error('حدث خطأ أثناء تأكيد الاستلام');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            تأكيد استلام الشحنة
          </DialogTitle>
          <DialogDescription>
            الشحنة {shipment.shipment_number} - {shipment.waste_type} ({shipment.quantity} {shipment.unit})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">اسم المستلم</Label>
              <Input
                value={form.receiverName}
                onChange={(e) => setForm(f => ({ ...f, receiverName: e.target.value }))}
                placeholder="اسم المستلم"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رقم الهوية</Label>
              <Input
                value={form.receiverNationalId}
                onChange={(e) => setForm(f => ({ ...f, receiverNationalId: e.target.value }))}
                placeholder="رقم الهوية الوطنية"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">الوزن عند الاستلام ({shipment.unit})</Label>
            <Input
              type="number"
              value={form.weightAtDelivery}
              onChange={(e) => setForm(f => ({ ...f, weightAtDelivery: e.target.value }))}
              placeholder={`${shipment.quantity}`}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">حالة الشحنة عند الوصول</Label>
            <Textarea
              value={form.conditionNotes}
              onChange={(e) => setForm(f => ({ ...f, conditionNotes: e.target.value }))}
              placeholder="وصف حالة الشحنة (سليمة، تلف جزئي، إلخ)"
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات إضافية</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="ملاحظات اختيارية"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Photo Capture */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> صور إثبات التسليم (اختياري)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <div className="flex gap-2 flex-wrap">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded border overflow-hidden">
                  <img src={p} className="w-full h-full object-cover" alt={`صورة ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0 left-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-16 h-16"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* GPS Location */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="text-xs"
            >
              <MapPin className="w-3.5 h-3.5 ml-1" />
              {gpsLoading ? 'جاري التحديد...' : 'تحديد الموقع'}
            </Button>
            {gpsLocation && (
              <Badge variant="secondary" className="text-[10px]">
                📍 {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
              </Badge>
            )}
          </div>
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'جاري التأكيد...' : 'تأكيد الاستلام'}
              <CheckCircle2 className="mr-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryConfirmationDialog;

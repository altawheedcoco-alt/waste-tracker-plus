import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Camera, PenTool, RotateCcw, CheckCircle2, User, MapPin,
  FileSignature, Save, Smartphone, Loader2, Image, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeliveryProofFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
  };
  onCompleted?: () => void;
}

type Step = 'photo' | 'signature' | 'review';

const DeliveryProofFlow = ({ open, onOpenChange, shipment, onCompleted }: DeliveryProofFlowProps) => {
  const { user, organization } = useAuth();
  const [step, setStep] = useState<Step>('photo');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [receiverName, setReceiverName] = useState('');
  const [weightAtDelivery, setWeightAtDelivery] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get GPS on open
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [open]);

  // Init canvas
  useEffect(() => {
    if (step !== 'signature') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'hsl(var(--foreground))';
    // guideline
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.2)';
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'hsl(var(--foreground))';
  }, [step]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] || e.changedTouches[0] : null;
    return {
      x: (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left,
      y: (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top,
    };
  };

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    setHasSignature(true);
    lastPosRef.current = getPos(e);
  }, []);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPosRef.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  }, []);

  const stopDraw = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.2)';
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'hsl(var(--foreground))';
    setHasSignature(false);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast.error('الحد الأقصى 5 صور');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setPhotoPreviewUrls(prev => [...prev, ...urls]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(photoPreviewUrls[idx]);
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!organization?.id || !shipment?.id) return;
    setIsSubmitting(true);

    try {
      // 1. Upload photos
      const uploadedPhotoUrls: string[] = [];
      for (const photo of photos) {
        const fileName = `delivery-proof/${shipment.id}/${Date.now()}_${photo.name}`;
        const { data } = await supabase.storage.from('shipment-photos').upload(fileName, photo);
        if (data?.path) {
          const { data: urlData } = supabase.storage.from('shipment-photos').getPublicUrl(data.path);
          uploadedPhotoUrls.push(urlData.publicUrl);
        }
      }

      // 2. Upload signature
      let signatureUrl = '';
      if (hasSignature && canvasRef.current) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current!.toBlob(resolve, 'image/png')
        );
        if (blob) {
          const fileName = `delivery-proof/${shipment.id}/signature_${Date.now()}.png`;
          const { data } = await supabase.storage.from('shipment-photos').upload(fileName, blob, { contentType: 'image/png' });
          if (data?.path) {
            const { data: urlData } = supabase.storage.from('shipment-photos').getPublicUrl(data.path);
            signatureUrl = urlData.publicUrl;
          }
        }
      }

      // 3. Create delivery confirmation
      const { error: confirmErr } = await supabase.from('delivery_confirmations').insert({
        shipment_id: shipment.id,
        confirmed_by_organization_id: organization.id,
        confirmed_by_user_id: user?.id,
        confirmation_type: 'photo_signature',
        receiver_name: receiverName || null,
        weight_at_delivery: weightAtDelivery ? parseFloat(weightAtDelivery) : null,
        weight_unit: shipment.unit || 'طن',
        condition_notes: conditionNotes || null,
        photo_url: uploadedPhotoUrls[0] || null,
        signature_url: signatureUrl || null,
      });

      if (confirmErr) throw confirmErr;

      // 4. Update shipment status + GPS
      const updateData: any = {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      };
      if (gpsLocation) {
        updateData.delivery_latitude = gpsLocation.lat;
        updateData.delivery_longitude = gpsLocation.lng;
      }

      await supabase.from('shipments').update(updateData).eq('id', shipment.id);

      toast.success('تم تأكيد التسليم بنجاح ✅');
      onCompleted?.();
      onOpenChange(false);
      resetForm();

      // Fire delivery confirmation notification
      try {
        import('@/services/notificationTriggers').then(({ notifyShipmentEvent }) => {
          notifyShipmentEvent({
            type: 'shipment_delivered',
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipment_number,
            excludeUserId: user?.id,
            organizationId: organization?.id,
          });
        });
      } catch {}
    } catch (err: any) {
      console.error('Delivery proof error:', err);
      toast.error('حدث خطأ أثناء تأكيد التسليم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('photo');
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setReceiverName('');
    setWeightAtDelivery('');
    setConditionNotes('');
    setHasSignature(false);
    setGpsLocation(null);
  };

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'photo', label: 'صورة التسليم', icon: Camera },
    { key: 'signature', label: 'التوقيع', icon: PenTool },
    { key: 'review', label: 'مراجعة وإرسال', icon: CheckCircle2 },
  ];

  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-0" dir="rtl">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSignature className="w-5 h-5 text-primary" />
            إثبات التسليم — {shipment.shipment_number}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {shipment.waste_type} • {shipment.quantity} {shipment.unit || 'طن'}
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentIdx ? 'bg-primary text-primary-foreground' :
                i === currentIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[11px] hidden sm:inline ${i === currentIdx ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Photo Capture */}
            {step === 'photo' && (
              <motion.div key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto text-primary/60 mb-2" />
                  <p className="text-sm font-medium">التقط صورة للشحنة عند التسليم</p>
                  <p className="text-xs text-muted-foreground">يمكنك التقاط حتى 5 صور</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handlePhotoCapture}
                />

                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photoPreviewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 left-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 h-12"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5" />
                    {photos.length > 0 ? 'إضافة صورة' : 'التقاط صورة'}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 h-12"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                        fileInputRef.current.setAttribute('capture', 'environment');
                      }
                    }}
                  >
                    <Image className="w-5 h-5" />
                    من المعرض
                  </Button>
                </div>

                {/* Receiver Info */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> اسم المستلم
                      </label>
                      <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="الاسم الكامل" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">الوزن عند التسليم</label>
                      <Input type="number" value={weightAtDelivery} onChange={(e) => setWeightAtDelivery(e.target.value)} placeholder={`${shipment.quantity}`} className="h-9 text-sm" dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">ملاحظات الحالة</label>
                    <Textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="حالة الشحنة (سليمة، تلف جزئي...)" rows={2} className="text-sm" />
                  </div>
                </div>

                {gpsLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <MapPin className="w-3 h-3" />
                    تم تسجيل الموقع: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                  </div>
                )}

                <Button className="w-full gap-2" onClick={() => setStep('signature')}>
                  التالي: التوقيع
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Signature */}
            {step === 'signature' && (
              <motion.div key="signature" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <PenTool className="w-3 h-3" />
                  وقّع هنا بالإصبع أو القلم — توقيع المستلم
                </p>
                <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-background overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full touch-none cursor-crosshair"
                    style={{ height: 200 }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  {hasSignature && (
                    <Button variant="ghost" size="sm" className="absolute top-2 left-2 text-xs gap-1" onClick={clearSignature}>
                      <RotateCcw className="w-3 h-3" /> مسح
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep('photo')}>
                    <ChevronRight className="w-4 h-4" /> رجوع
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setStep('review')} disabled={!hasSignature}>
                    التالي: مراجعة <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحنة</span>
                      <span className="font-medium">{shipment.shipment_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الصور</span>
                      <Badge variant={photos.length > 0 ? 'default' : 'destructive'}>
                        {photos.length} صور
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التوقيع</span>
                      <Badge variant={hasSignature ? 'default' : 'destructive'}>
                        {hasSignature ? 'تم' : 'غير موجود'}
                      </Badge>
                    </div>
                    {receiverName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المستلم</span>
                        <span>{receiverName}</span>
                      </div>
                    )}
                    {weightAtDelivery && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الوزن</span>
                        <span>{weightAtDelivery} {shipment.unit || 'طن'}</span>
                      </div>
                    )}
                    {gpsLocation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPS</span>
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <MapPin className="w-3 h-3" /> مسجل
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep('signature')}>
                    <ChevronRight className="w-4 h-4" /> رجوع
                  </Button>
                  <Button className="flex-1 gap-2 h-11" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
                    ) : (
                      <><Save className="w-4 h-4" /> تأكيد التسليم</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryProofFlow;

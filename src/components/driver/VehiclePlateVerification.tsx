import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Truck,
} from 'lucide-react';

interface VerificationResult {
  scanned_plate?: string;
  is_match?: boolean;
  confidence?: number;
  notes?: string;
}

interface VehiclePlateVerificationProps {
  shipmentId: string;
  expectedPlate: string;
  driverId?: string;
  onVerified: (isMatch: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VehiclePlateVerification = ({
  shipmentId,
  expectedPlate,
  driverId,
  onVerified,
  isOpen,
  onClose,
}: VehiclePlateVerificationProps) => {
  const { profile } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setResult(null);
    setShowOverride(false);

    try {
      // Upload photo to storage
      const fileName = `plate-${shipmentId}-${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage
        .from('weighbridge-photos')
        .upload(`plates/${fileName}`, file);

      let photoUrl: string | null = null;
      if (uploadData?.path) {
        const { data: signedData } = await supabase.storage.from('weighbridge-photos').createSignedUrl(`plates/${fileName}`, 86400);
        photoUrl = signedData?.signedUrl || null;
      }

      // Call AI verification
      const formData = new FormData();
      formData.append('image', file);
      formData.append('expected_plate', expectedPlate);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-vehicle-plate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('تم تجاوز حد الطلبات، حاول لاحقاً');
          return;
        }
        if (response.status === 402) {
          toast.error('يرجى إضافة رصيد للاستمرار');
          return;
        }
        throw new Error('فشل التحقق');
      }

      const verification: VerificationResult = await response.json();
      setResult(verification);

      // Get GPS
      let gpsLat: number | null = null;
      let gpsLng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        gpsLat = pos.coords.latitude;
        gpsLng = pos.coords.longitude;
      } catch {}

      // Save verification record
      await supabase.from('vehicle_plate_verifications').insert({
        shipment_id: shipmentId,
        driver_id: driverId || null,
        expected_plate: expectedPlate,
        scanned_plate: verification.scanned_plate || null,
        photo_url: photoUrl,
        is_match: verification.is_match || false,
        confidence_score: verification.confidence || 0,
        gps_latitude: gpsLat,
        gps_longitude: gpsLng,
      } as any);

      if (verification.is_match) {
        // Mark shipment as plate verified
        await supabase.from('shipments').update({ plate_verified: true } as any).eq('id', shipmentId);
        toast.success('✅ تم التحقق من لوحة المركبة بنجاح');
        onVerified(true);
      } else {
        setShowOverride(true);
        toast.error('⚠️ لوحة المركبة لا تتطابق مع المسجلة في الطلب');
      }
    } catch (err) {
      console.error('Plate verification error:', err);
      toast.error('حدث خطأ في التحقق من اللوحة');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      toast.error('يجب كتابة سبب التجاوز');
      return;
    }

    await supabase.from('vehicle_plate_verifications').insert({
      shipment_id: shipmentId,
      driver_id: driverId || null,
      expected_plate: expectedPlate,
      scanned_plate: result?.scanned_plate || 'manual_override',
      is_match: false,
      confidence_score: 0,
      override_by: profile?.id,
      override_reason: overrideReason,
    } as any);

    await supabase.from('shipments').update({ plate_verified: true } as any).eq('id', shipmentId);

    toast.warning('تم تجاوز التحقق يدوياً — سيتم تسجيل ذلك');
    onVerified(true);
    onClose();
  };

  const handleClose = () => {
    setResult(null);
    setPreviewUrl(null);
    setShowOverride(false);
    setOverrideReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            التحقق من لوحة المركبة
          </DialogTitle>
          <DialogDescription>
            صوّر لوحة المركبة للتحقق من تطابقها مع المسجلة في الطلب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expected plate */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <Badge variant="outline" className="font-mono text-base px-3 py-1" dir="ltr">
              {expectedPlate}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              اللوحة المسجلة
            </div>
          </div>

          {/* Capture button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {!result && (
            <Button
              onClick={handleCapture}
              disabled={isVerifying}
              size="lg"
              className="w-full h-16 text-lg gap-3"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6" />
                  📸 تصوير لوحة المركبة
                </>
              )}
            </Button>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border max-h-48">
              <img src={previewUrl} alt="صورة اللوحة" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className={cn(
              'border-2',
              result.is_match ? 'border-emerald-300 bg-emerald-50' : 'border-destructive/30 bg-destructive/5'
            )}>
              <CardContent className="p-4 space-y-3 text-right">
                <div className="flex items-center justify-between">
                  {result.is_match ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                  <div className="text-right">
                    <p className={cn('font-bold text-lg', result.is_match ? 'text-emerald-700' : 'text-destructive')}>
                      {result.is_match ? 'مطابقة ✓' : 'غير مطابقة ✗'}
                    </p>
                    {result.scanned_plate && (
                      <p className="text-sm text-muted-foreground">
                        اللوحة المقروءة: <span className="font-mono font-bold" dir="ltr">{result.scanned_plate}</span>
                      </p>
                    )}
                  </div>
                </div>

                {result.confidence != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', result.confidence > 0.7 ? 'bg-emerald-500' : result.confidence > 0.4 ? 'bg-amber-500' : 'bg-destructive')}
                        style={{ width: `${(result.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">{Math.round((result.confidence || 0) * 100)}%</span>
                  </div>
                )}

                {result.notes && (
                  <p className="text-xs text-muted-foreground">{result.notes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Override section */}
          {showOverride && (
            <div className="space-y-3 p-3 rounded-lg border border-amber-300 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                تجاوز يدوي (يتطلب تبريراً)
              </div>
              <Textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="سبب التجاوز: مثلاً — اللوحة جديدة لم يتم تحديثها في النظام..."
                rows={2}
                dir="rtl"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleOverride} className="flex-1 gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  تجاوز والمتابعة
                </Button>
                <Button onClick={handleCapture} className="flex-1 gap-2">
                  <Camera className="h-4 w-4" />
                  إعادة التصوير
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehiclePlateVerification;

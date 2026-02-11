import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload, CheckCircle2, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

interface PhotoMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  accuracy: number | null;
  deviceInfo: string;
}

interface WeighbridgePhotoUploadProps {
  shipmentId: string;
  type: 'pickup' | 'delivery';
  label: string;
  required?: boolean;
  onPhotoUploaded: (url: string, metadata: PhotoMetadata) => void;
  existingPhotoUrl?: string | null;
}

const WeighbridgePhotoUpload = ({
  shipmentId,
  type,
  label,
  required = true,
  onPhotoUploaded,
  existingPhotoUrl,
}: WeighbridgePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingPhotoUrl || null);
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const captureMetadata = (): Promise<PhotoMetadata> => {
    return new Promise((resolve) => {
      const baseMetadata: PhotoMetadata = {
        latitude: null,
        longitude: null,
        timestamp: new Date().toISOString(),
        accuracy: null,
        deviceInfo: navigator.userAgent,
      };

      if (!navigator.geolocation) {
        resolve(baseMetadata);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            ...baseMetadata,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => resolve(baseMetadata),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت');
      return;
    }

    setUploading(true);
    try {
      const photoMetadata = await captureMetadata();
      
      // ضغط الصورة قبل الرفع
      const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
      if (compressed.compressionRatio > 0) {
        console.log(`📦 تم ضغط الصورة: ${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.compressedSize)} (${compressed.compressionRatio}%)`);
      }
      const finalFile = compressed.file;

      const fileExt = finalFile.name.split('.').pop();
      const fileName = `${shipmentId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('weighbridge-photos')
        .upload(fileName, finalFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('weighbridge-photos')
        .getPublicUrl(fileName);

      const url = urlData.publicUrl;
      setPhotoUrl(url);
      setMetadata(photoMetadata);
      onPhotoUploaded(url, photoMetadata);
      toast.success('تم رفع صورة إيصال الميزان بنجاح');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`فشل رفع الصورة: ${error.message}`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1">
        <ImageIcon className="w-4 h-4" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      {photoUrl ? (
        <div className="relative rounded-lg border overflow-hidden">
          <img src={photoUrl} alt="صورة إيصال الميزان" className="w-full h-48 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 text-foreground p-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>تم الرفع: {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleString('ar-SA') : ''}</span>
            </div>
            {metadata?.latitude && (
              <span>📍 {metadata.latitude.toFixed(5)}, {metadata.longitude?.toFixed(5)}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 left-2"
            onClick={() => { setPhotoUrl(null); setMetadata(null); }}
          >
            إعادة الرفع
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Camera className="w-4 h-4 ml-2" />}
            التقاط صورة
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
            اختيار ملف
          </Button>
        </div>
      )}

      {required && !photoUrl && (
        <p className="text-xs text-destructive">يجب رفع صورة إيصال الميزان للمتابعة</p>
      )}
    </div>
  );
};

export default WeighbridgePhotoUpload;

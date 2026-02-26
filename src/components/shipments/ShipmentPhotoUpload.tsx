import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { smartUpload } from '@/utils/smartUploadPipeline';
import { useAuth } from '@/contexts/AuthContext';
import SecureImage from '@/components/ui/SecureImage';

interface ShipmentPhotoUploadProps {
  shipmentId: string;
  maxPhotos?: number;
  onPhotosChanged: (urls: string[]) => void;
}

const ShipmentPhotoUpload = ({
  shipmentId,
  maxPhotos = 5,
  onPhotosChanged,
}: ShipmentPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user, organization, profile } = useAuth();

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - photoPaths.length;
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${maxPhotos} صور`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const newPaths: string[] = [];
      const newUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: حجم الصورة يجب أن لا يتجاوز 10 ميجابايت`);
          continue;
        }

        // استخدام الـ Pipeline الذكي
        const result = await smartUpload({
          file,
          context: 'shipment_photo',
          organizationId: organization?.id || '',
          userId: user?.id || '',
          userRole: (profile as any)?.role,
          shipmentId,
          skipOCR: true, // صور الشحنات لا تحتاج OCR
        });

        newPaths.push(result.upload.path);
        newUrls.push(result.upload.publicUrl);
      }

      if (newPaths.length > 0) {
        const updatedPaths = [...photoPaths, ...newPaths];
        const updatedUrls = [...photoUrls, ...newUrls];
        setPhotoPaths(updatedPaths);
        setPhotoUrls(updatedUrls);
        onPhotosChanged(updatedUrls);
        toast.success(`تم رفع ${newPaths.length} صورة وأرشفتها بنجاح`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الصور');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const updatedPaths = photoPaths.filter((_, i) => i !== index);
    const updatedUrls = photoUrls.filter((_, i) => i !== index);
    setPhotoPaths(updatedPaths);
    setPhotoUrls(updatedUrls);
    onPhotosChanged(updatedUrls);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <ImagePlus className="w-4 h-4" />
        صور الشحنة
        <span className="text-xs text-muted-foreground">({photoPaths.length}/{maxPhotos})</span>
      </Label>

      {/* Photo Grid */}
      {photoPaths.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photoPaths.map((path, index) => (
            <div key={index} className="relative rounded-lg border overflow-hidden aspect-square">
              <SecureImage 
                src={path} 
                bucket="shipment-photos"
                alt={`صورة ${index + 1}`} 
                className="w-full h-full"
                zoomable={true}
                gallery={photoPaths.filter((_, i) => i !== index)}
                galleryBucket="shipment-photos"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {photoPaths.length < maxPhotos && (
        <div className="flex gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFilesSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            التقاط
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            اختيار صور
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShipmentPhotoUpload;

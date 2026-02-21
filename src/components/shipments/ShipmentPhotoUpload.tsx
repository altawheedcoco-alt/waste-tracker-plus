import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/utils/imageCompression';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: حجم الصورة يجب أن لا يتجاوز 10 ميجابايت`);
          continue;
        }

        const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.8 });
        const finalFile = compressed.file;
        const fileExt = finalFile.name.split('.').pop();
        const filePath = `${shipmentId}/status_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('shipment-photos')
          .upload(filePath, finalFile, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`فشل رفع ${file.name}`);
          continue;
        }

        // Store path (not public URL) - we'll use signed URLs to display
        newPaths.push(filePath);

        // Also get public URL for saving to DB (backward compat)
        const { data: urlData } = supabase.storage
          .from('shipment-photos')
          .getPublicUrl(filePath);
        // We still pass URLs to parent for DB storage
        onPhotosChanged([...photoPaths, ...newPaths].map(() => '').length > 0 
          ? [...photoPaths.map(p => supabase.storage.from('shipment-photos').getPublicUrl(p).data.publicUrl), urlData.publicUrl]
          : []);
      }

      if (newPaths.length > 0) {
        const updated = [...photoPaths, ...newPaths];
        setPhotoPaths(updated);
        // Pass all public URLs to parent
        const allUrls = updated.map(p => supabase.storage.from('shipment-photos').getPublicUrl(p).data.publicUrl);
        onPhotosChanged(allUrls);
        toast.success(`تم رفع ${newPaths.length} صورة بنجاح`);
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
    const updated = photoPaths.filter((_, i) => i !== index);
    setPhotoPaths(updated);
    const allUrls = updated.map(p => supabase.storage.from('shipment-photos').getPublicUrl(p).data.publicUrl);
    onPhotosChanged(allUrls);
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

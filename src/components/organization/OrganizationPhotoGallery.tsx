import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Camera, Trash2, Loader2, ImagePlus, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

interface OrganizationPhotoGalleryProps {
  organizationId: string;
  isEditable: boolean;
}

const OrganizationPhotoGallery = ({ organizationId, isEditable }: OrganizationPhotoGalleryProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['organization-photos', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_photos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Photo[];
    },
    enabled: !!organizationId,
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: نوع الملف غير مدعوم`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: حجم الملف كبير جداً (الحد 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${organizationId}/gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-assets')
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('public-assets')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('organization_photos')
          .insert({
            organization_id: organizationId,
            photo_url: urlData.publicUrl,
            sort_order: photos.length,
            is_public: true,
          });
        if (dbError) throw dbError;
      }

      toast.success('تم رفع الصور بنجاح');
      queryClient.invalidateQueries({ queryKey: ['organization-photos', organizationId] });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('حدث خطأ في رفع الصور');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photo: Photo) => {
    try {
      // Extract storage path from URL - check both buckets for backward compat
      let urlParts = photo.photo_url.split('/public-assets/');
      let bucket = 'public-assets';
      if (!urlParts[1]) {
        urlParts = photo.photo_url.split('/organization-stamps/');
        bucket = 'organization-stamps';
      }
      if (urlParts[1]) {
        await supabase.storage.from(bucket).remove([decodeURIComponent(urlParts[1])]);
      }
      const { error } = await supabase.from('organization_photos').delete().eq('id', photo.id);
      if (error) throw error;
      toast.success('تم حذف الصورة');
      queryClient.invalidateQueries({ queryKey: ['organization-photos', organizationId] });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('حدث خطأ في حذف الصورة');
    }
  };

  const toggleVisibility = async (photo: Photo) => {
    try {
      const { error } = await supabase
        .from('organization_photos')
        .update({ is_public: !photo.is_public })
        .eq('id', photo.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['organization-photos', organizationId] });
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const updateCaption = async (photoId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('organization_photos')
        .update({ caption })
        .eq('id', photoId);
      if (error) throw error;
    } catch (error) {
      toast.error('حدث خطأ في تحديث الوصف');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          معرض صور الموقع
        </CardTitle>
        <CardDescription>صور من الموقع (بوابة المصنع، مكان التحميل، المخازن...)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        {isEditable && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-dashed border-2 h-20"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5 ml-2" />
              )}
              {uploading ? 'جاري الرفع...' : 'إضافة صور'}
            </Button>
          </>
        )}

        {/* Photo Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد صور مرفوعة</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border bg-muted">
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'صورة الموقع'}
                      className="w-full h-40 object-contain cursor-pointer hover:opacity-90 transition bg-muted"
                      loading="lazy"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-2">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'صورة الموقع'}
                      className="w-full rounded"
                    />
                  </DialogContent>
                </Dialog>

                {/* Overlay controls */}
                {isEditable && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleVisibility(photo)}
                    >
                      {photo.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(photo)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Visibility badge */}
                <div className="absolute top-1 right-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    photo.is_public
                      ? 'bg-primary/80 text-primary-foreground'
                      : 'bg-muted-foreground/80 text-background'
                  }`}>
                    {photo.is_public ? 'عام' : 'خاص'}
                  </span>
                </div>

                {/* Caption */}
                {isEditable ? (
                  <Input
                    value={photo.caption || ''}
                    onChange={(e) => updateCaption(photo.id, e.target.value)}
                    placeholder="وصف الصورة..."
                    className="border-0 border-t rounded-none text-xs h-8"
                  />
                ) : photo.caption ? (
                  <p className="p-1.5 text-xs text-center truncate">{photo.caption}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationPhotoGallery;

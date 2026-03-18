import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ChevronRight, ChevronLeft, X, Image as ImageIcon,
  Trash2, Star, Loader2, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePhotoGalleryProps {
  profileId: string;
  photoType: 'cover' | 'avatar';
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetCurrent?: (photoUrl: string) => void;
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  is_current: boolean;
  is_hidden: boolean;
  caption: string | null;
  created_at: string;
}

export default function ProfilePhotoGallery({
  profileId,
  photoType,
  isOwner,
  open,
  onOpenChange,
  onSetCurrent,
}: ProfilePhotoGalleryProps) {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['profile-photos', profileId, photoType],
    queryFn: async () => {
      const query = supabase
        .from('profile_photos')
        .select('*')
        .eq('profile_id', profileId)
        .eq('photo_type', photoType)
        .order('created_at', { ascending: false });

      // Non-owners only see non-hidden
      if (!isOwner) {
        query.eq('is_hidden', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProfilePhoto[];
    },
    enabled: open && !!profileId,
  });

  const toggleHidden = async (photo: ProfilePhoto) => {
    setLoading(photo.id);
    try {
      const { error } = await supabase
        .from('profile_photos')
        .update({ is_hidden: !photo.is_hidden, updated_at: new Date().toISOString() } as any)
        .eq('id', photo.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile-photos', profileId, photoType] });
      toast.success(photo.is_hidden ? 'تم إظهار الصورة' : 'تم إخفاء الصورة');
    } catch {
      toast.error('فشل تحديث حالة الصورة');
    } finally {
      setLoading(null);
    }
  };

  const setAsCurrent = async (photo: ProfilePhoto) => {
    setLoading(photo.id);
    try {
      // Remove current flag from all photos of this type
      await supabase
        .from('profile_photos')
        .update({ is_current: false, updated_at: new Date().toISOString() } as any)
        .eq('profile_id', profileId)
        .eq('photo_type', photoType);

      // Set this photo as current
      await supabase
        .from('profile_photos')
        .update({ is_current: true, updated_at: new Date().toISOString() } as any)
        .eq('id', photo.id);

      // Update the profile
      if (photoType === 'cover') {
        await supabase.from('profiles').update({ cover_url: photo.photo_url } as any).eq('id', profileId);
      } else {
        await supabase.from('profiles').update({ avatar_url: photo.photo_url }).eq('id', profileId);
      }

      queryClient.invalidateQueries({ queryKey: ['profile-photos', profileId, photoType] });
      queryClient.invalidateQueries({ queryKey: ['social-profile'] });
      onSetCurrent?.(photo.photo_url);
      toast.success(photoType === 'cover' ? 'تم تعيين الغلاف' : 'تم تعيين الصورة الشخصية');
    } catch {
      toast.error('فشل تعيين الصورة');
    } finally {
      setLoading(null);
    }
  };

  const deletePhoto = async (photo: ProfilePhoto) => {
    if (photo.is_current) {
      toast.error('لا يمكن حذف الصورة الحالية');
      return;
    }
    setLoading(photo.id);
    try {
      const { error } = await supabase.from('profile_photos').delete().eq('id', photo.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile-photos', profileId, photoType] });
      toast.success('تم حذف الصورة');
      if (selectedIndex !== null) setSelectedIndex(null);
    } catch {
      toast.error('فشل حذف الصورة');
    } finally {
      setLoading(null);
    }
  };

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const navigatePhoto = (dir: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    const newIndex = dir === 'next' 
      ? Math.min(selectedIndex + 1, photos.length - 1)
      : Math.max(selectedIndex - 1, 0);
    setSelectedIndex(newIndex);
  };

  const title = photoType === 'cover' ? 'صور الغلاف' : 'الصور الشخصية';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            {title}
            <Badge variant="secondary" className="text-xs">{photos.length} صورة</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Fullscreen Viewer */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/95 flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between p-3 text-white/80">
                <span className="text-sm">
                  {format(new Date(selectedPhoto.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                </span>
                <div className="flex items-center gap-1">
                  {selectedPhoto.is_current && (
                    <Badge className="bg-primary/80 text-xs">الحالية</Badge>
                  )}
                  {selectedPhoto.is_hidden && (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
                      <EyeOff className="w-3 h-3 ml-1" /> مخفية
                    </Badge>
                  )}
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setSelectedIndex(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className="flex-1 flex items-center justify-center relative px-12">
                <img
                  src={selectedPhoto.photo_url}
                  alt=""
                  className={cn(
                    "max-w-full max-h-full object-contain rounded-lg",
                    photoType === 'avatar' && "rounded-full max-w-80 max-h-80"
                  )}
                />

                {/* Navigation */}
                {selectedIndex! > 0 && (
                  <Button
                    size="icon" variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                    onClick={() => navigatePhoto('prev')}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                )}
                {selectedIndex! < photos.length - 1 && (
                  <Button
                    size="icon" variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                    onClick={() => navigatePhoto('next')}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                )}
              </div>

              {/* Actions bar */}
              {isOwner && (
                <div className="flex items-center justify-center gap-2 p-4">
                  {!selectedPhoto.is_current && (
                    <Button
                      size="sm" variant="secondary"
                      className="gap-1.5"
                      disabled={loading === selectedPhoto.id}
                      onClick={() => setAsCurrent(selectedPhoto)}
                    >
                      <Star className="w-4 h-4" />
                      تعيين كـ{photoType === 'cover' ? 'غلاف' : 'صورة'} حالي
                    </Button>
                  )}
                  <Button
                    size="sm" variant="secondary"
                    className="gap-1.5"
                    disabled={loading === selectedPhoto.id}
                    onClick={() => toggleHidden(selectedPhoto)}
                  >
                    {selectedPhoto.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {selectedPhoto.is_hidden ? 'إظهار' : 'إخفاء'}
                  </Button>
                  {!selectedPhoto.is_current && (
                    <Button
                      size="sm" variant="destructive"
                      className="gap-1.5"
                      disabled={loading === selectedPhoto.id}
                      onClick={() => deletePhoto(selectedPhoto)}
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>لا توجد {title} بعد</p>
            </div>
          ) : (
            <div className={cn(
              "grid gap-2",
              photoType === 'cover' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-4'
            )}>
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative group cursor-pointer rounded-lg overflow-hidden border",
                    photoType === 'cover' ? 'aspect-[16/9]' : 'aspect-square',
                    photo.is_current && 'ring-2 ring-primary',
                    photo.is_hidden && 'opacity-60'
                  )}
                  onClick={() => setSelectedIndex(index)}
                >
                  <img
                    src={photo.photo_url}
                    alt=""
                    className={cn(
                      "w-full h-full object-cover transition-transform group-hover:scale-105",
                      photoType === 'avatar' && "rounded-lg"
                    )}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                  {/* Badges */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                    {photo.is_current && (
                      <Badge className="bg-primary text-[10px] px-1.5 py-0.5">الحالية</Badge>
                    )}
                    {photo.is_hidden && isOwner && (
                      <Badge variant="outline" className="bg-background/80 text-[10px] px-1.5 py-0.5">
                        <EyeOff className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>

                  {/* Date */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px]">
                      {format(new Date(photo.created_at), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

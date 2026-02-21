/**
 * SecureImage - مكون لعرض الصور من التخزين الخاص
 * يجلب signed URL تلقائياً ويعرض الصورة مع دعم التكبير
 */
import { useState, useEffect, useCallback } from 'react';
import { getStorageUrl, refreshStorageUrl } from '@/utils/storageUrl';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ImageOff, ZoomIn, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SecureImageProps {
  /** رابط مباشر أو مسار في التخزين */
  src: string;
  /** اسم الباكت (مطلوب إذا src هو مسار وليس رابط كامل) */
  bucket?: string;
  alt?: string;
  className?: string;
  /** تفعيل التكبير عند النقر */
  zoomable?: boolean;
  /** حجم الصورة المصغرة */
  thumbnailSize?: 'sm' | 'md' | 'lg';
  /** دالة عند فشل التحميل */
  onError?: () => void;
  /** معرض صور - قائمة الصور الإضافية */
  gallery?: string[];
  /** معرض صور - الباكت للصور الإضافية */
  galleryBucket?: string;
}

const thumbnailSizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const SecureImage = ({
  src,
  bucket,
  alt = 'صورة',
  className,
  zoomable = true,
  thumbnailSize,
  onError,
  gallery,
  galleryBucket,
}: SecureImageProps) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // جلب الرابط الصالح
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const resolve = async () => {
      try {
        let url: string | null = null;
        if (bucket) {
          url = await getStorageUrl(bucket, src);
        } else if (src.startsWith('http')) {
          url = await refreshStorageUrl(src);
        } else {
          url = src;
        }
        if (!cancelled) {
          setResolvedUrl(url);
          if (!url) setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [src, bucket]);

  // جلب روابط المعرض
  useEffect(() => {
    if (!gallery?.length) return;
    const bkt = galleryBucket || bucket;
    
    Promise.all(
      gallery.map(async (g) => {
        if (bkt) return await getStorageUrl(bkt, g);
        return await refreshStorageUrl(g);
      })
    ).then((urls) => setGalleryUrls(urls.filter(Boolean) as string[]));
  }, [gallery, galleryBucket, bucket]);

  const handleImageError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  const openLightbox = () => {
    if (!zoomable || !resolvedUrl) return;
    setCurrentIndex(0);
    setLightboxOpen(true);
  };

  const allImages = resolvedUrl
    ? [resolvedUrl, ...galleryUrls.filter((u) => u !== resolvedUrl)]
    : galleryUrls;

  const navigate = (dir: number) => {
    setCurrentIndex((i) => (i + dir + allImages.length) % allImages.length);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', thumbnailSize ? thumbnailSizes[thumbnailSize] : 'w-full h-32', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className={cn('flex flex-col items-center justify-center bg-muted/50 rounded-lg border border-dashed', thumbnailSize ? thumbnailSizes[thumbnailSize] : 'w-full h-32', className)}>
        <ImageOff className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mt-1">فشل التحميل</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'relative group overflow-hidden rounded-lg',
          zoomable && 'cursor-pointer',
          thumbnailSize && thumbnailSizes[thumbnailSize],
          className
        )}
        onClick={openLightbox}
      >
        <img
          src={resolvedUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        {zoomable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        {gallery && gallery.length > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            +{gallery.length}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Download */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
              onClick={() => {
                const a = document.createElement('a');
                a.href = allImages[currentIndex];
                a.download = `image-${currentIndex + 1}`;
                a.target = '_blank';
                a.click();
              }}
            >
              <Download className="w-5 h-5" />
            </Button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={allImages[currentIndex]}
                alt={`${alt} ${currentIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </AnimatePresence>

            {/* Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto justify-center bg-black/80">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    'w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all',
                    i === currentIndex ? 'border-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecureImage;

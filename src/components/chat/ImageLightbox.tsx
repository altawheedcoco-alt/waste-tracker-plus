import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  protected?: boolean;
}

const ImageLightbox = ({ images, initialIndex, isOpen, onClose, protected: isProtected = false }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [pinchStart, setPinchStart] = useState<number | null>(null);
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [-200, 0, 200], [0.3, 1, 0.3]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setRotation(0);
    setImageError(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': goNext(); break;
        case 'ArrowRight': goPrev(); break;
        case '+': case '=': zoomIn(); break;
        case '-': zoomOut(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Pinch-to-zoom handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStart(dist);
    } else if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - pinchStart) / 200;
      setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
      setPinchStart(dist);
    }
  }, [pinchStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      
      if (Math.abs(dx) > 80 && Math.abs(dy) < 60) {
        if (dx > 0) goPrev();
        else goNext();
      }
      if (dy > 120 && Math.abs(dx) < 60) {
        onClose();
      }
    }
    setTouchStart(null);
    setPinchStart(null);
  }, [touchStart]);

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetTransform();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetTransform();
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const resetTransform = () => { setScale(1); setRotation(0); };

  const downloadImage = () => {
    if (isProtected) return;
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `image-${Date.now()}.jpg`;
    link.click();
  };

  const shareImage = async () => {
    if (isProtected) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'مشاركة صورة', url: images[currentIndex] });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  // Close only when clicking the dark backdrop, not the image area
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentSrc = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        style={{ opacity: dragOpacity }}
        onClick={handleBackdropClick}
        onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
      >
        {/* Protected mode indicator */}
        {isProtected && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white/60 text-xs px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>صورة محمية</span>
          </div>
        )}

        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <span className="text-white/70 text-sm">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white/70 text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={zoomIn} disabled={scale >= 4}>
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={rotate}>
              <RotateCw className="w-5 h-5" />
            </Button>
            {!isProtected && (
              <>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={downloadImage}>
                  <Download className="w-5 h-5" />
                </Button>
                {navigator.share && (
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={shareImage}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "absolute right-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70",
                  currentIndex === 0 && "opacity-50 cursor-not-allowed"
                )}
                onClick={goPrev}
                disabled={currentIndex === 0}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "absolute left-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70",
                  currentIndex === images.length - 1 && "opacity-50 cursor-not-allowed"
                )}
                onClick={goNext}
                disabled={currentIndex === images.length - 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Always use <img> — protected mode uses CSS-only protection */}
          <motion.img
            key={`${currentIndex}-${currentSrc}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: scale, rotate: rotation }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            src={currentSrc}
            alt="Preview"
            className={cn(
              "max-w-[90vw] max-h-[80vh] object-contain rounded-lg",
              isProtected ? "pointer-events-none select-none" : "cursor-grab active:cursor-grabbing"
            )}
            draggable={false}
            onError={() => setImageError(true)}
            onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
            style={isProtected ? {
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            } as React.CSSProperties : undefined}
          />

          {/* Transparent overlay for protected mode to block right-click/drag on the image */}
          {isProtected && (
            <div 
              className="absolute inset-0 z-10"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/50 text-sm">تعذر تحميل الصورة</p>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div 
            className="flex items-center justify-center gap-2 p-4 bg-gradient-to-t from-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => { setCurrentIndex(index); resetTransform(); }}
                className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  index === currentIndex 
                    ? "border-white scale-110" 
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageLightbox;

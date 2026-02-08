import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setRotation(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goNext();
          break;
        case 'ArrowRight':
          goPrev();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

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

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `image-${Date.now()}.jpg`;
    link.click();
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'مشاركة صورة',
          url: images[currentIndex]
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            <span className="text-white/70 text-sm">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white/70 text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={zoomIn}
              disabled={scale >= 4}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={rotate}
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={downloadImage}
            >
              <Download className="w-5 h-5" />
            </Button>
            {navigator.share && (
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-white hover:bg-white/10"
                onClick={shareImage}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
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

          {/* Image */}
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: scale,
              rotate: rotation
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            src={images[currentIndex]}
            alt="Preview"
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg cursor-grab active:cursor-grabbing"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
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
                onClick={() => {
                  setCurrentIndex(index);
                  resetTransform();
                }}
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

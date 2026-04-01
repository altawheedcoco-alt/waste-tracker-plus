import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGalleryViewerProps {
  images: { url: string; name?: string }[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageGalleryViewer = memo(({ images, initialIndex = 0, isOpen, onClose }: ImageGalleryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoom(prev => prev === 1 ? 2 : 1);
  }, []);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
          >
            {zoom > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </Button>
          <a
            href={current.url}
            download={current.name || 'image'}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 text-white/80 text-sm font-mono z-10">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Image */}
        <motion.img
          key={current.url}
          src={current.url}
          alt={current.name || ''}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: zoom }}
          transition={{ type: 'spring', damping: 25 }}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg cursor-zoom-in"
          style={{ cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
          onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
        />

        {/* Filename */}
        {current.name && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full">
            {current.name}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

ImageGalleryViewer.displayName = 'ImageGalleryViewer';
export default ImageGalleryViewer;

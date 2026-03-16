/**
 * Realistic A4 Preview Modal
 * Opens a full-screen overlay showing the document at real A4 scale
 */
import { useRef, useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, ZoomIn, ZoomOut, Maximize2, FileText, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface A4PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onShareWhatsApp?: () => void;
  children: ReactNode;
  title?: string;
  isPDFExporting?: boolean;
  pages?: number;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];

const A4PreviewModal = ({
  isOpen, onClose, onPrint, onDownloadPDF, onShareWhatsApp,
  children, title = 'معاينة المستند', isPDFExporting, pages = 1,
}: A4PreviewModalProps) => {
  const [zoom, setZoom] = useState(0.75);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-fit zoom based on screen width
      const screenW = window.innerWidth;
      if (screenW < 768) setZoom(0.5);
      else if (screenW < 1200) setZoom(0.75);
      else setZoom(1);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); onPrint(); }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 1.5));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const zoomIdx = ZOOM_LEVELS.indexOf(zoom);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#374151' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur border-b shadow-sm" dir="rtl">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
          {pages > 1 && (
            <span className="text-xs text-muted-foreground">
              صفحة {currentPage} من {pages}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} disabled={zoom <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setZoom(z => Math.min(z + 0.25, 1.5))} disabled={zoom >= 1.5}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setZoom(1)}>
            <Maximize2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Actions */}
          {onShareWhatsApp && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={onShareWhatsApp}>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">واتساب</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={onDownloadPDF} disabled={isPDFExporting}>
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">PDF</span>
          </Button>
          <Button variant="default" size="sm" className="gap-1.5 h-8" onClick={onPrint}>
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">طباعة</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document area */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center py-8" style={{ background: '#4b5563' }}>
        <div
          className="bg-white shadow-2xl"
          style={{
            width: `${210 * zoom}mm`,
            minHeight: `${297 * zoom}mm`,
            transform: `scale(1)`,
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>

      {/* Page navigation for multi-page */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 bg-background/95 border-t">
          {Array.from({ length: pages }, (_, i) => (
            <Button key={i} variant={currentPage === i + 1 ? 'default' : 'outline'} size="sm"
              className="h-7 w-7 p-0 text-xs" onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default A4PreviewModal;

/**
 * UnifiedDocumentPreview — مكون معاينة وطباعة موحد لجميع المستندات
 * 
 * يدعم وضعين:
 * 1. children: محتوى React مباشر (للمكونات الموجودة)
 * 2. htmlContent: محتوى HTML خام (لمستندات Edge Functions)
 * 
 * يوفر: معاينة A4 تفاعلية + طباعة + تحميل PDF
 */
import { useRef, useState, useEffect, ReactNode, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, ZoomIn, ZoomOut, Maximize2, FileText, Loader2 } from 'lucide-react';
import { useDocumentService } from '@/hooks/useDocumentService';

interface UnifiedDocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  /** Document title shown in toolbar */
  title?: string;
  /** PDF filename (without extension) */
  filename?: string;
  /** PDF orientation */
  orientation?: 'portrait' | 'landscape';
  /** React content to preview */
  children?: ReactNode;
  /** Raw HTML content (from edge functions) */
  htmlContent?: string;
  /** Whether data is still loading */
  loading?: boolean;
  /** Additional toolbar actions */
  toolbarActions?: ReactNode;
  /** Fit content to single page */
  fitSinglePage?: boolean;
  /** Auto-trigger action when opened */
  autoAction?: 'print' | 'pdf' | null;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];

const UnifiedDocumentPreview = ({
  isOpen,
  onClose,
  title = 'معاينة المستند',
  filename = 'document',
  orientation = 'portrait',
  children,
  htmlContent,
  loading = false,
  toolbarActions,
  fitSinglePage = true,
  autoAction,
}: UnifiedDocumentPreviewProps) => {
  const [zoom, setZoom] = useState(0.75);
  const contentRef = useRef<HTMLDivElement>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const autoActionDone = useRef(false);

  const { downloadPDF, print, isProcessing } = useDocumentService({
    filename,
    orientation,
    format: 'a4',
    fitSinglePage,
  });

  // Responsive zoom on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const screenW = window.innerWidth;
      if (screenW < 768) setZoom(0.5);
      else if (screenW < 1200) setZoom(0.75);
      else setZoom(1);
      autoActionDone.current = false;
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); handlePrint(); }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 1.5));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const getActiveRef = useCallback(() => {
    if (htmlContent && htmlRef.current) return htmlRef.current;
    return contentRef.current;
  }, [htmlContent]);

  const handlePrint = useCallback(() => {
    const el = getActiveRef();
    if (el) print(el);
  }, [getActiveRef, print]);

  const handleDownloadPDF = useCallback(async () => {
    const el = getActiveRef();
    if (el) await downloadPDF(el);
  }, [getActiveRef, downloadPDF]);

  // Auto-action
  useEffect(() => {
    if (!autoAction || loading || autoActionDone.current || !isOpen) return;
    const timer = setTimeout(() => {
      const el = getActiveRef();
      if (!el) return;
      autoActionDone.current = true;
      if (autoAction === 'print') handlePrint();
      else if (autoAction === 'pdf') handleDownloadPDF();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoAction, loading, isOpen, getActiveRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#374151' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur border-b shadow-sm" dir="rtl">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
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

          {/* Additional toolbar actions */}
          {toolbarActions}

          {/* Standard actions */}
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleDownloadPDF} disabled={isProcessing || loading}>
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-xs">PDF</span>
          </Button>
          <Button variant="default" size="sm" className="gap-1.5 h-8" onClick={handlePrint} disabled={loading}>
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
      <div className="flex-1 overflow-auto flex justify-center py-8" style={{ background: '#4b5563' }}>
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>جاري تحميل المستند...</span>
          </div>
        ) : (
          <div
            className="bg-white shadow-2xl"
            style={{
              width: `${210 * zoom}mm`,
              minHeight: `${297 * zoom}mm`,
              transformOrigin: 'top center',
            }}
          >
            {htmlContent ? (
              <div
                ref={htmlRef}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{ width: '210mm', minHeight: '297mm', transform: `scale(${zoom})`, transformOrigin: 'top right' }}
              />
            ) : (
              <div ref={contentRef}>
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedDocumentPreview;

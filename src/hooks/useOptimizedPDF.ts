import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseOptimizedPDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: 'fast' | 'balanced' | 'quality';
}

// Worker-based PDF generation for non-blocking UI
const generatePDFWorker = async (
  element: HTMLElement,
  options: UseOptimizedPDFOptions
): Promise<Blob> => {
  // Dynamic imports for code splitting
  const [html2canvas, { default: jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf'),
  ]);

  const qualitySettings = {
    fast: { scale: 1, quality: 0.7 },
    balanced: { scale: 1.5, quality: 0.85 },
    quality: { scale: 2, quality: 0.95 },
  };

  const settings = qualitySettings[options.quality || 'balanced'];

  const canvas = await html2canvas(element, {
    scale: settings.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 5000,
    // Optimize for speed
    removeContainer: true,
    foreignObjectRendering: false,
  });

  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  return pdf.output('blob');
};

export const useOptimizedPDF = (options: UseOptimizedPDFOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  const exportToPDF = useCallback(async (
    element: HTMLElement | null, 
    customFilename?: string
  ) => {
    if (!element || isExporting) {
      if (!element) toast.error('لا يوجد محتوى للتصدير');
      return;
    }

    abortRef.current = false;
    setIsExporting(true);
    setProgress(10);

    const toastId = toast.loading('جاري إنشاء PDF...', {
      description: 'يرجى الانتظار',
    });

    try {
      setProgress(30);
      
      // Use requestIdleCallback for better performance
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => resolve(true), { timeout: 100 });
        } else {
          setTimeout(resolve, 50);
        }
      });

      if (abortRef.current) return;

      setProgress(50);
      const blob = await generatePDFWorker(element, options);
      
      if (abortRef.current) return;

      setProgress(80);
      
      const filename = customFilename || options.filename || 'document';
      const dateStr = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${dateStr}.pdf`;
      link.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      setProgress(100);
      toast.dismiss(toastId);
      toast.success('تم تحميل PDF بنجاح');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.dismiss(toastId);
      toast.error('فشل تصدير PDF');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [options, isExporting]);

  const previewPDF = useCallback(async (element: HTMLElement | null) => {
    if (!element) {
      toast.error('لا يوجد محتوى للمعاينة');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('جاري إنشاء المعاينة...');

    try {
      const blob = await generatePDFWorker(element, { ...options, quality: 'fast' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast.dismiss(toastId);
      toast.success('تم فتح المعاينة');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('فشل إنشاء المعاينة');
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    exportToPDF,
    previewPDF,
    isExporting,
    progress,
    abort,
  };
};

export default useOptimizedPDF;

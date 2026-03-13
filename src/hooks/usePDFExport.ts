import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateThemeCSS, getThemeById, type PrintThemeId } from '@/lib/printThemes';

/**
 * A4 dimensions in mm (with 20mm margins)
 */
const A4 = {
  width: 210,
  height: 297,
  margin: 20,
  contentWidth: 170,  // 210 - 2×20
  contentHeight: 257, // 297 - 2×20
} as const;

/** A4 content area in pixels at 96 DPI (screen) */
const A4_PX = {
  width: Math.round(A4.contentWidth * 96 / 25.4),  // ~643px
  height: Math.round(A4.contentHeight * 96 / 25.4), // ~972px
  fullWidth: Math.round(A4.width * 96 / 25.4),      // ~794px
} as const;

interface UsePDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
  /** Force content to fit in a single A4 page via dynamic scaling */
  fitSinglePage?: boolean;
}

/**
 * Calculate a scale factor to fit content into a single A4 page.
 * Returns 1 if content already fits; < 1 if it needs shrinking.
 */
function calcFitScale(element: HTMLElement): number {
  const contentH = element.scrollHeight;
  const contentW = element.scrollWidth;
  const scaleX = contentW > A4_PX.width ? A4_PX.width / contentW : 1;
  const scaleY = contentH > A4_PX.height ? A4_PX.height / contentH : 1;
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Apply single-page scaling to an element temporarily.
 * Returns a cleanup function.
 */
function applySinglePageScaling(element: HTMLElement): { scale: number; cleanup: () => void } {
  const scale = calcFitScale(element);
  const origTransform = element.style.transform;
  const origTransformOrigin = element.style.transformOrigin;
  const origOverflow = element.style.overflow;

  if (scale < 1) {
    element.style.transform = `scale(${scale})`;
    element.style.transformOrigin = 'top right'; // RTL
    element.style.overflow = 'hidden';
  }

  return {
    scale,
    cleanup: () => {
      element.style.transform = origTransform;
      element.style.transformOrigin = origTransformOrigin;
      element.style.overflow = origOverflow;
    },
  };
}

export const usePDFExport = (options: UsePDFExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = useCallback(async (element: HTMLElement | null): Promise<jsPDF | null> => {
    if (!element) return null;

    const {
      orientation = 'portrait',
      format = 'a4',
      scale = 2,
      fitSinglePage = true,
    } = options;

    // Temporarily apply A4-like width constraint for accurate capture
    const originalStyle = element.style.cssText;
    element.style.width = `${A4_PX.fullWidth}px`;
    element.style.maxWidth = `${A4_PX.fullWidth}px`;
    element.style.padding = `${A4.margin}mm`;
    element.style.boxSizing = 'border-box';
    element.style.backgroundColor = '#ffffff';
    element.style.overflow = 'visible';

    // Hide no-print elements
    const noPrintEls = element.querySelectorAll('.no-print');
    noPrintEls.forEach(el => (el as HTMLElement).style.display = 'none');

    // Wait for images to load and reflow
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.allSettled(
      images.filter(img => !img.complete).map(img => 
        new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 3000);
        })
      )
    );

    // Wait for reflow
    await new Promise(r => setTimeout(r, 300));

    // Apply single-page scaling if requested
    let scalingCleanup: (() => void) | null = null;
    if (fitSinglePage) {
      const { cleanup } = applySinglePageScaling(element);
      scalingCleanup = cleanup;
      // Wait for reflow after scaling
      await new Promise(r => setTimeout(r, 100));
    }

    const pdf = new jsPDF({ orientation, unit: 'mm', format });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const captureOpts = {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: A4_PX.fullWidth,
      windowWidth: A4_PX.fullWidth,
      onclone: (clonedDoc: Document) => {
        const imgs = clonedDoc.querySelectorAll('img');
        imgs.forEach(img => {
          img.crossOrigin = 'anonymous';
          if (img.src && !img.src.startsWith('data:')) {
            const url = new URL(img.src);
            url.searchParams.set('_t', Date.now().toString());
            img.src = url.toString();
          }
        });
      },
    };

    // Check for page-break sections
    const children = Array.from(element.children) as HTMLElement[];
    const hasPageBreaks = !fitSinglePage && children.length > 1;

    if (hasPageBreaks) {
      const validChildren = children.filter(child => {
        const isPageBreak = child.style.pageBreakBefore === 'always' || child.style.pageBreakAfter === 'always';
        const isEmpty = child.offsetHeight < 5 && child.children.length === 0;
        return !isPageBreak && !isEmpty;
      });

      for (let i = 0; i < validChildren.length; i++) {
        const child = validChildren[i];
        try {
          const canvas = await html2canvas(child, captureOpts);
          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          const imgWidth = A4.contentWidth;
          const imgHeight = (canvas.height * A4.contentWidth) / canvas.width;

          if (i > 0) pdf.addPage();

          if (imgHeight <= A4.contentHeight) {
            pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin, imgWidth, imgHeight);
          } else {
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin + position, imgWidth, imgHeight);
            heightLeft -= A4.contentHeight;
            while (heightLeft > 0) {
              position = -(imgHeight - heightLeft);
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin + position, imgWidth, imgHeight);
              heightLeft -= A4.contentHeight;
            }
          }
        } catch (childError) {
          console.warn(`Failed to capture page ${i + 1}, skipping:`, childError);
        }
      }
    } else {
      // Single capture (with scaling if fitSinglePage)
      const canvas = await html2canvas(element, captureOpts);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = A4.contentWidth;
      const imgHeight = (canvas.height * A4.contentWidth) / canvas.width;

      if (fitSinglePage || imgHeight <= A4.contentHeight) {
        // Fit in one page — scale image to fit if needed
        const fitScale = Math.min(1, A4.contentHeight / imgHeight);
        const finalWidth = imgWidth * fitScale;
        const finalHeight = imgHeight * fitScale;
        pdf.addImage(imgData, 'PNG', A4.margin, A4.margin, finalWidth, finalHeight);
      } else {
        // Multi-page fallback
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', A4.margin, A4.margin + position, imgWidth, imgHeight);
        heightLeft -= A4.contentHeight;

        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', A4.margin, A4.margin + position, imgWidth, imgHeight);
          heightLeft -= A4.contentHeight;
        }
      }
    }

    // Cleanup
    if (scalingCleanup) scalingCleanup();
    element.style.cssText = originalStyle;
    noPrintEls.forEach(el => (el as HTMLElement).style.display = '');

    return pdf;
  }, [options]);

  const exportToPDF = useCallback(async (element: HTMLElement | null, customFilename?: string) => {
    if (!element) {
      toast.error('لا يوجد محتوى للتصدير');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('جاري إنشاء ملف PDF...');
    
    try {
      const { filename = 'document' } = options;
      const finalFilename = customFilename || filename;

      const pdf = await generatePDF(element);
      if (!pdf) throw new Error('Failed to generate PDF');

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`${finalFilename}-${dateStr}.pdf`);

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير PDF');
    } finally {
      setIsExporting(false);
    }
  }, [options, generatePDF]);

  const previewPDF = useCallback(async (element: HTMLElement | null) => {
    if (!element) {
      toast.error('لا يوجد محتوى للمعاينة');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('جاري إنشاء المعاينة...');
    
    try {
      const pdf = await generatePDF(element);
      if (!pdf) throw new Error('Failed to generate PDF');

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.dismiss(toastId);
      toast.success('تم فتح المعاينة');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء إنشاء المعاينة');
    } finally {
      setIsExporting(false);
    }
  }, [generatePDF]);

  /**
   * Print via browser window — produces vector-based text (not rasterized).
   * This is the HIGHEST quality method and should be preferred over PDF export
   * when actual printing is needed.
   */
  const printContent = useCallback((element: HTMLElement | null, styles: string = '') => {
    if (!element) {
      toast.error('لا يوجد محتوى للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
      return;
    }

    // Collect all stylesheets from the current page
    const styleSheets = Array.from(document.styleSheets);
    let collectedStyles = '';
    
    styleSheets.forEach(sheet => {
      try {
        if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules);
          rules.forEach(rule => {
            collectedStyles += rule.cssText + '\n';
          });
        }
      } catch (e) {
        if (sheet.href) {
          collectedStyles += `@import url("${sheet.href}");\n`;
        }
      }
    });

    const defaultPrintStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      
      @page { 
        size: A4 portrait; 
        margin: 20mm; 
      }
      
      * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important; 
        box-sizing: border-box; 
      }
      
      html, body { 
        margin: 0; 
        padding: 0; 
        background: white !important; 
        font-family: 'Cairo', sans-serif !important; 
        direction: rtl; 
        /* Vector text rendering */
        -webkit-font-smoothing: antialiased !important;
        text-rendering: optimizeLegibility !important;
      }
      
      .print-container { 
        width: 170mm; 
        max-width: 170mm; 
        max-height: 257mm;
        margin: 0 auto; 
        padding: 0; 
        box-sizing: border-box; 
        overflow: hidden !important; 
      }
      
      .no-print { display: none !important; }
      
      img { max-width: 100%; height: auto; max-height: 60mm; object-fit: contain; }
      
      table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      th, td { padding: 3px 6px; border: 1px solid #ddd; text-align: right; font-size: 9pt; line-height: 1.3; }
      
      h1 { font-size: 16pt; margin: 4px 0; }
      h2 { font-size: 13pt; margin: 3px 0; }
      h3 { font-size: 11pt; margin: 2px 0; }
      h4, h5, h6 { font-size: 10pt; margin: 2px 0; }
      h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
      p { font-size: 10pt; margin: 2px 0; line-height: 1.4; }
      
      header, footer { display: block !important; visibility: visible !important; overflow: visible !important; page-break-inside: avoid; }
      footer { page-break-before: avoid; }
      
      .grid { display: grid !important; }
      .flex { display: flex !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
      .items-start { align-items: flex-start !important; }
      .items-center { align-items: center !important; }
      .justify-between { justify-content: space-between !important; }
      .justify-center { justify-content: center !important; }
      .text-center { text-align: center !important; }
      .gap-1 { gap: 4px !important; }
      .gap-2 { gap: 8px !important; }
      .gap-3 { gap: 10px !important; }
      .gap-4, .gap-6, .gap-8 { gap: 8px !important; }
      .space-y-4 > * + *, .space-y-6 > * + *, .space-y-8 > * + * { margin-top: 6px !important; }
      .p-6, .p-8 { padding: 8px !important; }
      .p-4, .p-5 { padding: 6px !important; }
      .p-1, .p-1\\.5 { padding: 4px !important; }
      .p-2 { padding: 6px !important; }
      .p-3 { padding: 8px !important; }
      .px-2 { padding-left: 6px !important; padding-right: 6px !important; }
      .px-4 { padding-left: 12px !important; padding-right: 12px !important; }
      .py-0\\.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
      .mb-1 { margin-bottom: 4px !important; }
      .mb-2 { margin-bottom: 6px !important; }
      .mb-3 { margin-bottom: 8px !important; }
      .mb-4, .mb-6, .mb-8 { margin-bottom: 6px !important; }
      .mt-1 { margin-top: 4px !important; }
      .mt-2 { margin-top: 6px !important; }
      .mt-3 { margin-top: 8px !important; }
      .mt-4, .mt-6, .mt-8 { margin-top: 6px !important; }
      .pt-2 { padding-top: 6px !important; }
      .pb-3 { padding-bottom: 8px !important; }
      .py-4, .py-6 { padding-top: 4px !important; padding-bottom: 4px !important; }
      .rounded, .rounded-lg { border-radius: 4px !important; }
      .border { border-width: 1px !important; border-style: solid !important; }
      .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
      .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
      .flex-1 { flex: 1 1 0% !important; }
      .flex-shrink-0 { flex-shrink: 0 !important; }
      .inline-block { display: inline-block !important; }
      .font-mono { font-family: monospace !important; }
      .font-bold { font-weight: 700 !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-medium { font-weight: 500 !important; }
      .col-span-2 { grid-column: span 2 !important; }
      .col-span-3 { grid-column: span 3 !important; }
      .w-full { width: 100% !important; }
      .text-3xl { font-size: 14pt !important; }
      .text-4xl { font-size: 16pt !important; }
      .text-6xl { font-size: 20pt !important; }
      .text-2xl { font-size: 13pt !important; }
      .text-xl { font-size: 11pt !important; }
      .text-lg { font-size: 10pt !important; }
      svg { display: inline-block !important; vertical-align: middle !important; }
      
      @media print { 
        body { margin: 0; padding: 0; } 
        .print-container { overflow: hidden !important; }
      }
    `;

    // Measure content and apply scaling if needed
    const content = element.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>طباعة الوثيقة</title>
          <style>${collectedStyles}\n${styles || defaultPrintStyles}</style>
          <script>
            // Dynamic scaling to fit content in single A4 page
            window.addEventListener('load', function() {
              var container = document.querySelector('.print-container');
              if (!container) return;
              // A4 content area at 96 DPI: 170mm × 257mm ≈ 643px × 972px
              var maxH = 972;
              var contentH = container.scrollHeight;
              if (contentH > maxH) {
                var scale = maxH / contentH;
                container.style.transform = 'scale(' + scale + ')';
                container.style.transformOrigin = 'top right';
                container.style.overflow = 'hidden';
              }
            });
          </script>
        </head>
        <body>
          <div class="print-container">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      printWindow.print();
    };
    printWindow.onload = () => { setTimeout(doPrint, 500); };
    setTimeout(doPrint, 2000);
  }, []);

  /** Print with a specific theme applied */
  const printWithTheme = useCallback((element: HTMLElement | null, themeId: PrintThemeId) => {
    if (!element) {
      toast.error('لا يوجد محتوى للطباعة');
      return;
    }
    const theme = getThemeById(themeId);
    const themeCSS = generateThemeCSS(theme);
    printContent(element, themeCSS);
  }, [printContent]);

  /** Export PDF and upload to storage, returning the public URL */
  const exportAndUpload = useCallback(async (
    element: HTMLElement | null,
    opts: { orgId: string; docType: string; docId: string; customFilename?: string }
  ): Promise<string | null> => {
    if (!element) return null;

    try {
      const pdf = await generatePDF(element);
      if (!pdf) return null;

      const blob = pdf.output('blob');
      const { orgId, docType, docId, customFilename } = opts;
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${orgId}/${docType}/${docId}-${dateStr}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('document-archive')
        .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('document-archive')
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl || null;

      if (publicUrl && docId) {
        await supabase
          .from('document_print_log')
          .update({ file_url: publicUrl })
          .eq('document_id', docId)
          .eq('organization_id', orgId);
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
  }, [generatePDF]);

  return { 
    exportToPDF, 
    exportAndUpload,
    previewPDF, 
    printContent,
    printWithTheme,
    generatePDF,
    isExporting,
    /** Utility: apply single-page scaling to any element */
    applySinglePageScaling,
    /** Utility: calculate fit scale for any element */
    calcFitScale,
    /** A4 dimensions constants */
    A4_DIMENSIONS: A4,
  };
};

/**
 * Exported utilities for use outside the hook
 */
export { calcFitScale, applySinglePageScaling, A4, A4_PX };

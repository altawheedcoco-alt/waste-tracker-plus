import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateThemeCSS, getThemeById, type PrintThemeId } from '@/lib/printThemes';

interface UsePDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
}

export const usePDFExport = (options: UsePDFExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = useCallback(async (element: HTMLElement | null): Promise<jsPDF | null> => {
    if (!element) return null;

    const {
      orientation = 'portrait',
      format = 'a4',
      scale = 2,
    } = options;

    const marginMM = 8;

    // Temporarily apply A4-like width constraint for accurate capture
    const originalStyle = element.style.cssText;
    element.style.width = '794px';
    element.style.maxWidth = '794px';
    element.style.padding = '24px';
    element.style.boxSizing = 'border-box';
    element.style.backgroundColor = '#ffffff';
    element.style.overflow = 'visible';

    // Hide no-print elements
    const noPrintEls = element.querySelectorAll('.no-print');
    noPrintEls.forEach(el => (el as HTMLElement).style.display = 'none');

    // Wait for reflow
    await new Promise(r => setTimeout(r, 200));

    const pdf = new jsPDF({ orientation, unit: 'mm', format });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginMM * 2;
    const contentHeight = pageHeight - marginMM * 2;

    // Check for page-break sections (children with pageBreakAfter)
    const children = Array.from(element.children) as HTMLElement[];
    const hasPageBreaks = children.length > 1;

    const captureOpts = {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      windowWidth: 794,
    };

    if (hasPageBreaks && children.length > 1) {
      // Capture each top-level child as a separate page
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const canvas = await html2canvas(child, captureOpts);
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (i > 0) pdf.addPage();

        // If content fits in one page, center it
        if (imgHeight <= contentHeight) {
          pdf.addImage(imgData, 'JPEG', marginMM, marginMM, imgWidth, imgHeight);
        } else {
          // Multi-page for this section
          let heightLeft = imgHeight;
          let position = 0;
          pdf.addImage(imgData, 'JPEG', marginMM, marginMM + position, imgWidth, imgHeight);
          heightLeft -= contentHeight;
          while (heightLeft > 0) {
            position = -(imgHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', marginMM, marginMM + position, imgWidth, imgHeight);
            heightLeft -= contentHeight;
          }
        }
      }
    } else {
      // Single capture fallback
      const canvas = await html2canvas(element, captureOpts);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', marginMM, marginMM + position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginMM, marginMM + position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }
    }

    // Restore original styles
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
      @page { size: A4; margin: 8mm 10mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
      body { margin: 0; padding: 0; background: white !important; font-family: 'Cairo', sans-serif !important; direction: rtl; }
      .print-container { width: 190mm; max-width: 190mm; margin: 0 auto; padding: 2mm; box-sizing: border-box; overflow: visible !important; }
      .no-print { display: none !important; }
      img { max-width: 100%; height: auto; max-height: 60mm; object-fit: contain; }
      table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      th, td { padding: 2px 6px; border: 1px solid #ddd; text-align: right; font-size: 10px; line-height: 1.3; }
      h1 { font-size: 18px; margin: 4px 0; }
      h2 { font-size: 15px; margin: 3px 0; }
      h3 { font-size: 13px; margin: 2px 0; }
      h4, h5, h6 { font-size: 11px; margin: 2px 0; }
      h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
      p { font-size: 10px; margin: 2px 0; line-height: 1.4; }
      /* Ensure header and footer are always visible */
      header, footer { display: block !important; visibility: visible !important; overflow: visible !important; page-break-inside: avoid; }
      footer { page-break-before: avoid; }
      /* Grid and flex support for print */
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
      .text-3xl { font-size: 16px !important; }
      .text-4xl { font-size: 18px !important; }
      .text-6xl { font-size: 22px !important; }
      .text-2xl { font-size: 14px !important; }
      .text-xl { font-size: 12px !important; }
      .text-lg { font-size: 11px !important; }
      /* SVG icons in print */
      svg { display: inline-block !important; vertical-align: middle !important; }
      @media print { body { margin: 0; padding: 0; } .print-container { overflow: visible !important; } }
    `;

    const content = element.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>طباعة الوثيقة</title>
          <style>${collectedStyles}\n${styles || defaultPrintStyles}</style>
        </head>
        <body>
          <div class="print-container">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 300); };
    setTimeout(() => { printWindow.print(); }, 1000);
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

      // Update print log with file URL if docId exists
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
    isExporting 
  };
};

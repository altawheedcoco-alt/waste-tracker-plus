import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
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

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

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
      @page { size: A4; margin: 10mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      body { margin: 0; padding: 0; background: white !important; font-family: 'Cairo', sans-serif !important; }
      .print-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 10mm; box-sizing: border-box; }
      img { max-width: 100%; height: auto; }
      @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
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

  return { 
    exportToPDF, 
    previewPDF, 
    printContent,
    printWithTheme,
    isExporting 
  };
};

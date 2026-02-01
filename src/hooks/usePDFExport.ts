import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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

    const defaultStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
      body { padding: 20px; direction: rtl; background: white; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; font-size: 11px; }
      th { background-color: #f5f5f5; }
      @media print { body { padding: 0; } }
    `;

    const content = element.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>طباعة</title>
          <style>${styles || defaultStyles}</style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, []);

  return { 
    exportToPDF, 
    previewPDF, 
    printContent,
    isExporting 
  };
};

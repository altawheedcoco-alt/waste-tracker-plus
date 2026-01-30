import { useState } from 'react';
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

  const exportToPDF = async (element: HTMLElement | null, customFilename?: string) => {
    if (!element) {
      toast.error('لا يوجد محتوى للتصدير');
      return;
    }

    setIsExporting(true);
    try {
      const {
        filename = 'document',
        orientation = 'portrait',
        format = 'a4',
        scale = 2,
      } = options;

      const finalFilename = customFilename || filename;

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Create PDF
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

      // Handle multi-page content
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        pageNumber++;
      }

      // Save the PDF
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`${finalFilename}-${dateStr}.pdf`);

      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('حدث خطأ أثناء تصدير PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, isExporting };
};

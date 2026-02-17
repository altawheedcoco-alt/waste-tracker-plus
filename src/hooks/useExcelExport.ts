import { useState, useCallback } from 'react';
import { createWorkbook, aoaToSheet, writeFile } from '@/lib/excelExport';
import { toast } from 'sonner';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

interface UseExcelExportOptions {
  filename?: string;
  sheetName?: string;
}

export const useExcelExport = (options: UseExcelExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(async <T extends Record<string, any>>(
    data: T[],
    columns: ExcelColumn[],
    customFilename?: string
  ) => {
    if (!data || data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('جاري إنشاء ملف Excel...');

    try {
      const { filename = 'export', sheetName = 'البيانات' } = options;
      const finalFilename = customFilename || filename;

      // Prepare data with Arabic headers
      const headers = columns.map(col => col.header);
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col.key];
          if (value instanceof Date) {
            return value.toLocaleDateString('ar-EG');
          }
          if (value === null || value === undefined) {
            return '';
          }
          return value;
        })
      );

      const colWidths = columns.map(col => col.width || 15);

      const workbook = createWorkbook();
      aoaToSheet(workbook, [headers, ...rows], sheetName, colWidths);

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = `${finalFilename}-${dateStr}.xlsx`;

      await writeFile(workbook, fullFilename);

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير Excel');
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  const exportMultipleSheetsToExcel = useCallback(async (
    sheets: Array<{
      name: string;
      data: Record<string, any>[];
      columns: ExcelColumn[];
    }>,
    customFilename?: string
  ) => {
    if (!sheets || sheets.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('جاري إنشاء ملف Excel...');

    try {
      const { filename = 'export' } = options;
      const finalFilename = customFilename || filename;

      const workbook = createWorkbook();

      sheets.forEach(sheet => {
        const headers = sheet.columns.map(col => col.header);
        const rows = sheet.data.map(item =>
          sheet.columns.map(col => {
            const value = item[col.key];
            if (value instanceof Date) {
              return value.toLocaleDateString('ar-EG');
            }
            if (value === null || value === undefined) {
              return '';
            }
            return value;
          })
        );

        const colWidths = sheet.columns.map(col => col.width || 15);
        aoaToSheet(workbook, [headers, ...rows], sheet.name, colWidths);
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = `${finalFilename}-${dateStr}.xlsx`;

      await writeFile(workbook, fullFilename);

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير Excel');
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  return {
    exportToExcel,
    exportMultipleSheetsToExcel,
    isExporting
  };
};

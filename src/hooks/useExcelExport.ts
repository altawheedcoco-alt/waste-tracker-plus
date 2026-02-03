import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
          // Handle dates
          if (value instanceof Date) {
            return value.toLocaleDateString('ar-EG');
          }
          // Handle null/undefined
          if (value === null || value === undefined) {
            return '';
          }
          return value;
        })
      );

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Set column widths
      worksheet['!cols'] = columns.map(col => ({
        wch: col.width || 15
      }));

      // Set RTL direction
      worksheet['!dir'] = 'rtl';

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = `${finalFilename}-${dateStr}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, fullFilename);

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

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add each sheet
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

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        worksheet['!cols'] = sheet.columns.map(col => ({
          wch: col.width || 15
        }));
        worksheet['!dir'] = 'rtl';

        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = `${finalFilename}-${dateStr}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, fullFilename);

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

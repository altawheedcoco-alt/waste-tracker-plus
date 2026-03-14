/**
 * usePDFExport — BACKWARD-COMPATIBLE WRAPPER
 * 
 * Delegates to useDocumentService for all operations.
 * All 38+ consumers automatically get dynamic imports & code-splitting.
 * 
 * @deprecated Use useDocumentService directly for new code.
 */

import { useDocumentService, type UseDocumentServiceOptions } from './useDocumentService';
import type { PrintThemeId } from '@/lib/printThemes';

interface UsePDFExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
  fitSinglePage?: boolean;
}

export const usePDFExport = (options: UsePDFExportOptions = {}) => {
  const svcOpts: UseDocumentServiceOptions = {
    filename: options.filename,
    orientation: options.orientation,
    format: options.format,
  };

  const svc = useDocumentService(svcOpts);

  return {
    exportToPDF: svc.exportToPDF,
    previewPDF: (el: HTMLElement | null) => svc.previewPDF(el),
    printContent: svc.printContent,
    printWithTheme: (el: HTMLElement | null, themeId: PrintThemeId) => svc.printWithTheme(el, themeId),
    isExporting: svc.isProcessing,
    // Extra aliases some consumers use
    generatePDF: svc.downloadPDF,
  };
};

export default usePDFExport;

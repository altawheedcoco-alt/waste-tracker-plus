/**
 * usePDFExport — BACKWARD-COMPATIBLE WRAPPER
 * 
 * Delegates to useDocumentService for all operations.
 * All 38+ consumers automatically get dynamic imports & code-splitting.
 * 
 * @deprecated Use useDocumentService directly for new code.
 */

import { useCallback } from 'react';
import { useDocumentService, type UseDocumentServiceOptions } from './useDocumentService';
import { PDFService } from '@/services/documentService';
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
    fitSinglePage: options.fitSinglePage,
  };

  const svc = useDocumentService(svcOpts);

  /** Generate a jsPDF instance (with .output('blob') etc.) — used by AttestationDialog */
  const generatePDF = useCallback(async (el: HTMLElement | null) => {
    if (!el) return null;
    return PDFService.generate(el, {
      filename: options.filename,
      orientation: options.orientation,
      format: options.format,
      fitSinglePage: options.fitSinglePage ?? true,
    });
  }, [options]);

  return {
    exportToPDF: svc.exportToPDF,
    previewPDF: (el: HTMLElement | null) => svc.previewPDF(el),
    printContent: svc.printContent,
    printWithTheme: (el: HTMLElement | null, themeId: PrintThemeId) => svc.printWithTheme(el, themeId),
    isExporting: svc.isProcessing,
    generatePDF,
  };
};

export default usePDFExport;

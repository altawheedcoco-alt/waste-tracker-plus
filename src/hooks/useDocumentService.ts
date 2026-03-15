/**
 * useDocumentService — Unified React hook for ALL document operations.
 * Replaces usePDFExport with dynamic imports + full feature set.
 * 
 * Features:
 *  - PDF download, preview, upload to storage
 *  - Excel export (single/multi-sheet/JSON)
 *  - Browser print (vector text, A4, RTL)
 *  - Print with theme support
 *  - Single-page scaling
 */

import { useState, useCallback, useRef } from 'react';
import DocumentService, {
  PDFService,
  ExcelService,
  PrintService,
  type PDFOptions,
  type ExcelColumn,
  type ExcelSheetDef,
  type PrintOptions,
  type UploadOptions,
} from '@/services/documentService';
import { generateThemeCSS, getThemeById, type PrintThemeId } from '@/lib/printThemes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';

export interface UseDocumentServiceReturn {
  // PDF
  downloadPDF: (element: HTMLElement | null, opts?: PDFOptions & { customFilename?: string }) => Promise<void>;
  previewPDF: (element: HTMLElement | null, opts?: PDFOptions) => Promise<void>;
  uploadPDF: (element: HTMLElement | null, upload: UploadOptions, opts?: PDFOptions) => Promise<string | null>;
  /** Generate PDF → upload to storage → update document_print_log */
  exportAndUpload: (
    element: HTMLElement | null,
    opts: { orgId: string; docType: string; docId: string; customFilename?: string }
  ) => Promise<string | null>;

  // Excel
  exportExcel: <T extends Record<string, any>>(data: T[], columns: ExcelColumn[], filename?: string) => Promise<void>;
  exportMultiSheetExcel: (sheets: ExcelSheetDef[], filename?: string) => Promise<void>;
  exportJSONExcel: (data: Record<string, any>[], filename?: string) => Promise<void>;

  // Print
  print: (element: HTMLElement | null, opts?: PrintOptions) => void;
  printWithTheme: (element: HTMLElement | null, themeId: PrintThemeId) => void;

  // State
  isProcessing: boolean;

  // Backward-compatible aliases
  exportToPDF: (element: HTMLElement | null, customFilename?: string) => Promise<void>;
  printContent: (element: HTMLElement | null, styles?: string) => void;
  isExporting: boolean;
}

export interface UseDocumentServiceOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

export const useDocumentService = (options: UseDocumentServiceOptions = {}): UseDocumentServiceReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const { backgroundHTML, bgColor, hasBackground } = useGuillocheBackground();

  const wrap = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (processingRef.current) return undefined;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      return await fn();
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  /** Inject guilloche background overlay into an element, returns cleanup fn */
  const injectGuillocheOverlay = useCallback((el: HTMLElement): (() => void) => {
    if (!hasBackground || !backgroundHTML) return () => {};
    // Set position relative so absolute overlay works
    const origPosition = el.style.position;
    const origBg = el.style.backgroundColor;
    if (!origPosition || origPosition === 'static') {
      el.style.position = 'relative';
    }
    if (bgColor) {
      el.style.backgroundColor = bgColor;
    }
    // Insert overlay as first child
    const overlay = document.createElement('div');
    overlay.className = 'guilloche-bg-overlay';
    overlay.innerHTML = backgroundHTML;
    overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
    el.insertBefore(overlay, el.firstChild);
    // Ensure content is above overlay
    Array.from(el.children).forEach(child => {
      if (child !== overlay) {
        const c = child as HTMLElement;
        if (!c.style.position || c.style.position === 'static') {
          c.style.position = 'relative';
        }
        if (!c.style.zIndex) {
          c.style.zIndex = '1';
        }
      }
    });
    return () => {
      overlay.remove();
      el.style.position = origPosition;
      el.style.backgroundColor = origBg;
    };
  }, [hasBackground, backgroundHTML, bgColor]);

  // ─── PDF ────────────────────────────────────────────────────

  const downloadPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions & { customFilename?: string }) => {
    if (!el) return;
    const cleanup = injectGuillocheOverlay(el);
    try {
      const mergedOpts: PDFOptions = {
        ...opts,
        filename: opts?.customFilename || opts?.filename || options.filename || 'document',
        orientation: opts?.orientation || options.orientation,
        format: opts?.format || options.format,
      };
      await wrap(() => PDFService.download(el, mergedOpts));
    } finally {
      cleanup();
    }
  }, [wrap, options, injectGuillocheOverlay]);

  const previewPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions) => {
    if (!el) return;
    const cleanup = injectGuillocheOverlay(el);
    try {
      const mergedOpts: PDFOptions = {
        ...opts,
        orientation: opts?.orientation || options.orientation,
        format: opts?.format || options.format,
      };
      await wrap(() => PDFService.preview(el, mergedOpts));
    } finally {
      cleanup();
    }
  }, [wrap, options, injectGuillocheOverlay]);

  const uploadPDF = useCallback(async (el: HTMLElement | null, upload: UploadOptions, opts?: PDFOptions) => {
    if (!el) return null;
    const cleanup = injectGuillocheOverlay(el);
    try {
      return (await wrap(() => PDFService.uploadToStorage(el, upload, opts))) ?? null;
    } finally {
      cleanup();
    }
  }, [wrap, injectGuillocheOverlay]);

  const exportAndUpload = useCallback(async (
    el: HTMLElement | null,
    opts: { orgId: string; docType: string; docId: string; customFilename?: string }
  ): Promise<string | null> => {
    if (!el) return null;

    const result = await wrap(async () => {
      const url = await PDFService.uploadToStorage(el, {
        orgId: opts.orgId,
        docType: opts.docType,
        docId: opts.docId,
      }, {
        filename: opts.customFilename || options.filename,
        orientation: options.orientation,
        format: options.format,
      });

      // Update document_print_log if applicable
      if (url && opts.docId) {
        await supabase
          .from('document_print_log')
          .update({ file_url: url })
          .eq('document_id', opts.docId)
          .eq('organization_id', opts.orgId);
      }

      return url;
    });

    return result ?? null;
  }, [wrap, options]);

  // ─── Excel ──────────────────────────────────────────────────

  const exportExcel = useCallback(async <T extends Record<string, any>>(
    data: T[], columns: ExcelColumn[], filename?: string
  ) => {
    await wrap(() => ExcelService.exportSingle(data, columns, filename));
  }, [wrap]);

  const exportMultiSheetExcel = useCallback(async (sheets: ExcelSheetDef[], filename?: string) => {
    await wrap(() => ExcelService.exportMultiSheet(sheets, filename));
  }, [wrap]);

  const exportJSONExcel = useCallback(async (data: Record<string, any>[], filename?: string) => {
    await wrap(() => ExcelService.exportJSON(data, filename));
  }, [wrap]);

  // ─── Print ──────────────────────────────────────────────────

  const print = useCallback((el: HTMLElement | null, opts?: PrintOptions) => {
    if (!el) return;
    // Inject guilloche background HTML into print options
    if (hasBackground && backgroundHTML) {
      const guillocheCSS = `
        .guilloche-print-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          ${bgColor ? `background-color: ${bgColor};` : ''}
        }
        .print-container { position: relative; z-index: 1; }
      `;
      const mergedCSS = (opts?.customCSS || '') + '\n' + guillocheCSS;
      PrintService.printWithBackground(el, backgroundHTML, { ...opts, customCSS: mergedCSS });
    } else {
      PrintService.print(el, opts);
    }
  }, [hasBackground, backgroundHTML, bgColor]);

  const printWithTheme = useCallback((el: HTMLElement | null, themeId: PrintThemeId) => {
    if (!el) {
      toast.error('لا يوجد محتوى للطباعة');
      return;
    }
    const theme = getThemeById(themeId);
    const themeCSS = generateThemeCSS(theme);
    // Use the print function which already handles guilloche injection
    print(el, { customCSS: themeCSS });
  }, [print]);

  // ─── Backward-compatible aliases ────────────────────────────

  const exportToPDF = useCallback(async (el: HTMLElement | null, customFilename?: string) => {
    await downloadPDF(el, { customFilename });
  }, [downloadPDF]);

  const printContent = useCallback((el: HTMLElement | null, styles?: string) => {
    print(el, styles ? { customCSS: styles } : undefined);
  }, [print]);

  return {
    // New API
    downloadPDF,
    previewPDF,
    uploadPDF,
    exportAndUpload,
    exportExcel,
    exportMultiSheetExcel,
    exportJSONExcel,
    print,
    printWithTheme,
    isProcessing,

    // Backward-compatible aliases
    exportToPDF,
    printContent,
    isExporting: isProcessing,
  };
};

export default useDocumentService;

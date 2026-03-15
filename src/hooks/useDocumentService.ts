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
 *  - Guilloche background injection
 *  - Dynamic watermark (org + user + date)
 *  - Print permission enforcement + audit logging
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
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { generatePrintWatermarkHTML, getSecurePrintCSS, logPrintAudit } from '@/lib/printSecurityUtils';

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
  /** Skip permission check (for public-facing docs) */
  skipPermissionCheck?: boolean;
}

// ─── Dynamic Watermark Generator ─────────────────────────────
function generateWatermarkHTML(orgName: string, userName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const watermarkText = `${orgName} | ${userName} | ${dateStr} ${timeStr}`;

  // Create multiple rows of diagonal watermark text
  const rows: string[] = [];
  for (let i = 0; i < 8; i++) {
    const top = 5 + i * 12;
    rows.push(`
      <div style="
        position: absolute;
        top: ${top}%;
        left: -10%;
        right: -10%;
        text-align: center;
        font-size: 14px;
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        color: rgba(0, 0, 0, 0.04);
        transform: rotate(-35deg);
        white-space: nowrap;
        letter-spacing: 4px;
        font-weight: 700;
        pointer-events: none;
        user-select: none;
      ">${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}</div>
    `);
  }

  return `
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;">
      ${rows.join('')}
    </div>
  `;
}

// ─── Print watermark CSS for print window ────────────────────
function generateWatermarkCSS(): string {
  return `
    .dynamic-watermark-layer {
      position: fixed; inset: 0; z-index: 2; pointer-events: none; overflow: hidden;
    }
    .dynamic-watermark-layer div {
      position: absolute; left: -10%; right: -10%; text-align: center;
      font-size: 14px; font-family: 'Cairo', 'Segoe UI', sans-serif;
      color: rgba(0, 0, 0, 0.04) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      transform: rotate(-35deg); white-space: nowrap;
      letter-spacing: 4px; font-weight: 700;
      pointer-events: none; user-select: none;
    }
  `;
}

function generateWatermarkHTMLForPrint(orgName: string, userName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const watermarkText = `${orgName} | ${userName} | ${dateStr} ${timeStr}`;

  const rows: string[] = [];
  for (let i = 0; i < 8; i++) {
    const top = 5 + i * 12;
    rows.push(`<div style="top:${top}%;">${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${watermarkText}</div>`);
  }

  return `<div class="dynamic-watermark-layer">${rows.join('')}</div>`;
}

// ─── Audit Logger ────────────────────────────────────────────
async function logPrintAction(userId: string | undefined, orgId: string | undefined, action: string, details?: Record<string, any>) {
  if (!userId || !orgId) return;
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      organization_id: orgId,
      action,
      action_type: 'print',
      resource_type: 'document',
      details: details as any,
    });
  } catch (e) {
    console.error('Failed to log print action:', e);
  }
}

export const useDocumentService = (options: UseDocumentServiceOptions = {}): UseDocumentServiceReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const { backgroundHTML, bgColor, hasBackground } = useGuillocheBackground();
  const { user, organization, profile } = useAuth();
  const { hasPermission, isAdmin, isCompanyAdmin } = useMyPermissions();

  const orgName = organization?.name || '';
  const userName = profile?.full_name || user?.email || '';
  const orgId = organization?.id;
  const userId = user?.id;

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

  /** Check if user has print permission */
  const canPrint = useCallback((): boolean => {
    if (options.skipPermissionCheck) return true;
    if (isAdmin || isCompanyAdmin) return true;
    return hasPermission('print_documents');
  }, [options.skipPermissionCheck, isAdmin, isCompanyAdmin, hasPermission]);

  /** Guard: check permission and show error if denied */
  const guardPrint = useCallback((actionName: string): boolean => {
    if (canPrint()) return true;
    toast.error('ليس لديك صلاحية طباعة المستندات. تواصل مع مدير الجهة لمنحك الصلاحية.');
    return false;
  }, [canPrint]);

  /** Inject guilloche background + dynamic watermark overlay into an element, returns cleanup fn */
  const injectGuillocheOverlay = useCallback((el: HTMLElement): (() => void) => {
    const cleanups: (() => void)[] = [];

    // Save original styles
    const origPosition = el.style.position;
    const origBg = el.style.backgroundColor;

    if (!origPosition || origPosition === 'static') {
      el.style.position = 'relative';
    }

    // 1. Inject guilloche background
    if (hasBackground && backgroundHTML) {
      if (bgColor) {
        el.style.backgroundColor = bgColor;
      }
      const overlay = document.createElement('div');
      overlay.className = 'guilloche-bg-overlay';
      overlay.innerHTML = backgroundHTML;
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
      el.insertBefore(overlay, el.firstChild);
      cleanups.push(() => overlay.remove());
    }

    // 2. Inject dynamic watermark
    if (orgName) {
      const watermarkDiv = document.createElement('div');
      watermarkDiv.className = 'dynamic-watermark-overlay';
      watermarkDiv.innerHTML = generateWatermarkHTML(orgName, userName);
      watermarkDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden;';
      el.appendChild(watermarkDiv);
      cleanups.push(() => watermarkDiv.remove());
    }

    // Ensure content is above overlays
    Array.from(el.children).forEach(child => {
      const c = child as HTMLElement;
      if (!c.classList.contains('guilloche-bg-overlay') && !c.classList.contains('dynamic-watermark-overlay')) {
        if (!c.style.position || c.style.position === 'static') {
          c.style.position = 'relative';
        }
        if (!c.style.zIndex) {
          c.style.zIndex = '1';
        }
      }
    });

    return () => {
      cleanups.forEach(fn => fn());
      el.style.position = origPosition;
      el.style.backgroundColor = origBg;
    };
  }, [hasBackground, backgroundHTML, bgColor, orgName, userName]);

  // ─── PDF ────────────────────────────────────────────────────

  const downloadPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions & { customFilename?: string }) => {
    if (!el) return;
    if (!guardPrint('download_pdf')) return;
    const cleanup = injectGuillocheOverlay(el);
    try {
      const mergedOpts: PDFOptions = {
        ...opts,
        filename: opts?.customFilename || opts?.filename || options.filename || 'document',
        orientation: opts?.orientation || options.orientation,
        format: opts?.format || options.format,
      };
      await wrap(() => PDFService.download(el, mergedOpts));
      logPrintAction(userId, orgId, 'pdf_download', { filename: mergedOpts.filename });
    } finally {
      cleanup();
    }
  }, [wrap, options, injectGuillocheOverlay, guardPrint, userId, orgId]);

  const previewPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions) => {
    if (!el) return;
    if (!guardPrint('preview_pdf')) return;
    const cleanup = injectGuillocheOverlay(el);
    try {
      const mergedOpts: PDFOptions = {
        ...opts,
        orientation: opts?.orientation || options.orientation,
        format: opts?.format || options.format,
      };
      await wrap(() => PDFService.preview(el, mergedOpts));
      logPrintAction(userId, orgId, 'pdf_preview');
    } finally {
      cleanup();
    }
  }, [wrap, options, injectGuillocheOverlay, guardPrint, userId, orgId]);

  const uploadPDF = useCallback(async (el: HTMLElement | null, upload: UploadOptions, opts?: PDFOptions) => {
    if (!el) return null;
    if (!guardPrint('upload_pdf')) return null;
    const cleanup = injectGuillocheOverlay(el);
    try {
      const result = (await wrap(() => PDFService.uploadToStorage(el, upload, opts))) ?? null;
      logPrintAction(userId, orgId, 'pdf_upload', { docType: upload.docType });
      return result;
    } finally {
      cleanup();
    }
  }, [wrap, injectGuillocheOverlay, guardPrint, userId, orgId]);

  const exportAndUpload = useCallback(async (
    el: HTMLElement | null,
    opts: { orgId: string; docType: string; docId: string; customFilename?: string }
  ): Promise<string | null> => {
    if (!el) return null;
    if (!guardPrint('export_and_upload')) return null;
    const cleanup = injectGuillocheOverlay(el);

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

    cleanup();
    logPrintAction(userId, orgId, 'pdf_export_upload', { docType: opts.docType, docId: opts.docId });
    return result ?? null;
  }, [wrap, options, injectGuillocheOverlay, guardPrint, userId, orgId]);

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
    if (!guardPrint('print')) return;

    // Build combined background + watermark HTML for print window
    const bgParts: string[] = [];
    let extraCSS = opts?.customCSS || '';

    // Guilloche background
    if (hasBackground && backgroundHTML) {
      const guillocheCSS = `
        .guilloche-print-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          ${bgColor ? `background-color: ${bgColor};` : ''}
        }
        .print-container { position: relative; z-index: 1; }
      `;
      extraCSS += '\n' + guillocheCSS;
      bgParts.push(backgroundHTML);
    }

    // Dynamic watermark
    if (orgName) {
      extraCSS += '\n' + generateWatermarkCSS();
    }

    const combinedBgHTML = bgParts.length > 0
      ? bgParts.join('')
      : '';

    const watermarkHTML = orgName ? generateWatermarkHTMLForPrint(orgName, userName) : '';

    if (combinedBgHTML || watermarkHTML) {
      PrintService.printWithBackground(el, combinedBgHTML + watermarkHTML, { ...opts, customCSS: extraCSS });
    } else {
      PrintService.print(el, opts);
    }

    logPrintAction(userId, orgId, 'browser_print');
  }, [hasBackground, backgroundHTML, bgColor, orgName, userName, guardPrint, userId, orgId]);

  const printWithTheme = useCallback((el: HTMLElement | null, themeId: PrintThemeId) => {
    if (!el) {
      toast.error('لا يوجد محتوى للطباعة');
      return;
    }
    const theme = getThemeById(themeId);
    const themeCSS = generateThemeCSS(theme);
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

/**
 * ============================================================
 * DocumentService — Unified Document Generation Module
 * ============================================================
 * 
 * Centralizes all document operations:
 *  1. PDF Generation & Preview (jsPDF + html2canvas)
 *  2. Excel Export (lightweight XLSX via JSZip)
 *  3. Browser Print (CSS Print Media Queries, vector text)
 * 
 * Standards:
 *  - A4 portrait, 20mm margins
 *  - Dynamic scaling to fit single page
 *  - RTL (Arabic) support
 *  - Vector-based text for print quality
 * ============================================================
 */

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createWorkbook, aoaToSheet, jsonToSheet, writeFile } from '@/lib/excelExport';
import { generateGuillocheTextFillerHTML, generateMICRLineHTML, MICR_FONT_FACE_CSS } from '@/lib/printSecurityUtils';

// ─── A4 Constants ────────────────────────────────────────────
export const A4 = {
  width: 210,        // mm
  height: 297,       // mm
  margin: 20,        // mm
  contentWidth: 170,  // 210 - 2×20
  contentHeight: 257, // 297 - 2×20
} as const;

export const A4_PX = {
  width: Math.round(A4.contentWidth * 96 / 25.4),   // ~643px
  height: Math.round(A4.contentHeight * 96 / 25.4),  // ~972px
  fullWidth: Math.round(A4.width * 96 / 25.4),       // ~794px
} as const;

// ─── Types ───────────────────────────────────────────────────
export interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
  quality?: number;
  fitSinglePage?: boolean;
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelSheetDef {
  name: string;
  data: Record<string, any>[];
  columns: ExcelColumn[];
}

export interface PrintOptions {
  customCSS?: string;
  fitSinglePage?: boolean;
  orgClientCode?: string | null;
  orgVerificationCode?: string | null;
}

export interface UploadOptions {
  orgId: string;
  docType: string;
  docId: string;
}

// ─── Scaling Utilities ───────────────────────────────────────
export function calcFitScale(element: HTMLElement): number {
  const scaleX = element.scrollWidth > A4_PX.width ? A4_PX.width / element.scrollWidth : 1;
  const scaleY = element.scrollHeight > A4_PX.height ? A4_PX.height / element.scrollHeight : 1;
  return Math.min(scaleX, scaleY, 1);
}

function applyScaling(el: HTMLElement): () => void {
  const scale = calcFitScale(el);
  const orig = { transform: el.style.transform, origin: el.style.transformOrigin, overflow: el.style.overflow };
  if (scale < 1) {
    el.style.transform = `scale(${scale})`;
    el.style.transformOrigin = 'top right';
    el.style.overflow = 'hidden';
  }
  return () => {
    el.style.transform = orig.transform;
    el.style.transformOrigin = orig.origin;
    el.style.overflow = orig.overflow;
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. PDF SERVICE — jsPDF + html2canvas
// ═══════════════════════════════════════════════════════════════
export const PDFService = {
  /**
   * Generate a jsPDF instance from an HTML element.
   * Dynamically imports jspdf & html2canvas for code-splitting.
   */
  async generate(element: HTMLElement, opts: PDFOptions = {}): Promise<any> {
    const [html2canvas, { default: jsPDF }] = await Promise.all([
      import('html2canvas').then(m => m.default),
      import('jspdf'),
    ]);

    const {
      orientation = 'portrait',
      format = 'a4',
      scale = 1.5,
      quality = 0.85,
      fitSinglePage = false,
    } = opts;

    const pdf = new jsPDF({ orientation, unit: 'mm', format, compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Temporarily constrain to A4 width
    const origCSS = element.style.cssText;
    element.style.width = `${A4_PX.fullWidth}px`;
    element.style.maxWidth = `${A4_PX.fullWidth}px`;
    element.style.padding = '8mm';
    element.style.boxSizing = 'border-box';
    element.style.backgroundColor = '#ffffff';
    element.style.overflow = 'visible';

    // Hide no-print elements
    const noPrint = element.querySelectorAll('.no-print');
    noPrint.forEach(el => ((el as HTMLElement).style.display = 'none'));

    let cleanupScale: (() => void) | null = null;

    try {
      // Wait for incomplete images (fast timeout)
      const imgs = Array.from(element.querySelectorAll('img'));
      const pending = imgs.filter(i => !i.complete);
      if (pending.length > 0) {
        await Promise.allSettled(
          pending.map(i =>
            new Promise<void>(r => {
              i.onload = () => r();
              i.onerror = () => r();
              setTimeout(r, 1500);
            })
          )
        );
      }
      // Minimal reflow wait
      await new Promise(r => setTimeout(r, 50));

      if (fitSinglePage) {
        cleanupScale = applyScaling(element);
        await new Promise(r => setTimeout(r, 30));
      }

      // Smart section-based capture (prevents cutting text lines between pages)
      if (!fitSinglePage) {
        const sectionNodes = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-section]'));
        if (sectionNodes.length > 0) {
          let currentY = 0;

          for (const section of sectionNodes) {
            const sectionCanvas = await html2canvas(section, {
              scale,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              logging: false,
            });

            const imgW = pageW;
            const imgH = (sectionCanvas.height * imgW) / sectionCanvas.width;
            const remaining = pageH - currentY;

            if (imgH > remaining && currentY > 0) {
              pdf.addPage();
              currentY = 0;
            }

            const imgData = sectionCanvas.toDataURL('image/jpeg', quality);
            pdf.addImage(imgData, 'JPEG', 0, currentY, imgW, imgH);
            currentY += imgH + 2;
          }

          return pdf;
        }
      }

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: A4_PX.fullWidth,
        windowWidth: A4_PX.fullWidth,
      });

      // Use full page width since padding is already inside the element
      const imgW = pageW;

      if (fitSinglePage) {
        const imgData = canvas.toDataURL('image/jpeg', quality);
        const imgH = (canvas.height * imgW) / canvas.width;
        const fitScale = Math.min(1, pageH / imgH);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW * fitScale, imgH * fitScale);
        return pdf;
      }

      // Robust multi-page slicing by exact page pixel height
      const pageHeightPx = Math.floor((pageH * canvas.width) / imgW);
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      if (!pageCtx) return pdf;

      pageCanvas.width = canvas.width;

      let offsetY = 0;
      let pageIndex = 0;

      while (offsetY < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        pageCanvas.height = sliceHeight;
        pageCtx.clearRect(0, 0, canvas.width, sliceHeight);
        pageCtx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const imgData = pageCanvas.toDataURL('image/jpeg', quality);
        const imgH = (sliceHeight * imgW) / canvas.width;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);

        offsetY += sliceHeight;
        pageIndex += 1;
      }

      return pdf;
    } finally {
      if (cleanupScale) cleanupScale();
      element.style.cssText = origCSS;
      noPrint.forEach(el => ((el as HTMLElement).style.display = ''));
    }
  },

  /** Generate and download PDF */
  async download(element: HTMLElement, opts: PDFOptions = {}): Promise<void> {
    const toastId = toast.loading('جاري إنشاء ملف PDF...');
    try {
      const pdf = await this.generate(element, opts);
      const name = opts.filename || 'document';
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${name}-${date}.pdf`);
      toast.dismiss(toastId);
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (e) {
      console.error('PDF download error:', e);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير PDF');
    }
  },

  /** Generate and open PDF preview in new tab */
  async preview(element: HTMLElement, opts: PDFOptions = {}): Promise<void> {
    const toastId = toast.loading('جاري إنشاء المعاينة...');
    try {
      const pdf = await this.generate(element, { ...opts, scale: 1.5, quality: 0.8 });
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.dismiss(toastId);
      toast.success('تم فتح المعاينة');
    } catch (e) {
      console.error('PDF preview error:', e);
      toast.dismiss(toastId);
      toast.error('فشل إنشاء المعاينة');
    }
  },

  /** Generate PDF, upload to storage, return public URL */
  async uploadToStorage(element: HTMLElement, upload: UploadOptions, opts: PDFOptions = {}): Promise<string | null> {
    try {
      const pdf = await this.generate(element, opts);
      const blob = pdf.output('blob');
      const date = new Date().toISOString().split('T')[0];
      const path = `${upload.orgId}/${upload.docType}/${upload.docId}-${date}.pdf`;

      const { error } = await supabase.storage
        .from('document-archive')
        .upload(path, blob, { contentType: 'application/pdf', upsert: true });

      if (error) { console.error('Upload error:', error); return null; }

      const { data } = supabase.storage.from('document-archive').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (e) {
      console.error('PDF upload error:', e);
      return null;
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// 2. EXCEL SERVICE — Lightweight XLSX via JSZip
// ═══════════════════════════════════════════════════════════════
export const ExcelService = {
  /** Export a single sheet of data */
  async exportSingle<T extends Record<string, any>>(
    data: T[],
    columns: ExcelColumn[],
    filename = 'export',
    sheetName = 'البيانات'
  ): Promise<void> {
    if (!data.length) { toast.error('لا توجد بيانات للتصدير'); return; }

    const toastId = toast.loading('جاري إنشاء ملف Excel...');
    try {
      const headers = columns.map(c => c.header);
      const rows = data.map(item =>
        columns.map(c => {
          const v = item[c.key];
          if (v instanceof Date) return v.toLocaleDateString('ar-EG');
          return v ?? '';
        })
      );

      const wb = createWorkbook();
      aoaToSheet(wb, [headers, ...rows], sheetName, columns.map(c => c.width || 15));

      const date = new Date().toISOString().split('T')[0];
      await writeFile(wb, `${filename}-${date}.xlsx`);

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (e) {
      console.error('Excel export error:', e);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير Excel');
    }
  },

  /** Export multiple sheets into one workbook */
  async exportMultiSheet(sheets: ExcelSheetDef[], filename = 'export'): Promise<void> {
    if (!sheets.length) { toast.error('لا توجد بيانات للتصدير'); return; }

    const toastId = toast.loading('جاري إنشاء ملف Excel...');
    try {
      const wb = createWorkbook();

      sheets.forEach(sheet => {
        const headers = sheet.columns.map(c => c.header);
        const rows = sheet.data.map(item =>
          sheet.columns.map(c => {
            const v = item[c.key];
            if (v instanceof Date) return v.toLocaleDateString('ar-EG');
            return v ?? '';
          })
        );
        aoaToSheet(wb, [headers, ...rows], sheet.name, sheet.columns.map(c => c.width || 15));
      });

      const date = new Date().toISOString().split('T')[0];
      await writeFile(wb, `${filename}-${date}.xlsx`);

      toast.dismiss(toastId);
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (e) {
      console.error('Excel multi-sheet export error:', e);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير Excel');
    }
  },

  /** Export raw JSON data (auto-detects columns from keys) */
  async exportJSON(data: Record<string, any>[], filename = 'export', sheetName = 'البيانات'): Promise<void> {
    if (!data.length) { toast.error('لا توجد بيانات للتصدير'); return; }

    const toastId = toast.loading('جاري إنشاء ملف Excel...');
    try {
      const wb = createWorkbook();
      jsonToSheet(wb, data, sheetName);
      const date = new Date().toISOString().split('T')[0];
      await writeFile(wb, `${filename}-${date}.xlsx`);
      toast.dismiss(toastId);
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (e) {
      console.error('Excel JSON export error:', e);
      toast.dismiss(toastId);
      toast.error('حدث خطأ أثناء تصدير Excel');
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. PRINT SERVICE — CSS Print Media Queries (Vector Text)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Aref+Ruqaa+Ink:wght@400;700&family=Reem+Kufi+Ink&display=swap');
  ${MICR_FONT_FACE_CSS}
  @page { size: A4 portrait; margin: 12mm; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: white !important;
    font-family: 'Cairo', sans-serif !important;
    direction: rtl;
    -webkit-font-smoothing: antialiased !important;
    text-rendering: optimizeLegibility !important;
  }

  .guilloche-print-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .print-container {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    overflow: visible !important;
    break-inside: auto;
  }

  .no-print { display: none !important; }

  img, svg, canvas {
    max-width: 100%;
    height: auto;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  table { width: 100%; border-collapse: collapse; page-break-inside: auto; background: transparent !important; }
  thead { display: table-header-group; background: transparent !important; }
  tr { page-break-inside: avoid; page-break-after: auto; background: transparent !important; }
  th, td { padding: 3px 6px; border: 1px solid #ddd; text-align: right; font-size: 9pt; line-height: 1.3; background: transparent !important; }

  h1 { font-size: 16pt; margin: 4px 0; }
  h2 { font-size: 13pt; margin: 3px 0; }
  h3 { font-size: 11pt; margin: 2px 0; }
  p { font-size: 10pt; margin: 2px 0; line-height: 1.45; }

  @media print {
    body { margin: 0; padding: 0; }
    .print-container { overflow: visible !important; }
  }
`;

export const PrintService = {
  /** Open browser print dialog with vector-based text rendering */
  print(element: HTMLElement, opts: PrintOptions = {}): void {
    this._doPrint(element, '', opts);
  },

  /**
   * Print raw HTML string in a new window with unified A4 styling.
   * This is the centralized method — ALL components should use this
   * instead of manual window.open() + window.print().
   */
  printHTML(htmlContent: string, opts: { title?: string; windowFeatures?: string; customCSS?: string } = {}): void {
    const win = window.open('', '_blank', opts.windowFeatures);
    if (!win) { toast.error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'); return; }

    // Wrap in unified print structure if not already a full HTML doc
    const isFullDoc = htmlContent.trim().toLowerCase().startsWith('<!doctype') || htmlContent.trim().toLowerCase().startsWith('<html');
    
    const textFillerHTML = generateGuillocheTextFillerHTML();

    if (isFullDoc) {
      // For full HTML docs: inject guilloche per-page (skip pages with .no-guilloche)
      const dedupScript = `<script>var printed=false;function doPrint(){if(printed)return;printed=true;window.print();}window.addEventListener('load',function(){setTimeout(doPrint,200);});setTimeout(doPrint,1200);</script>`;
      // Inject a script that adds guilloche filler to each .page that doesn't have .no-guilloche
      const guillocheInjectorScript = `<script>
        window.addEventListener('DOMContentLoaded', function() {
          var pages = document.querySelectorAll('.page:not(.no-guilloche)');
          var fillerHTML = ${JSON.stringify(textFillerHTML.replace('position:fixed', 'position:absolute'))};
          pages.forEach(function(page) {
            page.style.position = 'relative';
            page.style.overflow = 'hidden';
            page.insertAdjacentHTML('afterbegin', fillerHTML);
          });
          // If no .page elements, apply globally
          if (!pages.length && !document.querySelector('.no-guilloche')) {
            document.body.insertAdjacentHTML('afterbegin', ${JSON.stringify(textFillerHTML)});
          }
        });
      </script>`;
      const injected = htmlContent.replace('</body>', `${guillocheInjectorScript}${dedupScript}</body>`);
      win.document.open();
      win.document.write(injected);
      win.document.close();
    } else {
      win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${opts.title || 'طباعة الوثيقة'}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap">
  <style>
    ${MICR_FONT_FACE_CSS}
    @page { size: A4 portrait; margin: 12mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: 'Cairo', sans-serif; direction: rtl; background: white; position: relative; }
    .guilloche-text-filler { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    table { background: transparent !important; }
    tr, th, td { background: transparent !important; }
    ${opts.customCSS || ''}
  </style>
</head>
<body>
  ${textFillerHTML}
  ${generateMICRLineHTML(opts.orgClientCode, opts.orgVerificationCode)}
  <div style="position:relative;z-index:2;">${htmlContent}</div>
  <script>var printed=false;function doPrint(){if(printed)return;printed=true;window.print();}window.addEventListener('load',function(){setTimeout(doPrint,200);});setTimeout(doPrint,1200);</script>
</body>
</html>`);
      win.document.close();
    }
  },

  /** Print with guilloche background HTML injected before the content */
  printWithBackground(element: HTMLElement, backgroundHTML: string, opts: PrintOptions = {}): void {
    this._doPrint(element, backgroundHTML, opts);
  },

  /**
   * Internal print implementation — 3-Layer Architecture:
   *   Layer 1 (z:0) — Guilloche frame & pattern background
   *   Layer 2 (z:1) — Dynamic watermark (org, user, date AR+EN)
   *   Layer 3 (z:2) — Document content
   */
  _doPrint(element: HTMLElement, backgroundHTML: string, opts: PrintOptions = {}): void {
    if (!element) { toast.error('لا يوجد محتوى للطباعة'); return; }

    const win = window.open('', '_blank');
    if (!win) { toast.error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'); return; }

    // === LAYER 1a: Guilloche background ===
    const guillocheLayer = backgroundHTML
      ? `<div class="layer-guilloche" style="position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;">${backgroundHTML}</div>`
      : '';

    // === LAYER 1b: Guilloche text filler threads (trilingual) ===
    const guillocheTextFiller = generateGuillocheTextFillerHTML();

    // === LAYER 2: Watermark — injected via backgroundHTML which may contain watermark ===
    // (Watermark HTML is appended to backgroundHTML by useDocumentService)

    // === LAYER 3: Document content (in .print-container) ===

    const fitScript = opts.fitSinglePage === true ? `
      <script>
        window.addEventListener('load', function() {
          var c = document.querySelector('.print-container');
          if (!c) return;
          var maxH = 257 * 3.7795;
          var h = c.scrollHeight;
          if (h > maxH) {
            var s = maxH / h;
            c.style.transform = 'scale(' + s + ')';
            c.style.transformOrigin = 'top right';
            c.style.overflow = 'hidden';
          }
        });
      </script>
    ` : '';

    const printCSS = `
      ${MICR_FONT_FACE_CSS}
      @page {
        size: A4 portrait;
        margin: 0;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        min-height: 297mm;
        background: white !important;
        font-family: 'Cairo', sans-serif !important;
        direction: rtl;
        -webkit-font-smoothing: antialiased !important;
        text-rendering: optimizeLegibility !important;
      }

      .page-wrapper {
        width: 210mm;
        min-height: 297mm;
        position: relative;
        overflow: hidden;
        background: white;
        margin: 0 auto;
      }

      /* ── Layer 1: Guilloche ── */
      .layer-guilloche {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }

      /* ── Layer 2: Watermark ── */
      .watermark-layer {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
        mix-blend-mode: multiply;
      }

      /* ── Layer 3: Document Content ── */
      .print-container {
        position: relative;
        z-index: 2;
        width: 100%;
        padding: 8mm 10mm 12mm 10mm;
        box-sizing: border-box;
        overflow: visible !important;
        break-inside: auto;
      }

      .no-print { display: none !important; }

      img, svg, canvas {
        max-width: 100%;
        height: auto;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      table { width: 100%; border-collapse: collapse; page-break-inside: auto; background: transparent !important; }
      thead { display: table-header-group; background: transparent !important; }
      tr { page-break-inside: avoid; page-break-after: auto; background: transparent !important; }
      th, td { padding: 3px 6px; border: 1px solid #ddd; text-align: right; font-size: 9pt; line-height: 1.3; background: transparent !important; }
      .print-container, .print-container * { background-color: transparent !important; }
      .print-container table th, .print-container table td { background: transparent !important; }
      .bg-white, .bg-gray-50, .bg-gray-100, [class*="bg-"] { background-color: transparent !important; }

      h1 { font-size: 16pt; margin: 4px 0; }
      h2 { font-size: 13pt; margin: 3px 0; }
      h3 { font-size: 11pt; margin: 2px 0; }
      p { font-size: 10pt; margin: 2px 0; line-height: 1.45; }

      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
        }
        .page-wrapper {
          width: 210mm;
          height: 297mm;
          page-break-after: always;
        }
      }

      @media screen {
        body {
          background: #e5e7eb !important;
          display: flex;
          justify-content: center;
          padding: 0;
          margin: 0;
          min-height: 100vh;
        }
        .page-wrapper {
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          border-radius: 0;
          width: 100vw;
          max-width: 210mm;
          min-height: 100vh;
          transform-origin: top center;
        }
      }

      /* Scale A4 to fit viewport on small screens */
      @media screen and (max-width: 210mm) {
        .page-wrapper {
          width: 100vw !important;
          min-height: auto !important;
          transform: scale(calc(100vw / 793.7px));
          transform-origin: top right;
          height: calc(297mm * (100vw / 210mm));
        }
      }

      ${opts.customCSS || ''}
    `;

    // Clone and clean content
    const contentClone = element.cloneNode(true) as HTMLElement;
    contentClone.style.width = '';
    contentClone.style.minHeight = '';
    contentClone.style.margin = '';
    contentClone.style.padding = '';
    contentClone.style.boxSizing = '';
    contentClone.querySelectorAll('.no-print').forEach(el => el.remove());

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes">
  <title>طباعة الوثيقة</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap">
  <style>${printCSS}</style>
  ${fitScript}
</head>
<body>
  <div class="page-wrapper">
    ${guillocheLayer}
    ${guillocheTextFiller}
    ${generateMICRLineHTML(opts.orgClientCode, opts.orgVerificationCode)}
    <div class="print-container">${contentClone.innerHTML}</div>
  </div>
  <script>
    var printed = false;
    function doPrint() {
      if (printed) return;
      printed = true;
      window.print();
    }
    window.addEventListener('load', function() {
      setTimeout(doPrint, 200);
    });
    setTimeout(doPrint, 1200);
  </script>
</body>
</html>`);
    win.document.close();
  },
};

// ═══════════════════════════════════════════════════════════════
// UNIFIED DOCUMENT SERVICE
// ═══════════════════════════════════════════════════════════════
const DocumentService = {
  pdf: PDFService,
  excel: ExcelService,
  print: PrintService,
  constants: { A4, A4_PX },
  utils: { calcFitScale, applyScaling },
};

export default DocumentService;

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
      scale = 2,
      quality = 0.92,
      fitSinglePage = true,
    } = opts;

    // Temporarily constrain to A4 width
    const origCSS = element.style.cssText;
    element.style.width = `${A4_PX.fullWidth}px`;
    element.style.maxWidth = `${A4_PX.fullWidth}px`;
    element.style.padding = `${A4.margin}mm`;
    element.style.boxSizing = 'border-box';
    element.style.backgroundColor = '#ffffff';
    element.style.overflow = 'visible';

    // Hide no-print elements
    const noPrint = element.querySelectorAll('.no-print');
    noPrint.forEach(el => (el as HTMLElement).style.display = 'none');

    // Wait for images
    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.allSettled(
      imgs.filter(i => !i.complete).map(i =>
        new Promise<void>(r => { i.onload = () => r(); i.onerror = () => r(); setTimeout(r, 3000); })
      )
    );
    await new Promise(r => setTimeout(r, 200));

    // Apply single-page scaling
    let cleanupScale: (() => void) | null = null;
    if (fitSinglePage) {
      cleanupScale = applyScaling(element);
      await new Promise(r => setTimeout(r, 100));
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

    const pdf = new jsPDF({ orientation, unit: 'mm', format, compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/jpeg', quality);
    const imgW = A4.contentWidth;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (fitSinglePage || imgH <= A4.contentHeight) {
      const fitScale = Math.min(1, A4.contentHeight / imgH);
      pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin, imgW * fitScale, imgH * fitScale);
    } else {
      let left = imgH;
      let pos = 0;
      pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin, imgW, imgH);
      left -= A4.contentHeight;
      while (left > 0) {
        pos = -(imgH - left);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', A4.margin, A4.margin + pos, imgW, imgH);
        left -= A4.contentHeight;
      }
    }

    // Cleanup
    if (cleanupScale) cleanupScale();
    element.style.cssText = origCSS;
    noPrint.forEach(el => (el as HTMLElement).style.display = '');

    return pdf;
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
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

  @page { size: A4 portrait; margin: 20mm; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    box-sizing: border-box;
  }

  html, body {
    margin: 0; padding: 0;
    background: white !important;
    font-family: 'Cairo', sans-serif !important;
    direction: rtl;
    -webkit-font-smoothing: antialiased !important;
    text-rendering: optimizeLegibility !important;
  }

  .print-container {
    width: 170mm; max-width: 170mm;
    max-height: 257mm;
    margin: 0 auto; padding: 0;
    box-sizing: border-box;
    overflow: hidden !important;
  }

  .no-print { display: none !important; }

  img { max-width: 100%; height: auto; max-height: 60mm; object-fit: contain; }

  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  th, td { padding: 3px 6px; border: 1px solid #ddd; text-align: right; font-size: 9pt; line-height: 1.3; }

  h1 { font-size: 16pt; margin: 4px 0; }
  h2 { font-size: 13pt; margin: 3px 0; }
  h3 { font-size: 11pt; margin: 2px 0; }
  p { font-size: 10pt; margin: 2px 0; line-height: 1.4; }

  @media print {
    body { margin: 0; padding: 0; }
    .print-container { overflow: hidden !important; }
  }
`;

export const PrintService = {
  /** Open browser print dialog with vector-based text rendering */
  print(element: HTMLElement, opts: PrintOptions = {}): void {
    if (!element) { toast.error('لا يوجد محتوى للطباعة'); return; }

    const win = window.open('', '_blank');
    if (!win) { toast.error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'); return; }

    // Collect existing stylesheets
    let collected = '';
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(r => { collected += r.cssText + '\n'; });
        }
      } catch {
        if (sheet.href) collected += `@import url("${sheet.href}");\n`;
      }
    });

    const fitScript = opts.fitSinglePage !== false ? `
      <script>
        window.addEventListener('load', function() {
          var c = document.querySelector('.print-container');
          if (!c) return;
          var maxH = ${A4_PX.height};
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

    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>طباعة الوثيقة</title>
          <style>${collected}\n${opts.customCSS || DEFAULT_PRINT_CSS}</style>
          ${fitScript}
        </head>
        <body>
          <div class="print-container">${element.outerHTML}</div>
        </body>
      </html>
    `);
    win.document.close();

    let printed = false;
    const doPrint = () => { if (printed) return; printed = true; win.print(); };
    win.onload = () => setTimeout(doPrint, 500);
    setTimeout(doPrint, 2000);
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

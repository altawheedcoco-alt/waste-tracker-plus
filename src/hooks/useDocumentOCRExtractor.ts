import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Lazy-load pdfjs-dist only when needed */
let pdfjsLib: typeof import('pdfjs-dist') | null = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
  }
  return pdfjsLib;
}

export interface OCRExtractedData {
  raw_text: string;
  detected_fields: {
    license_number?: string;
    issue_date?: string;
    expiry_date?: string;
    holder_name?: string;
    issuing_authority?: string;
    waste_types?: string[];
    document_type?: string;
  };
  confidence: number;
  pages_count?: number;
}

/** Convert file/blob to base64 data URL */
async function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Render a PDF page to a PNG blob */
async function pdfPageToImage(page: any, scale = 2): Promise<Blob> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

/** Extract verbatim text from a PDF page text layer when available */
async function pdfPageToText(page: any): Promise<string> {
  try {
    const textContent = await page.getTextContent();
    const items = (textContent?.items || []) as Array<{ str?: string; transform?: number[] }>;

    if (!items.length) return '';

    const lines: Array<{ y: number; parts: string[] }> = [];

    for (const item of items) {
      const text = item?.str?.trim();
      if (!text) continue;

      const y = item.transform?.[5] ?? 0;
      const existingLine = lines.find((line) => Math.abs(line.y - y) < 4);

      if (existingLine) {
        existingLine.parts.push(text);
      } else {
        lines.push({ y, parts: [text] });
      }
    }

    return lines
      .sort((a, b) => b.y - a.y)
      .map((line) => line.parts.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  } catch {
    return '';
  }
}

function mergePageTexts(nativeText: string, aiText: string): string {
  const cleanNative = nativeText.trim();
  const cleanAi = aiText.trim();

  if (!cleanNative) return cleanAi;
  if (!cleanAi) return cleanNative;

  const normalizedNative = cleanNative.replace(/\s+/g, ' ').trim();
  const normalizedAi = cleanAi.replace(/\s+/g, ' ').trim();

  if (normalizedNative === normalizedAi) return cleanNative;
  if (normalizedNative.includes(normalizedAi)) return cleanNative;
  if (normalizedAi.includes(normalizedNative)) return cleanAi;

  return `${cleanNative}\n\n${cleanAi}`.trim();
}

export function useDocumentOCRExtractor() {
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedResult, setExtractedResult] = useState<OCRExtractedData | null>(null);

  /** Call AI edge function with an image base64 */
  const callAIExtract = async (
    base64: string,
    fileName: string,
    supplementalText?: string
  ): Promise<OCRExtractedData | null> => {
    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: { imageBase64: base64, fileName, supplementalText },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'فشل التحليل');

    const r = data.result;
    return {
      raw_text: r.raw_text || supplementalText || '',
      detected_fields: {
        license_number: r.detected_fields?.license_number || undefined,
        issue_date: r.detected_fields?.issue_date || undefined,
        expiry_date: r.detected_fields?.expiry_date || undefined,
        holder_name: r.detected_fields?.holder_name || undefined,
        issuing_authority: r.detected_fields?.issuing_authority || undefined,
        waste_types: r.detected_fields?.waste_types || undefined,
        document_type: r.document_type || undefined,
      },
      confidence: r.confidence || 90,
    };
  };

  /** Extract from image file */
  const extractFromImage = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    setExtracting(true);
    setProgress(10);
    try {
      const base64 = await toBase64(file);
      setProgress(30);
      const result = await callAIExtract(base64, file.name);
      if (result) {
        result.pages_count = 1;
        setExtractedResult(result);
        setProgress(100);
        toast.success(`تم استخراج البيانات بدقة ${Math.round(result.confidence)}%`);
      }
      return result;
    } catch (err: any) {
      console.error('AI OCR Error:', err);
      toast.error(err.message || 'فشل في استخراج البيانات');
      return null;
    } finally {
      setExtracting(false);
    }
  }, []);

  /** Extract from PDF file (multi-page) */
  const extractFromPdf = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    setExtracting(true);
    setProgress(5);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await getPdfJs();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      toast.info(`جارٍ تحليل ${totalPages} صفحة...`);

      let allText = '';
      let allFields: OCRExtractedData['detected_fields'] = {};
      let totalConfidence = 0;
      let analyzedPages = 0;

      for (let i = 1; i <= totalPages; i++) {
        setProgress(Math.round((i / (totalPages + 1)) * 90));
        const page = await pdfDoc.getPage(i);

        const nativePageText = await pdfPageToText(page);
        const pageBlob = await pdfPageToImage(page);
        const pageBase64 = await toBase64(pageBlob);
        const pageResult = await callAIExtract(pageBase64, `${file.name} - صفحة ${i}`, nativePageText || undefined);

        if (pageResult) {
          const mergedPageText = mergePageTexts(nativePageText, pageResult.raw_text || '');
          allText += `--- صفحة ${i} ---\n${mergedPageText}\n\n`;
          totalConfidence += pageResult.confidence;
          analyzedPages += 1;

          const f = pageResult.detected_fields;
          if (f.license_number) allFields.license_number = f.license_number;
          if (f.issue_date) allFields.issue_date = f.issue_date;
          if (f.expiry_date) allFields.expiry_date = f.expiry_date;
          if (f.holder_name) allFields.holder_name = f.holder_name;
          if (f.issuing_authority) allFields.issuing_authority = f.issuing_authority;
          if (f.document_type) allFields.document_type = f.document_type;
          if (f.waste_types?.length) {
            allFields.waste_types = [...new Set([...(allFields.waste_types || []), ...f.waste_types])];
          }
        } else if (nativePageText) {
          allText += `--- صفحة ${i} ---\n${nativePageText}\n\n`;
        }
      }

      const avgConfidence = analyzedPages > 0 ? totalConfidence / analyzedPages : 0;
      const result: OCRExtractedData = {
        raw_text: allText.trim(),
        detected_fields: allFields,
        confidence: avgConfidence,
        pages_count: totalPages,
      };

      setExtractedResult(result);
      setProgress(100);
      toast.success(`تم تحليل ${totalPages} صفحة وحفظ النص الكامل`);
      return result;
    } catch (err: any) {
      console.error('PDF AI OCR Error:', err);
      toast.error(err.message || 'فشل في تحليل ملف PDF');
      return null;
    } finally {
      setExtracting(false);
    }
  }, []);

  /** Universal extract — auto-detect image vs PDF */
  const extractFromFile = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    if (file.type === 'application/pdf') return extractFromPdf(file);
    if (file.type.startsWith('image/')) return extractFromImage(file);
    toast.error('صيغة غير مدعومة — يرجى رفع صورة أو PDF');
    return null;
  }, [extractFromImage, extractFromPdf]);

  const applyToOrganization = useCallback(async (
    organizationId: string,
    fields: OCRExtractedData['detected_fields']
  ) => {
    const updates: Record<string, any> = {};

    if (fields.license_number) {
      if (fields.document_type === 'wmra_license') {
        updates.wmra_license = fields.license_number;
        if (fields.expiry_date) updates.wmra_license_expiry_date = fields.expiry_date;
        if (fields.issue_date) updates.wmra_license_issue_date = fields.issue_date;
      } else if (fields.document_type === 'environmental_approval') {
        updates.environmental_approval_number = fields.license_number;
        if (fields.expiry_date) updates.env_approval_expiry = fields.expiry_date;
      } else if (fields.document_type === 'transport_license') {
        updates.land_transport_license = fields.license_number;
      }
    }

    if (Object.keys(updates).length === 0) {
      toast.info('لم يتم العثور على بيانات قابلة للتحديث التلقائي');
      return false;
    }

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId);

    if (error) {
      toast.error('فشل في حفظ البيانات المستخرجة');
      return false;
    }

    toast.success('تم حفظ البيانات المستخرجة بنجاح');
    return true;
  }, []);

  return { extractFromImage, extractFromPdf, extractFromFile, applyToOrganization, extracting, progress, extractedResult, setExtractedResult };
}

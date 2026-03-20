import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

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

// Regex patterns for Egyptian compliance documents
const PATTERNS = {
  wmra_license: /(?:WMRA|ومرا|تصريح\s*(?:رقم)?)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  env_approval: /(?:ENV|موافقة\s*بيئية|الموافقة\s*البيئية)\s*[:\-\/]?\s*([A-Z0-9\-\/]+)/i,
  transport_license: /(?:LTL|ترخيص\s*نقل|رخصة\s*النقل)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/g,
  expiry_keywords: /(?:ينتهي|صلاحية|انتهاء|تاريخ\s*الانتهاء|valid\s*until|expir)/i,
  issue_keywords: /(?:صادر|إصدار|تاريخ\s*الإصدار|issued|date\s*of\s*issue)/i,
  hazardous_keywords: /(?:مخلفات?\s*خطر|نفايات?\s*خطر|hazardous)/gi,
  medical_keywords: /(?:نفايات?\s*طبي|مخلفات?\s*طبي|medical\s*waste)/gi,
  industrial_keywords: /(?:نفايات?\s*صناعي|مخلفات?\s*صناعي|industrial\s*waste)/gi,
  wmra_authority: /(?:جهاز\s*تنظيم\s*إدارة\s*المخلفات|WMRA)/i,
  eeaa_authority: /(?:جهاز\s*شئون\s*البيئة|EEAA)/i,
};

function extractFieldsFromText(text: string): OCRExtractedData['detected_fields'] {
  const fields: OCRExtractedData['detected_fields'] = {};

  if (PATTERNS.wmra_license.test(text)) {
    fields.document_type = 'wmra_license';
    const match = text.match(PATTERNS.wmra_license);
    if (match) fields.license_number = match[1].trim();
  } else if (PATTERNS.env_approval.test(text)) {
    fields.document_type = 'environmental_approval';
    const match = text.match(PATTERNS.env_approval);
    if (match) fields.license_number = match[1].trim();
  } else if (PATTERNS.transport_license.test(text)) {
    fields.document_type = 'transport_license';
    const match = text.match(PATTERNS.transport_license);
    if (match) fields.license_number = match[1].trim();
  }

  const allDates = text.match(PATTERNS.date) || [];
  if (allDates.length > 0) {
    const lines = text.split('\n');
    for (const line of lines) {
      const dateMatch = line.match(PATTERNS.date);
      if (dateMatch) {
        if (PATTERNS.expiry_keywords.test(line)) {
          fields.expiry_date = dateMatch[0];
        } else if (PATTERNS.issue_keywords.test(line)) {
          fields.issue_date = dateMatch[0];
        }
      }
    }
    if (!fields.issue_date && allDates[0]) fields.issue_date = allDates[0];
    if (!fields.expiry_date && allDates[1]) fields.expiry_date = allDates[1];
  }

  const wasteTypes: string[] = [];
  if (PATTERNS.hazardous_keywords.test(text)) wasteTypes.push('مخلفات خطرة');
  if (PATTERNS.medical_keywords.test(text)) wasteTypes.push('نفايات طبية');
  if (PATTERNS.industrial_keywords.test(text)) wasteTypes.push('نفايات صناعية');
  if (wasteTypes.length > 0) fields.waste_types = wasteTypes;

  if (PATTERNS.wmra_authority.test(text)) {
    fields.issuing_authority = 'جهاز تنظيم إدارة المخلفات (WMRA)';
  } else if (PATTERNS.eeaa_authority.test(text)) {
    fields.issuing_authority = 'جهاز شئون البيئة (EEAA)';
  }

  return fields;
}

/** Convert a single image blob to high-contrast grayscale for better OCR */
async function preprocessImage(blob: Blob): Promise<Blob> {
  const imageUrl = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    const val = gray > 128 ? 255 : 0;
    pixels[i] = val;
    pixels[i + 1] = val;
    pixels[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  URL.revokeObjectURL(imageUrl);
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
}

/** Render a PDF page to a PNG blob at 300 DPI */
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

/** Try to extract embedded text from PDF (digital PDFs = 100% accuracy) */
async function extractTextFromPdfDirectly(pdfDoc: any): Promise<string> {
  let fullText = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText.trim();
}

export function useDocumentOCRExtractor() {
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedResult, setExtractedResult] = useState<OCRExtractedData | null>(null);

  /** Extract from image file */
  const extractFromImage = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    setExtracting(true);
    setProgress(0);

    try {
      const processedBlob = await preprocessImage(file);
      setProgress(20);

      const worker = await createWorker('ara+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(20 + Math.round((m.progress || 0) * 80));
          }
        },
      });

      const { data: ocrData } = await worker.recognize(processedBlob);
      await worker.terminate();

      const result: OCRExtractedData = {
        raw_text: ocrData.text,
        detected_fields: extractFieldsFromText(ocrData.text),
        confidence: ocrData.confidence,
        pages_count: 1,
      };

      setExtractedResult(result);
      return result;
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('فشل في استخراج النص من الصورة');
      return null;
    } finally {
      setExtracting(false);
      setProgress(100);
    }
  }, []);

  /** Extract from PDF file (multi-page support) */
  const extractFromPdf = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    setExtracting(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      toast.info(`جارٍ تحليل مستند PDF — ${totalPages} صفحة`);

      // Step 1: Try direct text extraction (digital PDFs)
      setProgress(10);
      const directText = await extractTextFromPdfDirectly(pdfDoc);

      if (directText.length > 50) {
        // Digital PDF — text layer exists
        setProgress(90);
        const result: OCRExtractedData = {
          raw_text: directText,
          detected_fields: extractFieldsFromText(directText),
          confidence: 99,
          pages_count: totalPages,
        };
        setExtractedResult(result);
        toast.success(`تم استخراج النص مباشرة من ${totalPages} صفحة — دقة 99%`);
        return result;
      }

      // Step 2: Scanned PDF — OCR each page
      const worker = await createWorker('ara+eng');
      let allText = '';
      let totalConfidence = 0;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const pageBlob = await pdfPageToImage(page);
        const processedBlob = await preprocessImage(pageBlob);

        const { data: ocrData } = await worker.recognize(processedBlob);
        allText += `--- صفحة ${i} ---\n${ocrData.text}\n\n`;
        totalConfidence += ocrData.confidence;

        setProgress(Math.round((i / totalPages) * 90));
      }

      await worker.terminate();

      const avgConfidence = totalConfidence / totalPages;
      const result: OCRExtractedData = {
        raw_text: allText,
        detected_fields: extractFieldsFromText(allText),
        confidence: avgConfidence,
        pages_count: totalPages,
      };

      setExtractedResult(result);
      toast.success(`تم تحليل ${totalPages} صفحة بدقة ${Math.round(avgConfidence)}%`);
      return result;
    } catch (err) {
      console.error('PDF OCR Error:', err);
      toast.error('فشل في تحليل ملف PDF');
      return null;
    } finally {
      setExtracting(false);
      setProgress(100);
    }
  }, []);

  /** Universal extract — auto-detect image vs PDF */
  const extractFromFile = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    if (file.type === 'application/pdf') {
      return extractFromPdf(file);
    }
    if (file.type.startsWith('image/')) {
      return extractFromImage(file);
    }
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

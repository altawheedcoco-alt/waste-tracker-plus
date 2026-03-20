import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

// Regex patterns for Egyptian compliance documents
const PATTERNS = {
  // License numbers
  wmra_license: /(?:WMRA|ومرا|تصريح\s*(?:رقم)?)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  env_approval: /(?:ENV|موافقة\s*بيئية|الموافقة\s*البيئية)\s*[:\-\/]?\s*([A-Z0-9\-\/]+)/i,
  transport_license: /(?:LTL|ترخيص\s*نقل|رخصة\s*النقل)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  
  // Dates (DD/MM/YYYY or YYYY-MM-DD or Arabic)
  date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/g,
  expiry_keywords: /(?:ينتهي|صلاحية|انتهاء|تاريخ\s*الانتهاء|valid\s*until|expir)/i,
  issue_keywords: /(?:صادر|إصدار|تاريخ\s*الإصدار|issued|date\s*of\s*issue)/i,

  // Waste types
  hazardous_keywords: /(?:مخلفات?\s*خطر|نفايات?\s*خطر|hazardous)/gi,
  medical_keywords: /(?:نفايات?\s*طبي|مخلفات?\s*طبي|medical\s*waste)/gi,
  industrial_keywords: /(?:نفايات?\s*صناعي|مخلفات?\s*صناعي|industrial\s*waste)/gi,

  // Authority
  wmra_authority: /(?:جهاز\s*تنظيم\s*إدارة\s*المخلفات|WMRA)/i,
  eeaa_authority: /(?:جهاز\s*شئون\s*البيئة|EEAA)/i,
};

function extractFieldsFromText(text: string): OCRExtractedData['detected_fields'] {
  const fields: OCRExtractedData['detected_fields'] = {};

  // Detect document type
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

  // Extract dates
  const allDates = text.match(PATTERNS.date) || [];
  if (allDates.length > 0) {
    // Try to find dates near expiry/issue keywords
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
    // Fallback: first date = issue, second = expiry
    if (!fields.issue_date && allDates[0]) fields.issue_date = allDates[0];
    if (!fields.expiry_date && allDates[1]) fields.expiry_date = allDates[1];
  }

  // Extract waste type keywords
  const wasteTypes: string[] = [];
  if (PATTERNS.hazardous_keywords.test(text)) wasteTypes.push('مخلفات خطرة');
  if (PATTERNS.medical_keywords.test(text)) wasteTypes.push('نفايات طبية');
  if (PATTERNS.industrial_keywords.test(text)) wasteTypes.push('نفايات صناعية');
  if (wasteTypes.length > 0) fields.waste_types = wasteTypes;

  // Detect authority
  if (PATTERNS.wmra_authority.test(text)) {
    fields.issuing_authority = 'جهاز تنظيم إدارة المخلفات (WMRA)';
  } else if (PATTERNS.eeaa_authority.test(text)) {
    fields.issuing_authority = 'جهاز شئون البيئة (EEAA)';
  }

  return fields;
}

export function useDocumentOCRExtractor() {
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedResult, setExtractedResult] = useState<OCRExtractedData | null>(null);

  const extractFromImage = useCallback(async (file: File): Promise<OCRExtractedData | null> => {
    setExtracting(true);
    setProgress(0);

    try {
      // Create image from file for preprocessing
      const imageUrl = URL.createObjectURL(file);
      
      // Preprocess: convert to high-contrast grayscale via canvas
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

      // Grayscale + contrast boost
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        // High contrast threshold
        const val = gray > 128 ? 255 : 0;
        pixels[i] = val;
        pixels[i + 1] = val;
        pixels[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);

      const processedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      URL.revokeObjectURL(imageUrl);

      // Run Tesseract OCR with Arabic + English
      const worker = await createWorker('ara+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });

      const { data: ocrData } = await worker.recognize(processedBlob);
      await worker.terminate();

      const result: OCRExtractedData = {
        raw_text: ocrData.text,
        detected_fields: extractFieldsFromText(ocrData.text),
        confidence: ocrData.confidence,
      };

      setExtractedResult(result);
      return result;
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('فشل في استخراج النص من المستند');
      return null;
    } finally {
      setExtracting(false);
      setProgress(100);
    }
  }, []);

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

  return { extractFromImage, applyToOrganization, extracting, progress, extractedResult, setExtractedResult };
}

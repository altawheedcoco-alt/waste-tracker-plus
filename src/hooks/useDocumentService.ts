/**
 * useDocumentService — React hook wrapper around DocumentService
 * Provides reactive state (loading, progress) for UI integration.
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

export interface UseDocumentServiceReturn {
  // PDF
  downloadPDF: (element: HTMLElement | null, opts?: PDFOptions) => Promise<void>;
  previewPDF: (element: HTMLElement | null, opts?: PDFOptions) => Promise<void>;
  uploadPDF: (element: HTMLElement | null, upload: UploadOptions, opts?: PDFOptions) => Promise<string | null>;

  // Excel
  exportExcel: <T extends Record<string, any>>(data: T[], columns: ExcelColumn[], filename?: string) => Promise<void>;
  exportMultiSheetExcel: (sheets: ExcelSheetDef[], filename?: string) => Promise<void>;
  exportJSONExcel: (data: Record<string, any>[], filename?: string) => Promise<void>;

  // Print
  print: (element: HTMLElement | null, opts?: PrintOptions) => void;

  // State
  isProcessing: boolean;
}

export const useDocumentService = (): UseDocumentServiceReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

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

  const downloadPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions) => {
    if (!el) return;
    await wrap(() => PDFService.download(el, opts));
  }, [wrap]);

  const previewPDF = useCallback(async (el: HTMLElement | null, opts?: PDFOptions) => {
    if (!el) return;
    await wrap(() => PDFService.preview(el, opts));
  }, [wrap]);

  const uploadPDF = useCallback(async (el: HTMLElement | null, upload: UploadOptions, opts?: PDFOptions) => {
    if (!el) return null;
    return (await wrap(() => PDFService.uploadToStorage(el, upload, opts))) ?? null;
  }, [wrap]);

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

  const print = useCallback((el: HTMLElement | null, opts?: PrintOptions) => {
    if (el) PrintService.print(el, opts);
  }, []);

  return {
    downloadPDF,
    previewPDF,
    uploadPDF,
    exportExcel,
    exportMultiSheetExcel,
    exportJSONExcel,
    print,
    isProcessing,
  };
};

export default useDocumentService;

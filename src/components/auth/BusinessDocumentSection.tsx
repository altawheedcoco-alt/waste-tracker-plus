import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Upload, X, Plus, FileText, Building2, Sparkles, Loader2,
  AlertTriangle, File, Image as ImageIcon, ScanLine, Check,
  Hash, Calendar, MapPin, User, Briefcase, CreditCard
} from 'lucide-react';
import { processReceiptImage } from '@/lib/imageProcessing';
import { supabase } from '@/integrations/supabase/client';

export interface ExtractedBusinessData {
  company_name_ar?: string;
  company_name_en?: string;
  tax_number?: string;
  commercial_register_number?: string;
  tax_file_number?: string;
  activity_type?: string;
  legal_form?: string;
  issue_date?: string;
  expiry_date?: string;
  address?: string;
  governorate?: string;
  owner_name?: string;
  owner_national_id?: string;
  capital?: string;
  branch_count?: string;
  registration_office?: string;
  vat_registered?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface BusinessDocumentData {
  documentType: string;
  pages: string[];
  enhancedPages: string[];
  fileTypes: string[];
  extractedData?: ExtractedBusinessData;
}

interface BusinessDocumentSectionProps {
  data: BusinessDocumentData;
  onUpdate: (data: BusinessDocumentData) => void;
}

const DOCUMENT_TYPES = [
  { value: 'tax_card', label: 'البطاقة الضريبية', icon: '🏛️' },
  { value: 'commercial_register', label: 'السجل التجاري', icon: '📋' },
  { value: 'data_statement', label: 'وثيقة البيانات', icon: '📄' },
  { value: 'other', label: 'مستند آخر', icon: '📎' },
];

// Field definitions per document type
const FIELD_DEFINITIONS: Record<string, { key: keyof ExtractedBusinessData; label: string; icon: React.ReactNode; dir?: string }[]> = {
  tax_card: [
    { key: 'company_name_ar', label: 'اسم الشركة (عربي)', icon: <Building2 className="w-3 h-3" /> },
    { key: 'company_name_en', label: 'اسم الشركة (إنجليزي)', icon: <Building2 className="w-3 h-3" />, dir: 'ltr' },
    { key: 'tax_number', label: 'رقم التسجيل الضريبي', icon: <Hash className="w-3 h-3" />, dir: 'ltr' },
    { key: 'tax_file_number', label: 'رقم الملف الضريبي', icon: <CreditCard className="w-3 h-3" />, dir: 'ltr' },
    { key: 'activity_type', label: 'نوع النشاط', icon: <Briefcase className="w-3 h-3" /> },
    { key: 'address', label: 'العنوان', icon: <MapPin className="w-3 h-3" /> },
    { key: 'governorate', label: 'المحافظة', icon: <MapPin className="w-3 h-3" /> },
    { key: 'owner_name', label: 'اسم صاحب الشأن', icon: <User className="w-3 h-3" /> },
    { key: 'owner_national_id', label: 'الرقم القومي للمالك', icon: <CreditCard className="w-3 h-3" />, dir: 'ltr' },
    { key: 'issue_date', label: 'تاريخ الإصدار', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
    { key: 'expiry_date', label: 'تاريخ الانتهاء', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
  ],
  commercial_register: [
    { key: 'company_name_ar', label: 'اسم الشركة (عربي)', icon: <Building2 className="w-3 h-3" /> },
    { key: 'company_name_en', label: 'اسم الشركة (إنجليزي)', icon: <Building2 className="w-3 h-3" />, dir: 'ltr' },
    { key: 'commercial_register_number', label: 'رقم السجل التجاري', icon: <Hash className="w-3 h-3" />, dir: 'ltr' },
    { key: 'legal_form', label: 'الشكل القانوني', icon: <FileText className="w-3 h-3" /> },
    { key: 'activity_type', label: 'نوع النشاط', icon: <Briefcase className="w-3 h-3" /> },
    { key: 'capital', label: 'رأس المال', icon: <CreditCard className="w-3 h-3" />, dir: 'ltr' },
    { key: 'address', label: 'العنوان', icon: <MapPin className="w-3 h-3" /> },
    { key: 'registration_office', label: 'مكتب التسجيل', icon: <Building2 className="w-3 h-3" /> },
    { key: 'owner_name', label: 'اسم صاحب الشأن / المدير المسؤول', icon: <User className="w-3 h-3" /> },
    { key: 'owner_national_id', label: 'الرقم القومي', icon: <CreditCard className="w-3 h-3" />, dir: 'ltr' },
    { key: 'branch_count', label: 'عدد الفروع', icon: <Hash className="w-3 h-3" />, dir: 'ltr' },
    { key: 'issue_date', label: 'تاريخ الإصدار', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
    { key: 'expiry_date', label: 'تاريخ الانتهاء', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
  ],
  data_statement: [
    { key: 'company_name_ar', label: 'اسم الشركة (عربي)', icon: <Building2 className="w-3 h-3" /> },
    { key: 'company_name_en', label: 'اسم الشركة (إنجليزي)', icon: <Building2 className="w-3 h-3" />, dir: 'ltr' },
    { key: 'commercial_register_number', label: 'رقم السجل التجاري', icon: <Hash className="w-3 h-3" />, dir: 'ltr' },
    { key: 'tax_number', label: 'رقم التسجيل الضريبي', icon: <Hash className="w-3 h-3" />, dir: 'ltr' },
    { key: 'legal_form', label: 'الشكل القانوني', icon: <FileText className="w-3 h-3" /> },
    { key: 'activity_type', label: 'نوع النشاط', icon: <Briefcase className="w-3 h-3" /> },
    { key: 'address', label: 'العنوان', icon: <MapPin className="w-3 h-3" /> },
    { key: 'owner_name', label: 'اسم صاحب الشأن', icon: <User className="w-3 h-3" /> },
    { key: 'issue_date', label: 'تاريخ الإصدار', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
  ],
  other: [
    { key: 'company_name_ar', label: 'اسم الشركة / الجهة', icon: <Building2 className="w-3 h-3" /> },
    { key: 'owner_name', label: 'اسم صاحب الشأن', icon: <User className="w-3 h-3" /> },
    { key: 'address', label: 'العنوان', icon: <MapPin className="w-3 h-3" /> },
    { key: 'issue_date', label: 'تاريخ الإصدار', icon: <Calendar className="w-3 h-3" />, dir: 'ltr' },
  ],
};

const enhanceImage = async (imageDataUrl: string): Promise<string> => {
  try {
    const result = await processReceiptImage(imageDataUrl, {
      enhanceContrast: true, sharpen: true, denoise: true, whiteBalance: true,
    });
    return result.processed;
  } catch { return imageDataUrl; }
};

const BusinessDocumentSection = ({ data, onUpdate }: BusinessDocumentSectionProps) => {
  const [enhancing, setEnhancing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFields = FIELD_DEFINITIONS[data.documentType] || FIELD_DEFINITIONS.other;

  const extractDataFromDocument = useCallback(async (imageDataUrl: string, docType: string) => {
    setExtracting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ocr-document-scanner', {
        body: {
          documentUrl: imageDataUrl,
          documentName: DOCUMENT_TYPES.find(t => t.value === docType)?.label || 'مستند',
          scanType: 'business_document',
          extractFields: true,
          documentCategory: docType,
        }
      });

      if (error) throw error;
      if (!result?.success) throw new Error('فشل في استخراج البيانات');

      const extracted = result.data;
      const businessData: ExtractedBusinessData = {};

      // Map extracted entities to fields
      if (extracted.entities) {
        for (const entity of extracted.entities) {
          const type = entity.type?.toLowerCase();
          const value = entity.value;
          if (!value) continue;

          if (type?.includes('اسم الشركة') || type?.includes('company_name') || type?.includes('اسم المنشأة'))
            businessData.company_name_ar = value;
          else if (type?.includes('company_name_en') || type?.includes('english'))
            businessData.company_name_en = value;
          else if (type?.includes('ضريب') || type?.includes('tax'))
            businessData.tax_number = value;
          else if (type?.includes('سجل') || type?.includes('register'))
            businessData.commercial_register_number = value;
          else if (type?.includes('ملف') || type?.includes('file'))
            businessData.tax_file_number = value;
          else if (type?.includes('نشاط') || type?.includes('activity'))
            businessData.activity_type = value;
          else if (type?.includes('قانوني') || type?.includes('legal'))
            businessData.legal_form = value;
          else if (type?.includes('عنوان') || type?.includes('address'))
            businessData.address = value;
          else if (type?.includes('محافظة') || type?.includes('governorate'))
            businessData.governorate = value;
          else if (type?.includes('مالك') || type?.includes('صاحب') || type?.includes('owner') || type?.includes('مدير'))
            businessData.owner_name = value;
          else if (type?.includes('قومي') || type?.includes('national_id'))
            businessData.owner_national_id = value;
          else if (type?.includes('رأس') || type?.includes('capital'))
            businessData.capital = value;
          else if (type?.includes('فرع') || type?.includes('branch'))
            businessData.branch_count = value;
          else if (type?.includes('مكتب') || type?.includes('office'))
            businessData.registration_office = value;
        }
      }

      // Map dates
      if (extracted.key_dates) {
        for (const dateItem of extracted.key_dates) {
          const label = dateItem.label?.toLowerCase();
          if (label?.includes('إصدار') || label?.includes('issue') || label?.includes('تاريخ القيد'))
            businessData.issue_date = dateItem.date;
          else if (label?.includes('انتهاء') || label?.includes('expiry') || label?.includes('سريان'))
            businessData.expiry_date = dateItem.date;
        }
      }

      // Try to extract from classification/summary as fallback
      if (extracted.classification) {
        // Use summary text to fill missing fields
      }

      setExtractionDone(true);
      toast.success('تم استخراج البيانات بنجاح — يرجى مراجعة الحقول');
      return businessData;
    } catch (err) {
      console.error('Business doc extraction error:', err);
      toast.warning('لم يتمكن النظام من استخراج البيانات تلقائياً — يرجى إدخالها يدوياً');
      setExtractionDone(true);
      return {} as ExtractedBusinessData;
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEnhancing(true);

    const newPages: string[] = [];
    const newEnhanced: string[] = [];
    const newFileTypes: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        toast.error(`"${file.name}" - يرجى رفع صور أو ملفات PDF فقط`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`"${file.name}" - حجم الملف يجب أن يكون أقل من 15 ميجابايت`);
        continue;
      }

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newPages.push(dataUrl);
      newFileTypes.push(file.type);

      if (isImage) {
        const enhanced = await enhanceImage(dataUrl);
        newEnhanced.push(enhanced);
      } else {
        newEnhanced.push(dataUrl);
      }
    }

    const updatedData = {
      ...data,
      pages: [...data.pages, ...newPages],
      enhancedPages: [...data.enhancedPages, ...newEnhanced],
      fileTypes: [...data.fileTypes, ...newFileTypes],
    };
    onUpdate(updatedData);
    setEnhancing(false);

    // Auto-extract from first image if no data extracted yet
    if (!extractionDone && newEnhanced.length > 0 && data.documentType) {
      const firstImage = newEnhanced.find((_, i) => newFileTypes[i]?.startsWith('image/')) || newEnhanced[0];
      if (firstImage && !firstImage.startsWith('data:application/pdf')) {
        const extracted = await extractDataFromDocument(firstImage, data.documentType);
        onUpdate({ ...updatedData, extractedData: { ...(data.extractedData || {}), ...extracted } });
      }
    }
  };

  const handleFieldChange = (key: keyof ExtractedBusinessData, value: string) => {
    const updated = { ...(data.extractedData || {}), [key]: value };
    onUpdate({ ...data, extractedData: updated });
  };

  const removePage = (index: number) => {
    const pages = [...data.pages];
    const enhanced = [...data.enhancedPages];
    const types = [...data.fileTypes];
    pages.splice(index, 1);
    enhanced.splice(index, 1);
    types.splice(index, 1);
    onUpdate({ ...data, pages, enhancedPages: enhanced, fileTypes: types });
  };

  const isPdf = (index: number) => data.fileTypes[index] === 'application/pdf';

  const handleRescan = async () => {
    if (data.enhancedPages.length === 0) return;
    const firstImage = data.enhancedPages.find((_, i) => !isPdf(i));
    if (!firstImage) { toast.error('لا توجد صور لإعادة المسح'); return; }
    const extracted = await extractDataFromDocument(firstImage, data.documentType);
    onUpdate({ ...data, extractedData: { ...(data.extractedData || {}), ...extracted } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-indigo-800 dark:text-indigo-200">المستند التجاري / الرسمي</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
            يرجى رفع البطاقة الضريبية أو السجل التجاري أو وثيقة البيانات للتحقق من صاحب الشأن (يقبل صور و PDF)
          </p>
        </div>
      </div>

      {/* Document Type Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">نوع المستند</Label>
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onUpdate({ ...data, documentType: type.value })}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                data.documentType === type.value
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-muted-foreground/15 hover:border-muted-foreground/30'
              }`}
            >
              <span className="text-lg">{type.icon}</span>
              <p className="text-[10px] font-semibold mt-0.5">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          صور / ملفات المستند
          <span className="text-[9px] text-muted-foreground">(يمكن رفع أكثر من صفحة - صور أو PDF)</span>
        </Label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="flex flex-wrap gap-2">
          {data.enhancedPages.map((page, idx) => (
            <div key={idx} className="relative group">
              {isPdf(idx) ? (
                <div className="w-20 h-28 rounded-lg border bg-red-50 dark:bg-red-950/20 flex flex-col items-center justify-center gap-1">
                  <File className="w-6 h-6 text-red-500" />
                  <p className="text-[8px] text-red-600 font-medium">PDF</p>
                </div>
              ) : (
                <img src={page} alt={`صفحة ${idx + 1}`} className="w-20 h-28 object-cover rounded-lg border" />
              )}
              <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                ص{idx + 1}
              </div>
              <button
                onClick={() => removePage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {!isPdf(idx) && (
                <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 bg-blue-500 text-white text-[7px] px-1 rounded">
                  <Sparkles className="w-2 h-2" /> محسّنة
                </div>
              )}
            </div>
          ))}

          {/* Add page button */}
          <div
            onClick={() => !enhancing && fileInputRef.current?.click()}
            className="w-20 h-28 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
          >
            {enhancing ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 text-muted-foreground/50" />
                <p className="text-[8px] text-muted-foreground text-center">إضافة صفحة</p>
                <div className="flex gap-0.5">
                  <ImageIcon className="w-2.5 h-2.5 text-muted-foreground/40" />
                  <File className="w-2.5 h-2.5 text-muted-foreground/40" />
                </div>
              </>
            )}
          </div>
        </div>

        {data.pages.length === 0 && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            يجب رفع صورة أو ملف واحد على الأقل من المستند التجاري
          </p>
        )}

        {data.pages.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px]">
              {data.pages.length} {data.pages.length === 1 ? 'صفحة' : 'صفحات'}
            </Badge>
            {data.fileTypes.some(t => t === 'application/pdf') && (
              <Badge variant="outline" className="text-[9px] border-red-200 text-red-600">
                يتضمن PDF
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Extracting indicator */}
      <AnimatePresence>
        {extracting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 p-4"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <ScanLine className="w-6 h-6 text-indigo-500" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ScanLine className="w-6 h-6 text-indigo-600" />
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">جاري قراءة المستند...</p>
                <p className="text-[10px] text-indigo-600">استخراج البيانات بالذكاء الاصطناعي</p>
              </div>
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extracted Data Fields */}
      <AnimatePresence>
        {data.pages.length > 0 && data.documentType && (extractionDone || (data.extractedData && Object.keys(data.extractedData).length > 0)) && !extracting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800 dark:text-green-200">
                  بيانات المستند المستخرجة
                </span>
                {data.extractedData && Object.values(data.extractedData).some(v => v) && (
                  <Badge variant="outline" className="text-[9px] border-green-300 text-green-700">
                    <Check className="w-2.5 h-2.5 mr-0.5" /> تم الاستخراج
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRescan}
                disabled={extracting}
                className="text-[10px] h-6 px-2 text-indigo-600 hover:text-indigo-700"
              >
                <ScanLine className="w-3 h-3 mr-1" /> إعادة المسح
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              راجع البيانات المستخرجة وعدّلها إن لزم الأمر — سيتم حفظها مع المستند
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentFields.map((field) => (
                <div key={field.key as string} className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {field.icon}
                    {field.label}
                  </Label>
                  <Input
                    value={(data.extractedData?.[field.key] as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.label}
                    className="h-8 text-xs"
                    dir={field.dir || 'rtl'}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessDocumentSection;

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, X, Plus, FileText, Building2, Sparkles, Loader2,
  AlertTriangle, File, Image as ImageIcon
} from 'lucide-react';
import { processReceiptImage } from '@/lib/imageProcessing';

export interface BusinessDocumentData {
  documentType: string;
  pages: string[]; // base64 previews
  enhancedPages: string[]; // enhanced versions
  fileTypes: string[]; // mime types per page
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        newEnhanced.push(dataUrl); // PDF kept as-is
      }
    }

    onUpdate({
      ...data,
      pages: [...data.pages, ...newPages],
      enhancedPages: [...data.enhancedPages, ...newEnhanced],
      fileTypes: [...data.fileTypes, ...newFileTypes],
    });
    setEnhancing(false);
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
    </div>
  );
};

export default BusinessDocumentSection;

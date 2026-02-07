import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { useEntityDocuments, UploadDocumentParams } from '@/hooks/useEntityDocuments';

const uploadSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  documentType: z.string().min(1, 'نوع المستند مطلوب'),
  documentCategory: z.string().min(1, 'تصنيف المستند مطلوب'),
  description: z.string().optional(),
  documentDate: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface EntityDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId?: string;
  externalPartnerId?: string;
  partnerName?: string;
  defaultCategory?: string;
  defaultType?: string;
  shipmentId?: string;
  invoiceId?: string;
  depositId?: string;
}

const DOCUMENT_TYPES = [
  { value: 'award_letter', label: 'خطاب ترسية' },
  { value: 'contract', label: 'عقد' },
  { value: 'correspondence', label: 'مراسلة' },
  { value: 'invoice', label: 'فاتورة' },
  { value: 'receipt', label: 'سند قبض' },
  { value: 'deposit_proof', label: 'إثبات إيداع' },
  { value: 'weight_slip', label: 'صورة وزنة' },
  { value: 'certificate', label: 'شهادة' },
  { value: 'license', label: 'رخصة' },
  { value: 'registration', label: 'سجل تجاري' },
  { value: 'other', label: 'أخرى' },
];

const DOCUMENT_CATEGORIES = [
  { value: 'documents', label: 'مستندات', icon: '📄' },
  { value: 'financials', label: 'ماليات', icon: '💰' },
  { value: 'operations', label: 'عمليات', icon: '🚛' },
  { value: 'legal', label: 'قانونية', icon: '⚖️' },
  { value: 'other', label: 'أخرى', icon: '📁' },
];

export default function EntityDocumentUpload({
  open,
  onOpenChange,
  partnerId,
  externalPartnerId,
  partnerName,
  defaultCategory,
  defaultType,
  shipmentId,
  invoiceId,
  depositId,
}: EntityDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadDocument } = useEntityDocuments();
  
  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      documentType: defaultType || '',
      documentCategory: defaultCategory || 'documents',
      description: '',
      documentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.getValues('title')) {
        form.setValue('title', file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile) return;

    const params: UploadDocumentParams = {
      file: selectedFile,
      partnerId,
      externalPartnerId,
      documentType: data.documentType,
      documentCategory: data.documentCategory,
      title: data.title,
      description: data.description,
      documentDate: data.documentDate,
      referenceNumber: data.referenceNumber,
      tags: tags.length > 0 ? tags : undefined,
      shipmentId,
      invoiceId,
      depositId,
    };

    await uploadDocument.mutateAsync(params);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setTags([]);
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-12 w-12 text-muted-foreground" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-12 w-12 text-blue-500" />;
    }
    if (selectedFile.type === 'application/pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    }
    return <File className="h-12 w-12 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>رفع مستند جديد</DialogTitle>
          {partnerName && (
            <p className="text-sm text-muted-foreground">لـ {partnerName}</p>
          )}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            
            <div className="flex flex-col items-center gap-2">
              {getFileIcon()}
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4 ml-1" />
                    إزالة
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    اضغط لاختيار ملف أو اسحب وأفلت هنا
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, صور، Word (حد أقصى 50 ميجا)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Document Category */}
          <div className="grid grid-cols-5 gap-2">
            {DOCUMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => form.setValue('documentCategory', cat.value)}
                className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                  form.watch('documentCategory') === cat.value
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs mt-1">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المستند *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="مثال: خطاب ترسية نستله 2024"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>نوع المستند *</Label>
            <Select
              value={form.watch('documentType')}
              onValueChange={(value) => form.setValue('documentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المستند" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">رقم المرجع</Label>
              <Input
                id="referenceNumber"
                {...form.register('referenceNumber')}
                placeholder="اختياري"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentDate">تاريخ المستند</Label>
              <Input
                id="documentDate"
                type="date"
                {...form.register('documentDate')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="وصف اختياري للمستند..."
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>الوسوم</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="أضف وسم..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                إضافة
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!selectedFile || uploadDocument.isPending}
              className="flex-1"
            >
              {uploadDocument.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع المستند
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

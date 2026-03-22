/**
 * Unified Document Viewer — عارض مستندات موحد
 * يعرض أي مستند (صورة، PDF، ملف) بشكل موحد من أي مصدر
 * يدعم: entity_documents, organization_documents, أو file_url مباشر
 */
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GoogleDocsPdfViewer from '@/components/shared/GoogleDocsPdfViewer';
import DocumentWatermark from '@/components/documents/DocumentWatermark';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Download, ExternalLink, FileText, Loader2, ImageOff,
  ZoomIn, ZoomOut, RotateCw, Printer, Eye, Tag,
  Calendar, User, Shield, Stamp, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStorageUrl, refreshStorageUrl } from '@/utils/storageUrl';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

// ============== Types ==============

export interface DocumentSource {
  /** رابط مباشر (public URL أو signed URL) */
  url?: string;
  /** مسار في باكت التخزين (يحتاج bucket) */
  storagePath?: string;
  /** اسم الباكت */
  bucket?: string;
  /** نوع الملف MIME */
  fileType?: string;
  /** اسم الملف */
  fileName?: string;
  /** حجم الملف */
  fileSize?: number;
  /** عنوان المستند */
  title?: string;
  /** وصف */
  description?: string;
  /** نوع المستند */
  documentType?: string;
  /** تصنيف المستند */
  documentCategory?: string;
  /** رقم مرجعي */
  referenceNumber?: string;
  /** تاريخ المستند */
  documentDate?: string;
  /** تاريخ الرفع */
  uploadedAt?: string;
  /** اسم الرافع */
  uploadedBy?: string;
  /** وسوم */
  tags?: string[];
  /** معرف السجل في entity_documents (للربط) */
  entityDocumentId?: string;
  /** حالة التوقيع */
  signingStatus?: 'unsigned' | 'pending' | 'signed' | 'rejected';
  /** تاريخ التوقيع */
  signedAt?: string;
}

interface UnifiedDocumentViewerProps {
  /** مصدر المستند */
  source: DocumentSource;
  /** هل يُعرض كديالوج */
  asDialog?: boolean;
  /** فتح/إغلاق الديالوج */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** عرض inline (بدون ديالوج) */
  inline?: boolean;
  /** ارتفاع العرض inline */
  inlineHeight?: string;
  /** إخفاء الشريط الجانبي */
  hideSidebar?: boolean;
  /** className إضافي */
  className?: string;
}

// ============== Labels ==============

const TYPE_LABELS: Record<string, string> = {
  award_letter: 'خطاب ترسية', contract: 'عقد', correspondence: 'مراسلة',
  invoice: 'فاتورة', receipt: 'سند قبض', deposit_proof: 'إثبات إيداع',
  weight_slip: 'صورة وزنة', weight_ticket: 'تذكرة ميزان', certificate: 'شهادة',
  license: 'رخصة', registration: 'سجل تجاري', waste_photo: 'صورة نفايات',
  vehicle_photo: 'صورة مركبة', identity: 'إثبات هوية', other: 'أخرى',
};

const CATEGORY_LABELS: Record<string, string> = {
  documents: 'مستندات', financials: 'ماليات', operations: 'عمليات',
  legal: 'قانونية', other: 'أخرى',
};

const SIGNING_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unsigned: { label: 'غير موقّع', variant: 'outline' },
  pending: { label: 'بانتظار التوقيع', variant: 'secondary' },
  signed: { label: 'موقّع ✓', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

// ============== Helper: Format file size ==============

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'غير معروف';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============== Preview Component ==============

const DocumentPreview = ({
  resolvedUrl,
  loading,
  error,
  isImage,
  isPDF,
  zoom,
  rotation,
  title,
}: {
  resolvedUrl: string | null;
  loading: boolean;
  error: boolean;
  isImage: boolean;
  isPDF: boolean;
  zoom: number;
  rotation: number;
  title: string;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground h-full">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm">جاري تحميل المستند...</p>
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground h-full">
        <ImageOff className="w-12 h-12" />
        <p className="text-sm">تعذر تحميل المستند</p>
        {resolvedUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={resolvedUrl} target="_blank" rel="noopener">
              <ExternalLink className="w-4 h-4 ml-2" />
              فتح مباشرة
            </a>
          </Button>
        )}
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex items-center justify-center h-full overflow-hidden">
        <motion.img
          src={resolvedUrl}
          alt={title}
          className="max-w-full max-h-full object-contain transition-transform"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    );
  }

  if (isPDF) {
    return (
      <GoogleDocsPdfViewer
        url={resolvedUrl}
        title={title}
        height="100%"
        className="w-full h-full min-h-[500px] border-0"
        showFooter={false}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground h-full">
      <FileText className="w-16 h-16" />
      <p>لا يمكن معاينة هذا النوع</p>
      <Button asChild>
        <a href={resolvedUrl} download target="_blank" rel="noopener">
          <Download className="w-4 h-4 ml-2" />
          تحميل الملف
        </a>
      </Button>
    </div>
  );
};

// ============== Sidebar Component ==============

const DocumentSidebar = ({ source }: { source: DocumentSource }) => {
  const signingInfo = source.signingStatus ? SIGNING_LABELS[source.signingStatus] : null;

  return (
    <div className="w-full md:w-72 space-y-4 overflow-y-auto p-1">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {source.documentType && (
          <Badge>{TYPE_LABELS[source.documentType] || source.documentType}</Badge>
        )}
        {source.documentCategory && (
          <Badge variant="outline">{CATEGORY_LABELS[source.documentCategory] || source.documentCategory}</Badge>
        )}
        {signingInfo && (
          <Badge variant={signingInfo.variant} className="gap-1">
            {source.signingStatus === 'signed' && <CheckCircle2 className="w-3 h-3" />}
            {source.signingStatus === 'pending' && <Stamp className="w-3 h-3" />}
            {signingInfo.label}
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        {source.referenceNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم المرجع</span>
            <span className="font-mono text-xs">{source.referenceNumber}</span>
          </div>
        )}
        {source.documentDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ المستند</span>
            <span>{format(new Date(source.documentDate), 'dd MMMM yyyy', { locale: ar })}</span>
          </div>
        )}
        {source.fileName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">اسم الملف</span>
            <span className="truncate max-w-[150px] text-xs" title={source.fileName}>{source.fileName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">حجم الملف</span>
          <span>{formatFileSize(source.fileSize)}</span>
        </div>
        {source.uploadedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الرفع</span>
            <span className="text-xs">{format(new Date(source.uploadedAt), 'dd/MM/yyyy hh:mm a')}</span>
          </div>
        )}
        {source.uploadedBy && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">رُفع بواسطة</span>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="text-xs">{source.uploadedBy}</span>
            </div>
          </div>
        )}
        {source.signedAt && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">تاريخ التوقيع</span>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-xs">{format(new Date(source.signedAt), 'dd/MM/yyyy hh:mm a')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {source.description && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">الوصف</p>
          <p className="text-sm bg-muted p-2 rounded">{source.description}</p>
        </div>
      )}

      {/* Tags */}
      {source.tags && source.tags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">الوسوم</p>
            <div className="flex flex-wrap gap-1">
              {source.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 ml-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============== Main Component ==============

const UnifiedDocumentViewer = ({
  source,
  asDialog = true,
  open,
  onOpenChange,
  inline = false,
  inlineHeight = '500px',
  hideSidebar = false,
  className,
}: UnifiedDocumentViewerProps) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isImage = !!(source.fileType?.startsWith('image/') ||
    source.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
  const isPDF = !!(source.fileType === 'application/pdf' ||
    source.fileName?.match(/\.pdf$/i));

  // Resolve URL
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setZoom(1);
    setRotation(0);

    const resolve = async () => {
      try {
        let url: string | null = null;

        if (source.storagePath && source.bucket) {
          url = await getStorageUrl(source.bucket, source.storagePath);
        } else if (source.url) {
          if (source.url.startsWith('http') && source.url.includes('/storage/')) {
            url = await refreshStorageUrl(source.url);
          } else {
            url = source.url;
          }
        }

        if (!cancelled) {
          setResolvedUrl(url);
          if (!url) setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [source.url, source.storagePath, source.bucket]);

  const handleDownload = useCallback(() => {
    if (!resolvedUrl) return;
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.download = source.fileName || 'document';
    a.target = '_blank';
    a.click();
  }, [resolvedUrl, source.fileName]);

  const handlePrint = useCallback(() => {
    if (!resolvedUrl) return;
    const w = window.open(resolvedUrl, '_blank');
    w?.addEventListener('load', () => w.print());
  }, [resolvedUrl]);

  // Toolbar
  const toolbar = (
    <div className="flex items-center gap-1 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={!resolvedUrl} className="gap-1.5">
        <Download className="w-4 h-4" /> تحميل
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={!resolvedUrl} className="gap-1.5">
        <Printer className="w-4 h-4" /> طباعة
      </Button>
      <Button variant="ghost" size="sm" asChild disabled={!resolvedUrl}>
        <a href={resolvedUrl || '#'} target="_blank" rel="noopener">
          <ExternalLink className="w-4 h-4" />
        </a>
      </Button>
      {isImage && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRotation(r => r + 90)}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );

  const content = (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {toolbar}
        {source.title && !asDialog && (
          <h3 className="font-medium text-sm truncate">{source.title}</h3>
        )}
      </div>

      {/* Main content */}
      <div className={cn(
        'flex flex-col md:flex-row gap-4',
        inline ? '' : 'flex-1 overflow-hidden'
      )}>
        {/* Preview */}
        <div
          className={cn(
            'flex-1 bg-muted rounded-lg overflow-hidden flex items-center justify-center',
            inline ? '' : 'min-h-[300px]'
          )}
          style={inline ? { height: inlineHeight } : undefined}
        >
          <DocumentPreview
            resolvedUrl={resolvedUrl}
            loading={loading}
            error={error}
            isImage={isImage}
            isPDF={isPDF}
            zoom={zoom}
            rotation={rotation}
            title={source.title || source.fileName || 'مستند'}
          />
        </div>

        {/* Sidebar */}
        {!hideSidebar && <DocumentSidebar source={source} />}
      </div>
    </div>
  );

  // Inline mode
  if (inline || !asDialog) {
    return content;
  }

  // Dialog mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {source.title || source.fileName || 'معاينة المستند'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDocumentViewer;

// ============== Helper: Convert EntityDocument to DocumentSource ==============

export function entityDocToSource(doc: {
  id?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  title?: string;
  description?: string;
  document_type?: string;
  document_category?: string;
  reference_number?: string;
  document_date?: string;
  created_at?: string;
  tags?: string[];
  uploader?: { full_name: string } | null;
}): DocumentSource {
  return {
    url: doc.file_url,
    fileName: doc.file_name,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    title: doc.title,
    description: doc.description,
    documentType: doc.document_type,
    documentCategory: doc.document_category,
    referenceNumber: doc.reference_number,
    documentDate: doc.document_date,
    uploadedAt: doc.created_at,
    uploadedBy: doc.uploader?.full_name,
    tags: doc.tags,
    entityDocumentId: doc.id,
  };
}

// ============== Helper: Convert OrganizationDocument to DocumentSource ==============

export function orgDocToSource(doc: {
  id?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number | null;
  document_type?: string;
  verification_status?: string | null;
  created_at?: string;
}): DocumentSource {
  return {
    storagePath: doc.file_path,
    bucket: 'organization-documents',
    fileName: doc.file_name,
    fileSize: doc.file_size || undefined,
    title: doc.file_name,
    documentType: doc.document_type,
    documentCategory: 'legal',
    uploadedAt: doc.created_at,
  };
}

// ============== Helper: Simple file URL to DocumentSource ==============

export function fileUrlToSource(
  url: string,
  meta?: {
    title?: string;
    fileName?: string;
    fileType?: string;
    signingStatus?: DocumentSource['signingStatus'];
    signedAt?: string;
  }
): DocumentSource {
  const fileName = meta?.fileName || url.split('/').pop() || 'document';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const fileType = meta?.fileType || (
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ? `image/${ext === 'jpg' ? 'jpeg' : ext}` :
    ext === 'pdf' ? 'application/pdf' : undefined
  );

  return {
    url,
    fileName,
    fileType,
    title: meta?.title || fileName,
    signingStatus: meta?.signingStatus,
    signedAt: meta?.signedAt,
  };
}

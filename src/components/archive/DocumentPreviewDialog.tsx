import GoogleDocsPdfViewer from '@/components/shared/GoogleDocsPdfViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, ExternalLink, Calendar, User, FileText, Tag } from 'lucide-react';
import DocumentAIAnalysis from '@/components/documents/DocumentAIAnalysis';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { EntityDocument } from '@/hooks/useEntityDocuments';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: EntityDocument;
}

const TYPE_LABELS: Record<string, string> = {
  award_letter: 'خطاب ترسية',
  contract: 'عقد',
  correspondence: 'مراسلة',
  invoice: 'فاتورة',
  receipt: 'سند قبض',
  deposit_proof: 'إثبات إيداع',
  weight_slip: 'صورة وزنة',
  certificate: 'شهادة',
  license: 'رخصة',
  registration: 'سجل تجاري',
  other: 'أخرى',
};

const CATEGORY_LABELS: Record<string, string> = {
  documents: 'مستندات',
  financials: 'ماليات',
  operations: 'عمليات',
  legal: 'قانونية',
  other: 'أخرى',
};

export default function DocumentPreviewDialog({
  open,
  onOpenChange,
  document: doc,
}: DocumentPreviewDialogProps) {
  const isImage = doc.file_type?.startsWith('image/');
  const isPDF = doc.file_type === 'application/pdf';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير معروف';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {doc.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
            {isImage ? (
              <img
                src={doc.file_url}
                alt={doc.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : isPDF ? (
              <GoogleDocsPdfViewer
                url={doc.file_url}
                title={doc.title}
                height="400px"
                className="w-full"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا يمكن معاينة هذا النوع من الملفات</p>
                <Button className="mt-4" asChild>
                  <a href={doc.file_url} download target="_blank" rel="noopener">
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الملف
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-72 space-y-4 overflow-y-auto">
            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" asChild>
                <a href={doc.file_url} download target="_blank" rel="noopener">
                  <Download className="h-4 w-4 ml-2" />
                  تحميل
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={doc.file_url} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge>{TYPE_LABELS[doc.document_type] || doc.document_type}</Badge>
              <Badge variant="outline">{CATEGORY_LABELS[doc.document_category] || doc.document_category}</Badge>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {doc.reference_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم المرجع</span>
                  <span className="font-mono">{doc.reference_number}</span>
                </div>
              )}

              {doc.document_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ المستند</span>
                  <span>{format(new Date(doc.document_date), 'dd MMMM yyyy', { locale: ar })}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم الملف</span>
                <span className="truncate max-w-[150px]" title={doc.file_name}>{doc.file_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">حجم الملف</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الرفع</span>
                <span>{format(new Date(doc.created_at), 'dd/MM/yyyy hh:mm a')}</span>
              </div>

              {doc.uploader && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">رُفع بواسطة</span>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{doc.uploader.full_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {doc.description && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="text-sm bg-muted p-2 rounded">{doc.description}</p>
              </div>
            )}

            {/* AI Analysis */}
            <Separator />
            <DocumentAIAnalysis
              fileUrl={doc.file_url}
              fileName={doc.file_name}
              fileType={doc.file_type}
              documentId={doc.id}
              documentSourceType="entity_document"
              compact
            />

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الوسوم</p>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 ml-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

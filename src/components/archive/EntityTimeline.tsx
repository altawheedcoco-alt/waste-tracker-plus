import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Image,
  File,
  DollarSign,
  Truck,
  Scale,
  Download,
  ExternalLink,
  Eye,
  Calendar,
  User,
  Tag,
  MoreVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEntityTimeline, EntityDocument, useEntityDocuments } from '@/hooks/useEntityDocuments';
import DocumentPreviewDialog from './DocumentPreviewDialog';

interface EntityTimelineProps {
  partnerId?: string;
  externalPartnerId?: string;
  maxHeight?: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  documents: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  financials: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  operations: { icon: Truck, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  legal: { icon: Scale, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  other: { icon: File, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

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

export default function EntityTimeline({
  partnerId,
  externalPartnerId,
  maxHeight = '600px',
}: EntityTimelineProps) {
  const { data: timeline, isLoading } = useEntityTimeline(partnerId, externalPartnerId);
  const { deleteDocument } = useEntityDocuments();
  const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy', { locale: ar });
  };

  const getFileIcon = (doc: EntityDocument) => {
    if (doc.file_type?.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (doc.file_type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleDelete = async (docId: string) => {
    await deleteDocument.mutateAsync(docId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">لا توجد مستندات</p>
        <p className="text-sm">ابدأ برفع المستندات لتظهر هنا</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute right-4 top-0 bottom-0 w-px bg-border" />

          {timeline.map((group, groupIndex) => (
            <div key={group.period} className="mb-8">
              {/* Period header */}
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background z-10 py-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center relative z-10">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-lg">{formatPeriod(group.period)}</h3>
                <Badge variant="secondary">{group.documents.length} مستند</Badge>
              </div>

              {/* Documents */}
              <div className="space-y-3 mr-10">
                {group.documents.map((doc) => {
                  const categoryConfig = CATEGORY_CONFIG[doc.document_category] || CATEGORY_CONFIG.other;
                  const CategoryIcon = categoryConfig.icon;

                  return (
                    <Card key={doc.id} className="relative group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Category Icon */}
                          <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                            <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-medium truncate">{doc.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {TYPE_LABELS[doc.document_type] || doc.document_type}
                                  </Badge>
                                  {doc.reference_number && (
                                    <span>#{doc.reference_number}</span>
                                  )}
                                  {doc.document_date && (
                                    <span>{format(new Date(doc.document_date), 'dd/MM/yyyy')}</span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                                    <Eye className="h-4 w-4 ml-2" />
                                    عرض
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={doc.file_url} download target="_blank" rel="noopener">
                                      <Download className="h-4 w-4 ml-2" />
                                      تحميل
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener">
                                      <ExternalLink className="h-4 w-4 ml-2" />
                                      فتح في نافذة جديدة
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDelete(doc.id)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Description */}
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {doc.description}
                              </p>
                            )}

                            {/* Tags */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 ml-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {getFileIcon(doc)}
                                <span>{doc.file_name}</span>
                              </div>
                              {doc.uploader && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{doc.uploader.full_name}</span>
                                </div>
                              )}
                              <span>{format(new Date(doc.created_at), 'dd/MM/yyyy hh:mm a')}</span>
                            </div>

                            {/* Linked shipment */}
                            {doc.shipment && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs flex items-center gap-2">
                                <Truck className="h-3 w-3" />
                                <span>مرتبط بشحنة: {doc.shipment.shipment_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      {previewDoc && (
        <DocumentPreviewDialog
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}
    </>
  );
}

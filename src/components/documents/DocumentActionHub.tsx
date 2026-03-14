/**
 * مركز إجراءات المستند الموحد — Document Action Hub
 * مكان واحد لتنفيذ كل العمليات على أي مستند:
 * معاينة، طباعة، تحميل، توقيع، ختم، مشاركة، إرسال للتوقيع، تحليل AI، إلخ
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, ExternalLink, Printer, Share2, FileSignature, PenTool,
  Stamp, Brain, QrCode, Shield, Copy, Mail, Eye, Tag, Calendar,
  User, ZoomIn, ZoomOut, RotateCw, Loader2, ImageOff, FileText,
  CheckCircle2, Send, Link2, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { DocumentSource } from './UnifiedDocumentViewer';
import { useEffect } from 'react';
import { getStorageUrl, refreshStorageUrl } from '@/utils/storageUrl';
import { safeWindowOpen } from '@/lib/safeWindow';

// Lazy imports for action dialogs  
import ShareDocumentButton from './ShareDocumentButton';
import SendForSigningButton from './SendForSigningButton';
import DocumentAIAnalysis from './DocumentAIAnalysis';

// ============== Types ==============

export interface DocumentActionHubProps {
  /** Document source info */
  source: DocumentSource;
  /** Dialog open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: hide specific actions */
  hideActions?: ('print' | 'download' | 'share' | 'sign' | 'stamp' | 'ai' | 'qr' | 'send-signing')[];
  /** Optional: custom reference for sharing */
  referenceId?: string;
  referenceType?: string;
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

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'غير معروف';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============== Action Card ==============

const ActionCard = ({ 
  icon: Icon, label, description, onClick, variant = 'default', disabled = false 
}: {
  icon: any; label: string; description: string; onClick?: () => void; 
  variant?: 'default' | 'primary' | 'warning'; disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center gap-3 p-3 rounded-xl border text-right w-full transition-colors',
      'hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'primary' && 'border-primary/30 bg-primary/5 hover:bg-primary/10',
      variant === 'warning' && 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
      variant === 'default' && 'border-border hover:bg-muted/50',
    )}
  >
    <div className={cn(
      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
      variant === 'primary' && 'bg-primary/10 text-primary',
      variant === 'warning' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      variant === 'default' && 'bg-muted text-muted-foreground',
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  </motion.button>
);

// ============== Main Component ==============

const DocumentActionHub = ({
  source,
  open,
  onOpenChange,
  hideActions = [],
  referenceId,
  referenceType,
}: DocumentActionHubProps) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isImage = !!(source.fileType?.startsWith('image/') || source.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));
  const isPDF = !!(source.fileType === 'application/pdf' || source.fileName?.match(/\.pdf$/i));

  // Resolve URL
  useEffect(() => {
    if (!open) return;
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
  }, [open, source.url, source.storagePath, source.bucket]);

  const handleDownload = useCallback(() => {
    if (!resolvedUrl) return;
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.download = source.fileName || 'document';
    a.target = '_blank';
    a.click();
    toast.success('جاري التحميل...');
  }, [resolvedUrl, source.fileName]);

  const handlePrint = useCallback(() => {
    if (!resolvedUrl) return;
    const w = window.open(resolvedUrl, '_blank');
    w?.addEventListener('load', () => w.print());
  }, [resolvedUrl]);

  const handleCopyLink = useCallback(() => {
    if (!resolvedUrl) return;
    navigator.clipboard.writeText(resolvedUrl);
    toast.success('تم نسخ الرابط');
  }, [resolvedUrl]);

  const handleOpenExternal = useCallback(() => {
    if (!resolvedUrl) return;
    window.open(resolvedUrl, '_blank');
  }, [resolvedUrl]);

  const isActionHidden = (action: string) => hideActions.includes(action as any);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="truncate">{source.title || source.fileName || 'مستند'}</span>
            {source.documentType && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {TYPE_LABELS[source.documentType] || source.documentType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5">
            <TabsList className="bg-muted/60 p-1 rounded-xl w-full justify-start gap-1">
              <TabsTrigger value="preview" className="gap-1.5 text-xs rounded-lg">
                <Eye className="w-3.5 h-3.5" /> المعاينة
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1.5 text-xs rounded-lg">
                <MoreHorizontal className="w-3.5 h-3.5" /> الإجراءات
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-1.5 text-xs rounded-lg">
                <FileText className="w-3.5 h-3.5" /> التفاصيل
              </TabsTrigger>
              {!isActionHidden('ai') && (
                <TabsTrigger value="ai" className="gap-1.5 text-xs rounded-lg">
                  <Brain className="w-3.5 h-3.5" /> تحليل AI
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ====== Preview Tab ====== */}
          <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 px-5 pb-5">
            <div className="flex flex-col h-full gap-3">
              {/* Quick toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap pt-3">
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!resolvedUrl} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> تحميل
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} disabled={!resolvedUrl} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={!resolvedUrl} className="gap-1.5 text-xs">
                  <Copy className="w-3.5 h-3.5" /> نسخ الرابط
                </Button>
                <Button variant="ghost" size="sm" onClick={handleOpenExternal} disabled={!resolvedUrl} className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> فتح في تبويب جديد
                </Button>
                {isImage && (
                  <>
                    <Separator orientation="vertical" className="h-5 mx-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}>
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}>
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation(r => r + 90)}>
                      <RotateCw className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Preview area */}
              <div className="flex-1 bg-muted rounded-xl overflow-auto flex items-center justify-center min-h-[300px]">
                {loading ? (
                  <div className="text-center p-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">جاري تحميل المستند...</p>
                  </div>
                ) : error || !resolvedUrl ? (
                  <div className="text-center p-8">
                    <ImageOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">تعذر تحميل المستند</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleDownload}>
                      <Download className="w-4 h-4 ml-2" /> تحميل مباشر
                    </Button>
                  </div>
                ) : isImage ? (
                  <img
                    src={resolvedUrl}
                    alt={source.title || 'مستند'}
                    className="max-w-full max-h-full object-contain transition-transform"
                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  />
                ) : isPDF ? (
                  <iframe
                    src={resolvedUrl}
                    className="w-full h-full min-h-[500px] rounded-lg"
                    title={source.title || 'مستند'}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-3">لا يمكن معاينة هذا النوع من الملفات</p>
                    <Button onClick={handleDownload} className="gap-2">
                      <Download className="w-4 h-4" /> تحميل الملف
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ====== Actions Tab ====== */}
          <TabsContent value="actions" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-5 pb-5">
              <div className="space-y-4 pt-3">
                {/* Quick Actions Grid */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">إجراءات سريعة</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {!isActionHidden('download') && (
                      <ActionCard
                        icon={Download}
                        label="تحميل المستند"
                        description="حفظ نسخة على جهازك"
                        onClick={handleDownload}
                        disabled={!resolvedUrl}
                      />
                    )}
                    {!isActionHidden('print') && (
                      <ActionCard
                        icon={Printer}
                        label="طباعة المستند"
                        description="طباعة مباشرة أو PDF"
                        onClick={handlePrint}
                        disabled={!resolvedUrl}
                        variant="primary"
                      />
                    )}
                    <ActionCard
                      icon={Copy}
                      label="نسخ رابط المستند"
                      description="نسخ رابط مباشر للمشاركة السريعة"
                      onClick={handleCopyLink}
                      disabled={!resolvedUrl}
                    />
                    <ActionCard
                      icon={ExternalLink}
                      label="فتح في نافذة جديدة"
                      description="عرض المستند في تبويب منفصل"
                      onClick={handleOpenExternal}
                      disabled={!resolvedUrl}
                    />
                  </div>
                </div>

                <Separator />

                {/* Signing & Stamping */}
                {(!isActionHidden('sign') || !isActionHidden('stamp') || !isActionHidden('send-signing')) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">التوقيع والختم</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {!isActionHidden('send-signing') && (
                        <div>
                          <SendForSigningButton
                            documentTitle={source.title || source.fileName}
                            documentType={source.documentType}
                            documentUrl={resolvedUrl || undefined}
                            documentId={source.entityDocumentId}
                            variant="ghost"
                            size="default"
                            label="إرسال للتوقيع"
                            className="w-full justify-start gap-3 p-3 h-auto border rounded-xl hover:bg-primary/5 hover:border-primary/30"
                          />
                        </div>
                      )}
                      {!isActionHidden('sign') && (
                        <ActionCard
                          icon={PenTool}
                          label="توقيع المستند"
                          description="إضافة توقيعك الإلكتروني"
                          variant="primary"
                          onClick={() => {
                            toast.info('استخدم زر "إرسال للتوقيع" لبدء دورة التوقيع الرسمية');
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Sharing */}
                {!isActionHidden('share') && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">المشاركة والإرسال</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <ShareDocumentButton
                          referenceId={referenceId || source.entityDocumentId}
                          referenceType={referenceType || source.documentType}
                          documentTitle={source.title || source.fileName}
                          variant="ghost"
                          size="default"
                          label="مشاركة مع شريك"
                          className="w-full justify-start gap-3 p-3 h-auto border rounded-xl hover:bg-primary/5 hover:border-primary/30"
                        />
                      </div>
                      <ActionCard
                        icon={Mail}
                        label="إرسال بالبريد"
                        description="إرسال نسخة عبر البريد الإلكتروني"
                        onClick={() => {
                          if (resolvedUrl) {
                            const subject = encodeURIComponent(source.title || 'مستند');
                            const body = encodeURIComponent(`مستند: ${source.title || ''}\n\nالرابط: ${resolvedUrl}`);
                            window.open(`mailto:?subject=${subject}&body=${body}`);
                          }
                        }}
                        disabled={!resolvedUrl}
                      />
                      <ActionCard
                        icon={Link2}
                        label="إنشاء رابط عام"
                        description="رابط تحقق عام بدون تسجيل دخول"
                        onClick={() => toast.info('يمكنك إنشاء رابط عام من خلال "مشاركة مع شريك"')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ====== Details Tab ====== */}
          <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-5 pb-5">
              <div className="space-y-4 pt-3 max-w-lg">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {source.documentType && (
                    <Badge>{TYPE_LABELS[source.documentType] || source.documentType}</Badge>
                  )}
                  {source.documentCategory && (
                    <Badge variant="outline">{CATEGORY_LABELS[source.documentCategory] || source.documentCategory}</Badge>
                  )}
                  {source.signingStatus && (
                    <Badge variant={source.signingStatus === 'signed' ? 'default' : 'secondary'} className="gap-1">
                      {source.signingStatus === 'signed' && <CheckCircle2 className="w-3 h-3" />}
                      {source.signingStatus === 'signed' ? 'موقّع ✓' : source.signingStatus === 'pending' ? 'بانتظار التوقيع' : source.signingStatus}
                    </Badge>
                  )}
                </div>

                {/* Info Grid */}
                <div className="space-y-3 text-sm">
                  {source.referenceNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">رقم المرجع</span>
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{source.referenceNumber}</span>
                    </div>
                  )}
                  {source.documentDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> تاريخ المستند</span>
                      <span>{format(new Date(source.documentDate), 'dd MMMM yyyy', { locale: ar })}</span>
                    </div>
                  )}
                  {source.fileName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">اسم الملف</span>
                      <span className="truncate max-w-[200px] text-xs" title={source.fileName}>{source.fileName}</span>
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
                      <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> رُفع بواسطة</span>
                      <span className="text-xs">{source.uploadedBy}</span>
                    </div>
                  )}
                  {source.signedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3 text-primary" /> تاريخ التوقيع</span>
                      <span className="text-xs">{format(new Date(source.signedAt), 'dd/MM/yyyy hh:mm a')}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {source.description && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">الوصف</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{source.description}</p>
                  </div>
                )}

                {/* Tags */}
                {source.tags && source.tags.length > 0 && (
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
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ====== AI Tab ====== */}
          {!isActionHidden('ai') && (
            <TabsContent value="ai" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full px-5 pb-5">
                <div className="pt-3">
                  <DocumentAIAnalysis
                    fileUrl={resolvedUrl || source.url || ''}
                    fileName={source.fileName || 'document'}
                    fileType={source.fileType}
                    documentId={source.entityDocumentId}
                    documentSourceType="entity_document"
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentActionHub;

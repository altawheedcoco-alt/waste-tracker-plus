import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Brain, FileText, Download, Eye, Search, Loader2, FileCheck,
  Calendar, Hash, Trash2, ExternalLink, RefreshCw, Filter, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface ExtractedDocument {
  id: string;
  document_type: string | null;
  file_url: string | null;
  ocr_extracted_data: any;
  ocr_confidence: number | null;
  ai_extracted: boolean | null;
  created_at: string;
  tags: string[] | null;
}

const AIExtractedDataViewer = () => {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const orgId = profile?.organization_id;

  const fetchDocuments = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('entity_documents')
      .select('id, document_type, file_url, ocr_extracted_data, ocr_confidence, ai_extracted, created_at, tags')
      .eq('organization_id', orgId)
      .eq('ai_extracted', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setDocuments(data as ExtractedDocument[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [orgId]);

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const data = doc.ocr_extracted_data;
    const rawText = data?.raw_text?.toLowerCase() || '';
    const docType = doc.document_type?.toLowerCase() || '';
    const fields = JSON.stringify(data?.detected_fields || {}).toLowerCase();
    return rawText.includes(q) || docType.includes(q) || fields.includes(q);
  });

  const getConfidenceColor = (c: number | null) => {
    if (!c) return 'bg-muted text-muted-foreground';
    if (c >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (c >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const handleDelete = async (docId: string) => {
    const { error } = await supabase.from('entity_documents').delete().eq('id', docId);
    if (error) {
      toast.error('فشل في الحذف');
    } else {
      toast.success('تم الحذف');
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
  };

  const downloadJSON = (doc: ExtractedDocument) => {
    const blob = new Blob([JSON.stringify(doc.ocr_extracted_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-data-${doc.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">جاري تحميل البيانات المستخرجة...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">البيانات المستخرجة تلقائياً بالذكاء الاصطناعي</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {documents.length} مستند
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchDocuments} className="gap-1">
                <RefreshCw className="h-3 w-3" />
                تحديث
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            جميع المستندات التي تم رفعها ومعالجتها بالذكاء الاصطناعي — التراخيص، الموافقات البيئية، التصاريح
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث في البيانات المستخرجة..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {documents.length === 0
                ? 'لم يتم استخراج أي بيانات بعد — ارفع مستنداً من التراخيص والامتثال'
                : 'لا توجد نتائج مطابقة للبحث'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {filteredDocs.map(doc => {
              const fields = doc.ocr_extracted_data?.detected_fields || {};
              const confidence = doc.ocr_confidence || doc.ocr_extracted_data?.confidence || 0;

              return (
                <Card key={doc.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileCheck className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-sm">
                            {fields.document_type || fields.license_type || doc.document_type || 'مستند مستخرج'}
                          </span>
                          <Badge className={`text-[10px] ${getConfidenceColor(confidence)}`}>
                            دقة {Math.round(confidence)}%
                          </Badge>
                          {doc.ocr_extracted_data?.pages_count > 1 && (
                            <Badge variant="outline" className="text-[10px]">
                              {doc.ocr_extracted_data.pages_count} صفحات
                            </Badge>
                          )}
                        </div>

                        {/* Key fields */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {fields.license_number && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {fields.license_number}
                            </span>
                          )}
                          {fields.issue_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              صدور: {fields.issue_date}
                            </span>
                          )}
                          {fields.expiry_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-red-500" />
                              انتهاء: {fields.expiry_date}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        )}

                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setSelectedDoc(doc); setPreviewOpen(true); }}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {doc.file_url && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => window.open(doc.file_url!, '_blank')}
                            title="فتح الملف الأصلي"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => downloadJSON(doc)}
                          title="تحميل البيانات JSON"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Detail Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              تفاصيل البيانات المستخرجة
            </DialogTitle>
            <DialogDescription>
              عرض كامل للبيانات التي استخرجها الذكاء الاصطناعي من المستند
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              {/* Fields */}
              {selectedDoc.ocr_extracted_data?.detected_fields && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4 text-primary" />
                    الحقول المكتشفة
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedDoc.ocr_extracted_data.detected_fields).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm border-b border-border/30 pb-1 last:border-0">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{String(value || '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waste Types */}
              {selectedDoc.ocr_extracted_data?.detected_fields?.waste_types?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">أنواع المخلفات المكتشفة</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.ocr_extracted_data.detected_fields.waste_types.map((wt: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{wt}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Text */}
              {selectedDoc.ocr_extracted_data?.raw_text && (
                <div>
                  <h4 className="text-sm font-medium mb-2">النص الخام المستخرج</h4>
                  <ScrollArea className="max-h-[300px]">
                    <pre className="bg-muted/30 rounded-lg p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed" dir="rtl">
                      {selectedDoc.ocr_extracted_data.raw_text}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIExtractedDataViewer;

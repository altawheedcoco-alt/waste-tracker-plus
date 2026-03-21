import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileSearch, FileText, Brain, CheckCircle2, AlertTriangle, Clock,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Shield, Tag, Calendar,
  Hash, User, Building2, ListChecks, Eye, FileWarning
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  organizationId: string;
}

interface ExtractedDoc {
  id: string;
  title: string;
  document_type: string;
  document_category: string;
  file_name: string;
  file_url: string;
  ai_extracted: boolean;
  ocr_extracted_data: any;
  ocr_confidence: number | null;
  tags: string[] | null;
  created_at: string;
}

const DocumentAnalysisTab = ({ organizationId }: Props) => {
  const [docs, setDocs] = useState<ExtractedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entity_documents')
        .select('id, title, document_type, document_category, file_name, file_url, ai_extracted, ocr_extracted_data, ocr_confidence, tags, created_at')
        .eq('organization_id', organizationId)
        .eq('ai_extracted', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocs((data as ExtractedDoc[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error('فشل تحميل تحليلات الوثائق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const channel = supabase
      .channel('doc-analysis-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entity_documents',
        filter: `organization_id=eq.${organizationId}`,
      }, () => fetchDocs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const expandAll = () => setExpandedIds(new Set(docs.map(d => d.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const getDocIcon = (cat: string, type: string) => {
    if (cat === 'analysis') return <Brain className="h-5 w-5 text-primary" />;
    if (type === 'license' || type === 'certificate') return <Shield className="h-5 w-5 text-blue-500" />;
    if (type === 'report') return <FileSearch className="h-5 w-5 text-emerald-500" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      analysis: { label: '📊 تحليل عميق', cls: 'bg-primary/10 text-primary border-primary/20' },
      legal: { label: '⚖️ قانوني', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' },
      certificate: { label: '📜 شهادة', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' },
      license: { label: '🪪 ترخيص', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200' },
    };
    const m = map[cat] || { label: cat || 'أخرى', cls: 'bg-muted text-muted-foreground border-border' };
    return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
  };

  const getConfidenceBar = (conf: number | null) => {
    if (!conf) return null;
    const color = conf >= 80 ? 'bg-emerald-500' : conf >= 50 ? 'bg-amber-500' : 'bg-destructive';
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(conf, 100)}%` }} />
        </div>
        <span className="text-xs font-medium">{conf}%</span>
      </div>
    );
  };

  const renderFieldRow = (icon: React.ReactNode, label: string, value: string | string[] | undefined | null) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
        <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
        <div className="min-w-[100px] text-sm font-medium text-muted-foreground shrink-0">{label}</div>
        <div className="text-sm flex-1">
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1">
              {value.map((v, i) => <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>)}
            </div>
          ) : (
            <span>{value}</span>
          )}
        </div>
      </div>
    );
  };

  const renderDocumentExtraction = (doc: ExtractedDoc) => {
    const data = doc.ocr_extracted_data;
    if (!data) return <p className="text-muted-foreground text-sm p-4">لا توجد بيانات مستخرجة</p>;

    // Deep analysis report
    if (data.compliance_score !== undefined || doc.document_category === 'analysis') {
      return (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">درجة الامتثال</p>
              <p className="text-2xl font-bold text-primary">{data.compliance_score ?? 'N/A'}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">مستوى المخاطرة</p>
              <p className="text-lg font-bold">{data.risk_level === 'high' ? '🔴 عالي' : data.risk_level === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}</p>
            </div>
            {data.documents_analyzed !== undefined && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">مستندات محللة</p>
                <p className="text-2xl font-bold">{data.documents_analyzed}</p>
              </div>
            )}
          </div>
          {data.executive_summary && (
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-xs font-medium text-muted-foreground mb-1">الملخص التنفيذي</p>
              <p className="text-sm leading-relaxed">{data.executive_summary}</p>
            </div>
          )}
          {data.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">التوصيات</p>
              <ul className="space-y-1.5">
                {data.recommendations.map((r: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{typeof r === 'string' ? r : r.text || r.recommendation || JSON.stringify(r)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Per-document OCR extraction
    const fields = data.structured_fields || data.detected_fields || {};
    const rawFields = data.detected_fields || {};
    return (
      <div className="space-y-3 p-4">
        {/* Structured fields */}
        <div className="space-y-0">
          {renderFieldRow(<Hash className="h-4 w-4" />, 'رقم الترخيص', fields['رقم الترخيص'] || rawFields.license_number)}
          {renderFieldRow(<Calendar className="h-4 w-4" />, 'تاريخ الإصدار', fields['تاريخ الإصدار'] || rawFields.issue_date)}
          {renderFieldRow(<Clock className="h-4 w-4" />, 'تاريخ الانتهاء', fields['تاريخ الانتهاء'] || rawFields.expiry_date)}
          {renderFieldRow(<User className="h-4 w-4" />, 'صاحب الترخيص', fields['اسم صاحب الترخيص'] || rawFields.holder_name)}
          {renderFieldRow(<Building2 className="h-4 w-4" />, 'الجهة المصدرة', fields['الجهة المصدرة'] || rawFields.issuing_authority)}
          {renderFieldRow(<Tag className="h-4 w-4" />, 'نوع المستند', fields['نوع المستند'] || rawFields.document_type || data.document_type)}
          {renderFieldRow(<FileWarning className="h-4 w-4" />, 'أنواع المخلفات', fields['أنواع المخلفات'] || rawFields.waste_types)}
        </div>

        {/* Obligations */}
        {(data.obligations?.length > 0 || fields['الاشتراطات والالتزامات']?.length > 0) && (
          <div className="border rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">الاشتراطات والالتزامات</p>
              <Badge variant="outline" className="text-xs">{(data.obligations || fields['الاشتراطات والالتزامات'] || []).length} بند</Badge>
            </div>
            <ul className="space-y-1.5">
              {(data.obligations || fields['الاشتراطات والالتزامات'] || []).map((o: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Raw text */}
        {data.raw_text && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" /> عرض النص الكامل المستخرج
            </summary>
            <ScrollArea className="mt-2 h-48">
              <pre className="p-3 bg-muted rounded-lg text-xs whitespace-pre-wrap" dir="auto">{data.raw_text}</pre>
            </ScrollArea>
          </details>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>جاري تحميل تحليلات الوثائق...</span>
        </CardContent>
      </Card>
    );
  }

  const extractedDocs = docs.filter(d => d.document_category !== 'analysis');
  const analysisDocs = docs.filter(d => d.document_category === 'analysis');

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSearch className="w-5 h-5 text-primary" />
                تحليل الوثائق — استخراج البيانات
              </CardTitle>
              <CardDescription>لكل وثيقة مرفوعة تحليل منفصل واستخراج تلقائي للبيانات</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{extractedDocs.length} وثيقة</Badge>
              <Badge variant="outline" className="bg-primary/5">{analysisDocs.length} تقرير</Badge>
              <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1">
                <RefreshCw className="h-3 w-3" /> تحديث
              </Button>
              {docs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={expandedIds.size > 0 ? collapseAll : expandAll} className="gap-1 text-xs">
                  {expandedIds.size > 0 ? <><ChevronUp className="h-3 w-3" /> طي الكل</> : <><ChevronDown className="h-3 w-3" /> فتح الكل</>}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد وثائق محللة بعد</p>
            <p className="text-sm mt-1">ارفع وثائق من تبويب "الوثائق" وسيتم تحليلها تلقائياً</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Per-document extractions */}
          {extractedDocs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">📄 استخراج البيانات لكل وثيقة</h3>
              {extractedDocs.map((doc) => {
                const isExpanded = expandedIds.has(doc.id);
                return (
                  <Card key={doc.id} className="overflow-hidden">
                    <button
                      className="w-full text-right p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(doc.id)}
                    >
                      {getDocIcon(doc.document_category, doc.document_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title || doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {getCategoryLabel(doc.document_category)}
                          {getConfidenceBar(doc.ocr_confidence)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {doc.tags?.includes('ai-extracted') && (
                        <Badge variant="outline" className="text-xs shrink-0 border-primary/30 text-primary">AI</Badge>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>
                    {isExpanded && (
                      <>
                        <Separator />
                        {renderDocumentExtraction(doc)}
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Deep analysis reports */}
          {analysisDocs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">📊 تقارير التحليل العميق التلقائي</h3>
              {analysisDocs.map((doc) => {
                const isExpanded = expandedIds.has(doc.id);
                return (
                  <Card key={doc.id} className="overflow-hidden border-primary/20">
                    <button
                      className="w-full text-right p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(doc.id)}
                    >
                      <Brain className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {getCategoryLabel('analysis')}
                          <Badge variant="outline" className="text-xs">تلقائي</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>
                    {isExpanded && (
                      <>
                        <Separator />
                        {renderDocumentExtraction(doc)}
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentAnalysisTab;

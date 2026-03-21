import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  FileSearch, FileText, Brain, CheckCircle2, AlertTriangle, Clock,
  Loader2, RefreshCw, Download, Eye, Shield, Tag
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

  const getCategoryBadge = (cat: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      analysis: { label: '📊 تحليل عميق', cls: 'bg-primary/10 text-primary' },
      legal: { label: '⚖️ قانوني', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      certificate: { label: '📜 شهادة', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      license: { label: '🪪 ترخيص', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    };
    const m = map[cat] || { label: cat, cls: 'bg-muted text-muted-foreground' };
    return <Badge className={m.cls}>{m.label}</Badge>;
  };

  const getConfidenceBadge = (conf: number | null) => {
    if (!conf) return null;
    const cls = conf >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : conf >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-destructive/10 text-destructive';
    return <Badge className={cls}>{conf}% ثقة</Badge>;
  };

  const renderExtractedData = (data: any) => {
    if (!data) return <p className="text-muted-foreground text-sm">لا توجد بيانات مستخرجة</p>;

    // For deep analysis reports
    if (data.compliance_score !== undefined) {
      return (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-muted/50"><span className="text-muted-foreground">درجة الامتثال:</span> <strong>{data.compliance_score}%</strong></div>
            <div className="p-2 rounded bg-muted/50"><span className="text-muted-foreground">مستوى المخاطرة:</span> <strong>{data.risk_level || 'N/A'}</strong></div>
          </div>
          {data.executive_summary && (
            <div className="p-3 rounded border bg-card">
              <p className="font-medium mb-1">الملخص التنفيذي:</p>
              <p className="text-muted-foreground leading-relaxed">{data.executive_summary}</p>
            </div>
          )}
          {data.recommendations?.length > 0 && (
            <div>
              <p className="font-medium mb-1">التوصيات:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {data.recommendations.slice(0, 5).map((r: any, i: number) => (
                  <li key={i}>{typeof r === 'string' ? r : r.text || r.recommendation || JSON.stringify(r)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // For OCR extracted documents
    if (data.structured_fields || data.detected_fields) {
      const fields = data.structured_fields || data.detected_fields || {};
      return (
        <div className="space-y-2 text-sm">
          {Object.entries(fields).map(([key, val]) => (
            <div key={key} className="flex gap-2 p-2 rounded bg-muted/50">
              <span className="text-muted-foreground font-medium min-w-[120px]">{key}:</span>
              <span>{Array.isArray(val) ? (val as string[]).join('، ') : String(val)}</span>
            </div>
          ))}
          {data.obligations?.length > 0 && (
            <div className="mt-2">
              <p className="font-medium mb-1">الاشتراطات والالتزامات:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {data.obligations.map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
          {data.raw_text && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground text-xs">عرض النص الخام</summary>
              <pre className="mt-1 p-2 bg-muted rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto" dir="auto">{data.raw_text}</pre>
            </details>
          )}
        </div>
      );
    }

    // Fallback: generic JSON display
    return (
      <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap max-h-60 overflow-y-auto" dir="ltr">
        {JSON.stringify(data, null, 2)}
      </pre>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              تحليل الوثائق المستخرجة
            </CardTitle>
            <CardDescription>
              جميع البيانات المستخرجة تلقائياً من الوثائق المرفوعة والتقارير التحليلية
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{docs.length} وثيقة محللة</Badge>
            <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1">
              <RefreshCw className="h-3 w-3" /> تحديث
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">لا توجد وثائق محللة بعد</p>
            <p className="text-sm mt-1">ارفع وثائق من تبويب "الوثائق" وسيتم تحليلها تلقائياً</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {docs.map((doc) => (
              <AccordionItem key={doc.id} value={doc.id} className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 flex-1 text-right">
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.document_category === 'analysis' ? (
                        <Brain className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getCategoryBadge(doc.document_category)}
                        {getConfidenceBadge(doc.ocr_confidence)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {doc.tags?.includes('auto-generated') && (
                      <Badge variant="outline" className="text-xs shrink-0">تلقائي</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {renderExtractedData(doc.ocr_extracted_data)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentAnalysisTab;

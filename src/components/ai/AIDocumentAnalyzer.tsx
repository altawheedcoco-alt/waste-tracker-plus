/**
 * تحليل المستندات واستخراج البيانات بالذكاء الاصطناعي
 * يدعم رفع مستند وتحليله واستخراج بياناته وإنشاء تقرير شامل
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  FileSearch, Upload, Brain, FileText, AlertTriangle, CheckCircle2,
  Clock, Download, Loader2, Shield, Tag, Hash, Calendar, Users, DollarSign, Weight
} from 'lucide-react';

interface AnalysisResult {
  classification: {
    document_type: string;
    confidence: number;
    suggested_folder: string;
  };
  extracted_data: {
    reference_number?: string;
    date?: string;
    amount?: number | null;
    parties?: string[];
    weights?: string[];
    other_fields?: Record<string, any>;
  };
  summary: string;
  risk_analysis: {
    risk_level: string;
    compliance_score: number;
    checks: Array<{ name: string; passed: boolean; details: string }>;
    recommendations: string[];
  };
  tags: string[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  weight_ticket: 'تذكرة وزن',
  invoice: 'فاتورة',
  contract: 'عقد',
  award_letter: 'خطاب ترسية',
  license: 'ترخيص',
  certificate: 'شهادة',
  receipt: 'إيصال',
  delivery_declaration: 'إقرار تسليم',
  vehicle_document: 'مستند مركبة',
  identity_document: 'مستند هوية',
  financial_statement: 'كشف مالي',
  environmental_report: 'تقرير بيئي',
  photo_evidence: 'صور إثبات',
  correspondence: 'مراسلات',
  other: 'أخرى',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const RISK_LABELS: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  critical: 'حرج',
};

export default function AIDocumentAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(10);
    setResult(null);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: {
          imageBase64: base64,
          fileName: file.name,
          mimeType: file.type,
          analysisType: 'تحليل شامل',
        },
      });
      setProgress(90);

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'فشل التحليل');

      setResult(data.result);
      setDuration(data.duration_ms || 0);
      setProgress(100);
      toast.success('تم تحليل المستند بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل تحليل المستند');
    } finally {
      setAnalyzing(false);
    }
  }, [file]);

  const exportReport = useCallback(() => {
    if (!result) return;
    const report = {
      تاريخ_التقرير: new Date().toLocaleString('ar-EG'),
      اسم_الملف: file?.name,
      التصنيف: DOC_TYPE_LABELS[result.classification.document_type] || result.classification.document_type,
      درجة_الثقة: `${result.classification.confidence}%`,
      الملخص: result.summary,
      البيانات_المستخرجة: result.extracted_data,
      تحليل_المخاطر: {
        المستوى: RISK_LABELS[result.risk_analysis.risk_level],
        درجة_الامتثال: `${result.risk_analysis.compliance_score}/100`,
        التوصيات: result.risk_analysis.recommendations,
      },
      الوسوم: result.tags,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-تحليل-${file?.name || 'مستند'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير');
  }, [result, file]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          تحليل المستندات واستخراج البيانات بالذكاء الاصطناعي
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          ارفع مستنداً لتحليله واستخراج بياناته وإنشاء تقرير شامل بالمخاطر والامتثال
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="ai-doc-upload"
          />
          <label htmlFor="ai-doc-upload" className="cursor-pointer space-y-2 block">
            <Upload className="h-10 w-10 text-primary/50 mx-auto" />
            <p className="text-sm font-medium">اسحب الملف هنا أو اضغط للرفع</p>
            <p className="text-xs text-muted-foreground">يدعم الصور و PDF</p>
          </label>
        </div>

        {/* File Preview */}
        {file && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {preview && (
              <img src={preview} alt="preview" className="h-12 w-12 object-cover rounded border" />
            )}
            <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <FileSearch className="h-4 w-4 ml-1" />}
              {analyzing ? 'جاري التحليل...' : 'تحليل المستند'}
            </Button>
          </div>
        )}

        {/* Progress */}
        {analyzing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {progress < 30 ? 'تحويل الملف...' : progress < 90 ? 'تحليل بالذكاء الاصطناعي...' : 'إعداد التقرير...'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {/* Header with export */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-semibold">نتائج التحليل</span>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 ml-1" />
                    {(duration / 1000).toFixed(1)} ثانية
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="h-4 w-4 ml-1" />
                  تصدير التقرير
                </Button>
              </div>

              <Separator />

              {/* Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">نوع المستند</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {DOC_TYPE_LABELS[result.classification.document_type] || result.classification.document_type}
                  </p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">درجة الثقة</span>
                  </div>
                  <p className="font-semibold text-sm">{result.classification.confidence}%</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">المجلد المقترح</span>
                  </div>
                  <p className="font-semibold text-sm">{result.classification.suggested_folder}</p>
                </Card>
              </div>

              {/* Summary */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <FileSearch className="h-4 w-4" />
                  الملخص
                </h4>
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </Card>

              {/* Extracted Data */}
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <Hash className="h-4 w-4 text-primary" />
                  البيانات المستخرجة
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {result.extracted_data.reference_number && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">رقم مرجعي:</span>
                      <span className="font-medium">{result.extracted_data.reference_number}</span>
                    </div>
                  )}
                  {result.extracted_data.date && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">التاريخ:</span>
                      <span className="font-medium">{result.extracted_data.date}</span>
                    </div>
                  )}
                  {result.extracted_data.amount != null && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">المبلغ:</span>
                      <span className="font-medium">{result.extracted_data.amount}</span>
                    </div>
                  )}
                  {result.extracted_data.parties?.length ? (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">الأطراف:</span>
                      <span className="font-medium">{result.extracted_data.parties.join('، ')}</span>
                    </div>
                  ) : null}
                  {result.extracted_data.weights?.length ? (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">الأوزان:</span>
                      <span className="font-medium">{result.extracted_data.weights.join('، ')}</span>
                    </div>
                  ) : null}
                  {result.extracted_data.other_fields && Object.entries(result.extracted_data.other_fields).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{k}:</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Risk Analysis */}
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  تحليل المخاطر والامتثال
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={`${RISK_COLORS[result.risk_analysis.risk_level]} border`}>
                    مستوى المخاطرة: {RISK_LABELS[result.risk_analysis.risk_level]}
                  </Badge>
                  <Badge variant="outline">
                    درجة الامتثال: {result.risk_analysis.compliance_score}/100
                  </Badge>
                </div>

                {/* Compliance checks */}
                <div className="space-y-1.5 mb-3">
                  {result.risk_analysis.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className={check.passed ? '' : 'text-destructive'}>{check.name}</span>
                      <span className="text-xs text-muted-foreground">— {check.details}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {result.risk_analysis.recommendations.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">التوصيات:</h5>
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 dark:text-amber-300">
                      {result.risk_analysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {/* Tags */}
              {result.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 ml-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

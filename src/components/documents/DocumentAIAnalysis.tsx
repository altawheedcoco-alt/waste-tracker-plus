import { useState } from 'react';
import { preprocessForOCR } from '@/utils/imagePreprocess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  FileSearch,
  Shield,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
interface DocumentAIAnalysisProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  documentId?: string;
  documentSourceType?: string;
  context?: string;
  onAnalysisComplete?: (result: any) => void;
  compact?: boolean;
}

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
    weights?: any[];
    other_fields?: Record<string, any>;
  };
  summary: string;
  risk_analysis: {
    risk_level: string;
    compliance_score: number;
    checks: { name: string; passed: boolean; details: string }[];
    recommendations: string[];
  };
  tags: string[];
}

const getDocumentTypeLabels = (t: (key: string) => string): Record<string, string> => ({
  weight_ticket: t('docAI.weightTicket'),
  invoice: t('docAI.invoice'),
  contract: t('docAI.contract'),
  award_letter: t('docAI.awardLetter'),
  license: t('docAI.license'),
  certificate: t('docAI.certificate'),
  receipt: t('docAI.receipt'),
  delivery_declaration: t('docAI.deliveryDeclaration'),
  vehicle_document: t('docAI.vehicleDocument'),
  identity_document: t('docAI.identityDocument'),
  financial_statement: t('docAI.financialStatement'),
  environmental_report: t('docAI.environmentalReport'),
  photo_evidence: t('docAI.photoEvidence'),
  correspondence: t('docAI.correspondence'),
  other: t('docAI.other'),
});

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const getRiskLabels = (t: (key: string) => string): Record<string, string> => ({
  low: t('docAI.riskLow'),
  medium: t('docAI.riskMedium'),
  high: t('docAI.riskHigh'),
  critical: t('docAI.riskCritical'),
});

export default function DocumentAIAnalysis({
  fileUrl,
  fileName,
  fileType,
  documentId,
  documentSourceType,
  context,
  onAnalysisComplete,
  compact = false,
}: DocumentAIAnalysisProps) {
  const { organization, user } = useAuth();
  const { t } = useLanguage();
  const DOCUMENT_TYPE_LABELS = getDocumentTypeLabels(t);
  const RISK_LABELS = getRiskLabels(t);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const analyzeDocument = async () => {
    if (!organization?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert file URL to base64 for image-based analysis
      let imageBase64 = fileUrl;
      
      if (fileUrl && !fileUrl.startsWith('data:')) {
        const isImage = fileType?.startsWith('image/') || 
          /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
        
        if (isImage) {
          try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const rawBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            // Apply CamScanner-quality preprocessing
            imageBase64 = await preprocessForOCR(rawBase64, {
              grayscale: true, contrast: 85, sharpness: 3, brightness: 15, binarize: 0, maxDimension: 2400, quality: 0.95,
            });
          } catch {
            imageBase64 = fileUrl; // fallback to URL
          }
        }
      } else if (imageBase64.startsWith('data:image')) {
        // Preprocess inline base64 images too
        imageBase64 = await preprocessForOCR(imageBase64, {
          grayscale: true, contrast: 60, sharpness: 2, brightness: 10, binarize: 0, maxDimension: 2400, quality: 0.95,
        });
      }

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: {
          imageBase64,
          fileName,
          mimeType: fileType,
          context,
        },
      });

      if (error) throw error;

      if (data?.success && data.result) {
        setResult(data.result);
        setDuration(data.duration_ms);

        // Save to database
        await supabase.from('document_ai_analysis').insert({
          organization_id: organization.id,
          document_id: documentId || null,
          document_type: documentSourceType || 'unknown',
          source_url: fileUrl,
          file_name: fileName,
          ai_document_type: data.result.classification?.document_type,
          ai_confidence: data.result.classification?.confidence,
          ai_suggested_folder: data.result.classification?.suggested_folder,
          extracted_data: data.result.extracted_data || {},
          ai_summary: data.result.summary,
          risk_level: data.result.risk_analysis?.risk_level,
          compliance_score: data.result.risk_analysis?.compliance_score,
          compliance_checks: data.result.risk_analysis?.checks || [],
          recommendations: data.result.risk_analysis?.recommendations || [],
          ai_tags: data.result.tags || [],
          analyzed_by: user?.id,
          analysis_duration_ms: data.duration_ms,
        });

        onAnalysisComplete?.(data.result);
        toast.success('تم تحليل المستند بنجاح');
      } else {
        throw new Error(data?.error || 'فشل التحليل');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'فشل في تحليل المستند');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!result && !isAnalyzing) {
    return (
      <Button
        onClick={analyzeDocument}
        variant={compact ? "outline" : "default"}
        size={compact ? "sm" : "default"}
        className="gap-2"
      >
        <Brain className="h-4 w-4" />
        {compact ? 'تحليل ذكي' : 'تحليل المستند بالذكاء الاصطناعي'}
      </Button>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-medium">جارِ تحليل المستند...</p>
            <p className="text-sm text-muted-foreground mt-1">
              تصنيف • استخراج البيانات • ملخص • تحليل المخاطر
            </p>
          </div>
          <Progress value={undefined} className="w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            نتائج التحليل الذكي
          </CardTitle>
          <div className="flex items-center gap-2">
            {duration && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {(duration / 1000).toFixed(1)}ث
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeDocument}
              className="gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              إعادة التحليل
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Classification */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-blue-500" />
            التصنيف
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {DOCUMENT_TYPE_LABELS[result.classification.document_type] || result.classification.document_type}
            </Badge>
            <Badge variant="outline">
              ثقة: {result.classification.confidence}%
            </Badge>
            {result.classification.suggested_folder && (
              <Badge variant="secondary" className="gap-1">
                📁 {result.classification.suggested_folder}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileSearch className="h-4 w-4 text-purple-500" />
            الملخص الذكي
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
            {result.summary}
          </p>
        </div>

        <Separator />

        {/* Extracted Data */}
        {result.extracted_data && Object.keys(result.extracted_data).some(k => {
          const v = result.extracted_data[k as keyof typeof result.extracted_data];
          return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
        }) && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Copy className="h-4 w-4 text-green-500" />
                البيانات المستخرجة
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.extracted_data.reference_number && (
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-muted-foreground">الرقم المرجعي: </span>
                    <span className="font-medium">{result.extracted_data.reference_number}</span>
                  </div>
                )}
                {result.extracted_data.date && (
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-muted-foreground">التاريخ: </span>
                    <span className="font-medium">{result.extracted_data.date}</span>
                  </div>
                )}
                {result.extracted_data.amount != null && (
                  <div className="bg-muted/50 rounded p-2">
                    <span className="text-muted-foreground">المبلغ: </span>
                    <span className="font-medium">{result.extracted_data.amount}</span>
                  </div>
                )}
                {result.extracted_data.parties && result.extracted_data.parties.length > 0 && (
                  <div className="bg-muted/50 rounded p-2 col-span-2">
                    <span className="text-muted-foreground">الأطراف: </span>
                    <span className="font-medium">{result.extracted_data.parties.join('، ')}</span>
                  </div>
                )}
                {result.extracted_data.other_fields && 
                  Object.entries(result.extracted_data.other_fields).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">{key}: </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Risk & Compliance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-amber-500" />
              المخاطر والامتثال
            </div>
            <div className="flex items-center gap-2">
              <Badge className={RISK_COLORS[result.risk_analysis.risk_level] || ''}>
                {RISK_LABELS[result.risk_analysis.risk_level] || result.risk_analysis.risk_level}
              </Badge>
              <Badge variant="outline">
                الامتثال: {result.risk_analysis.compliance_score}%
              </Badge>
            </div>
          </div>

          {/* Compliance checks */}
          {result.risk_analysis.checks && result.risk_analysis.checks.length > 0 && (
            <div className="space-y-1">
              {result.risk_analysis.checks.map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">{check.name}</span>
                    <span className="text-muted-foreground"> — {check.details}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {result.risk_analysis.recommendations && result.risk_analysis.recommendations.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                التوصيات
              </div>
              {result.risk_analysis.recommendations.map((rec, i) => (
                <p key={i} className="text-sm text-amber-600 dark:text-amber-400/80 pr-5">
                  • {rec}
                </p>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4 text-indigo-500" />
              الوسوم
            </div>
            <div className="flex flex-wrap gap-1">
              {result.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

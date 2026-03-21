import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  FileText, Loader2, RefreshCw, TrendingUp, Scale, Leaf, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  executive_summary: string;
  compliance_score: number;
  risk_level: string;
  licenses: Array<{ name: string; number: string; status: string; issue_date: string; expiry_date: string; notes: string }>;
  environmental_compliance: { score: number; details: string; laws_referenced: string[] };
  obligations: Array<{ text: string; status: string; source_document: string }>;
  waste_types_analysis: { licensed_types: string[]; notes: string };
  risks: Array<{ category: string; description: string; severity: string; mitigation: string }>;
  missing_documents: string[];
  recommendations: Array<{ priority: string; action: string; deadline: string; impact: string }>;
  scoring_breakdown: Record<string, number>;
}

interface Props {
  organizationId: string;
}

const OrganizationAnalysis = ({ organizationId }: Props) => {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [docsCount, setDocsCount] = useState(0);

  useEffect(() => {
    // Check how many AI-extracted docs exist
    supabase
      .from('entity_documents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('ai_extracted', true)
      .then(({ count }) => setDocsCount(count || 0));
  }, [organizationId]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-organization', {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if (data?.success && data.result) {
        setAnalysis(data.result);
        toast.success('تم إنجاز التحليل الشامل');
      } else {
        throw new Error(data?.error || 'فشل التحليل');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ في التحليل');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getRiskBadge = (level: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      low: { label: 'منخفض', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      medium: { label: 'متوسط', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      high: { label: 'مرتفع', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      critical: { label: 'حرج', cls: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    };
    const m = map[level] || map.medium;
    return <Badge className={m.cls}>{m.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'valid' || status === 'fulfilled') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === 'expired') return <XCircle className="h-4 w-4 text-destructive" />;
    if (status === 'missing') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  if (!analysis && !loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-12 text-center space-y-4">
          <Brain className="h-16 w-16 text-primary/30 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">تحليل الجهة الشامل بالذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground mt-1">
              تحليل شامل لحالة الامتثال والتراخيص والمخاطر بناءً على {docsCount} مستند مستخرج
            </p>
          </div>
          <Button onClick={runAnalysis} className="gap-2" size="lg">
            <Brain className="h-5 w-5" />
            بدء التحليل الشامل
          </Button>
          {docsCount === 0 && (
            <p className="text-xs text-muted-foreground">
              💡 ارفع مستندات من تبويب "الوثائق" أو "التراخيص والامتثال" أولاً للحصول على تحليل أدق
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحليل {docsCount} مستند وبيانات الجهة...</p>
          <p className="text-xs text-muted-foreground">قد يستغرق ذلك 15-30 ثانية</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <ScrollArea className="max-h-[calc(100vh-200px)]">
      <div className="space-y-4 pb-6">
        {/* Header + Score */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">الملخص التنفيذي</h3>
                  {getRiskBadge(analysis.risk_level)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.executive_summary}</p>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.compliance_score)}`}>
                  {analysis.compliance_score}%
                </div>
                <p className="text-xs text-muted-foreground">درجة الامتثال</p>
                <Progress value={analysis.compliance_score} className="w-24 mt-1" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1">
                <RefreshCw className="h-3 w-3" />
                إعادة التحليل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Breakdown */}
        {analysis.scoring_breakdown && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />تفصيل درجة الامتثال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysis.scoring_breakdown).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    licenses_valid: 'صلاحية التراخيص',
                    environmental_compliance: 'الامتثال البيئي',
                    documentation_complete: 'اكتمال الوثائق',
                    obligations_met: 'استيفاء الاشتراطات',
                    risk_management: 'إدارة المخاطر',
                  };
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{labels[key] || key}</span>
                        <span className="font-semibold">{val}/20</span>
                      </div>
                      <Progress value={(val / 20) * 100} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Licenses */}
        {analysis.licenses?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />التراخيص والتصاريح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.licenses.map((lic, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    {getStatusIcon(lic.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{lic.name}</span>
                        {lic.number && <Badge variant="outline" className="text-[10px]">{lic.number}</Badge>}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {lic.issue_date && <span>صدور: {lic.issue_date}</span>}
                        {lic.expiry_date && <span>انتهاء: {lic.expiry_date}</span>}
                      </div>
                      {lic.notes && <p className="text-xs text-muted-foreground">{lic.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environmental Compliance */}
        {analysis.environmental_compliance && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-500" />الامتثال البيئي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreColor(analysis.environmental_compliance.score)}`}>
                  {analysis.environmental_compliance.score}%
                </span>
                <Progress value={analysis.environmental_compliance.score} className="flex-1 h-2" />
              </div>
              <p className="text-sm text-muted-foreground">{analysis.environmental_compliance.details}</p>
              {analysis.environmental_compliance.laws_referenced?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.environmental_compliance.laws_referenced.map((law, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]"><Scale className="h-3 w-3 ml-1" />{law}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Obligations */}
        {analysis.obligations?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />الاشتراطات والالتزامات ({analysis.obligations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {analysis.obligations.map((ob, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/20 rounded text-xs">
                      {getStatusIcon(ob.status)}
                      <span className="flex-1 leading-relaxed">{ob.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Risks */}
        {analysis.risks?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />تحليل المخاطر ({analysis.risks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.risks.map((risk, i) => (
                  <div key={i} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      {getRiskBadge(risk.severity)}
                      <span className="text-sm font-medium">{risk.description}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">✅ إجراء التخفيف: {risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Documents */}
        {analysis.missing_documents?.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive"><XCircle className="h-4 w-4" />مستندات ناقصة ({analysis.missing_documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.missing_documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <Card className="border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-4 w-4" />التوصيات ({analysis.recommendations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => {
                  const prioColors: Record<string, string> = {
                    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                  };
                  return (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={prioColors[rec.priority] || prioColors.medium}>{rec.priority === 'high' ? 'عاجل' : rec.priority === 'medium' ? 'متوسط' : 'منخفض'}</Badge>
                        <span className="text-sm font-medium">{rec.action}</span>
                      </div>
                      {rec.impact && <p className="text-xs text-muted-foreground">الأثر: {rec.impact}</p>}
                      {rec.deadline && <p className="text-xs text-muted-foreground">الموعد: {rec.deadline}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default OrganizationAnalysis;

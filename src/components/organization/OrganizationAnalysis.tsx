import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Brain, Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  FileText, Loader2, RefreshCw, TrendingUp, Scale, Leaf, BarChart3,
  DollarSign, Truck, Activity, Gavel, FileWarning, Users, Save, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { notifyAdmins } from '@/services/unifiedNotifier';

interface License {
  name: string; number: string; issuing_authority?: string; status: string;
  issue_date: string; expiry_date: string; conditions?: string; notes: string;
}
interface Obligation {
  text: string; status: string; source_document: string; legal_consequence?: string; deadline?: string;
}
interface Risk {
  category: string; description: string; severity: string; probability?: string;
  potential_penalties?: string; mitigation: string;
}
interface MissingDoc {
  name: string; legal_basis?: string; issuing_authority?: string; consequence?: string;
}
interface Recommendation {
  priority: string; action: string; deadline: string; estimated_cost?: string;
  impact: string; responsible_party?: string;
}
interface WasteTypeDetail {
  name: string; code?: string; allowed_quantity?: string; treatment_method?: string; storage_conditions?: string;
}

interface AnalysisResult {
  executive_summary: string;
  compliance_score: number;
  risk_level: string;
  licenses: License[];
  environmental_compliance: { score: number; details: string; laws_referenced: string[]; specific_requirements?: string[]; violations_risk?: string };
  obligations: Obligation[];
  waste_types_analysis: { licensed_types: WasteTypeDetail[] | string[]; actually_handled?: string[]; discrepancies?: string; notes: string };
  financial_analysis?: { total_operations_value: number; collection_rate: number; overdue_invoices: number; financial_health: string; details: string };
  fleet_analysis?: { total_vehicles: number; operational_readiness: number; license_issues: string; details: string };
  operational_analysis?: { completion_rate: number; cancellation_rate: number; efficiency_score: number; patterns: string; details: string };
  risks: Risk[];
  missing_documents: MissingDoc[] | string[];
  recommendations: Recommendation[];
  scoring_breakdown: Record<string, number>;
}

interface Props { organizationId: string; }

const OrganizationAnalysis = ({ organizationId }: Props) => {
  const { profile, organization } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docsCount, setDocsCount] = useState(0);

  useEffect(() => {
    supabase.from('entity_documents').select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('ai_extracted', true)
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
        toast.success('تم إنجاز التحليل الشامل العميق');
      } else {
        throw new Error(data?.error || 'فشل التحليل');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ في التحليل');
    } finally { setLoading(false); }
  };

  const saveAndShareWithAdmin = async () => {
    if (!analysis || !profile) return;
    setSaving(true);
    try {
      const orgName = organization?.name || 'جهة';
      const reportTitle = `تقرير تحليل شامل - ${orgName} - ${new Date().toLocaleDateString('ar-EG')}`;
      
      const { error: saveError } = await supabase.from('entity_documents').insert({
        organization_id: organizationId,
        document_type: 'report',
        document_category: 'other',
        title: reportTitle,
        file_name: `${reportTitle}.json`,
        file_url: '',
        ai_extracted: true,
        ocr_extracted_data: analysis as any,
        ocr_confidence: analysis.compliance_score,
        uploaded_by: profile.id,
        tags: ['ai-analysis', 'deep-analysis', 'saved-report'],
      });
      if (saveError) throw saveError;

      const riskEmoji = analysis.risk_level === 'low' ? '🟢' : analysis.risk_level === 'medium' ? '🟡' : '🔴';
      await notifyAdmins(
        `📊 تقرير تحليل جهة: ${orgName}`,
        `${riskEmoji} مستوى المخاطرة: ${analysis.risk_level}\n📈 درجة الامتثال: ${analysis.compliance_score}%\n📝 الملخص: ${(analysis.executive_summary || '').slice(0, 300)}`,
        {
          type: 'org_analysis',
          reference_id: organizationId,
          reference_type: 'organization',
          organization_id: organizationId,
        }
      );

      toast.success('✅ تم حفظ التقرير ومشاركته مع مدير النظام');
    } catch (err: any) {
      console.error(err);
      toast.error('فشل حفظ التقرير: ' + (err.message || ''));
    } finally { setSaving(false); }
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
    if (status === 'valid' || status === 'fulfilled') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (status === 'expired' || status === 'violated') return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    if (status === 'missing' || status === 'expiring_soon') return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  const scoringLabels: Record<string, string> = {
    licenses_validity: 'صلاحية التراخيص',
    licenses_valid: 'صلاحية التراخيص',
    environmental_compliance: 'الامتثال البيئي',
    documentation_completeness: 'اكتمال الوثائق',
    documentation_complete: 'اكتمال الوثائق',
    obligations_fulfillment: 'استيفاء الاشتراطات',
    obligations_met: 'استيفاء الاشتراطات',
    risk_management: 'إدارة المخاطر',
    financial_health: 'الصحة المالية',
    operational_efficiency: 'الكفاءة التشغيلية',
    fleet_readiness: 'جاهزية الأسطول',
    legal_compliance: 'الامتثال القانوني',
    data_quality: 'جودة البيانات',
  };

  if (!analysis && !loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-12 text-center space-y-4">
          <Brain className="h-16 w-16 text-primary/30 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">تحليل الجهة الشامل والعميق بالذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground mt-1">
              تحليل عميق ودقيق لكل جوانب الجهة بناءً على {docsCount} مستند + بيانات الشحنات والعقود والفواتير والأسطول
            </p>
          </div>
          <Button onClick={runAnalysis} className="gap-2" size="lg">
            <Brain className="h-5 w-5" />
            بدء التحليل العميق الشامل
          </Button>
          {docsCount === 0 && (
            <p className="text-xs text-muted-foreground">
              💡 ارفع مستندات من تبويب "الوثائق" أولاً للحصول على تحليل أعمق وأدق
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
          <p className="font-medium">جاري التحليل العميق الشامل...</p>
          <p className="text-sm text-muted-foreground">تحليل {docsCount} مستند + الشحنات + العقود + الفواتير + الأسطول</p>
          <p className="text-xs text-muted-foreground">قد يستغرق ذلك 30-60 ثانية للحصول على تقرير تفصيلي دقيق</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const maxPerCriteria = Object.keys(analysis.scoring_breakdown || {}).length <= 5 ? 20 : 10;

  return (
    <div>
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
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis.executive_summary}</p>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.compliance_score)}`}>
                  {analysis.compliance_score}%
                </div>
                <p className="text-xs text-muted-foreground">درجة الامتثال</p>
                <Progress value={analysis.compliance_score} className="w-24 mt-1" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="default" size="sm" onClick={saveAndShareWithAdmin} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {saving ? 'جاري الحفظ...' : 'حفظ ومشاركة مع المدير'}
                <Share2 className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1">
                <RefreshCw className="h-3 w-3" />إعادة التحليل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Breakdown */}
        {analysis.scoring_breakdown && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />تفصيل درجة الامتثال ({Object.keys(analysis.scoring_breakdown).length} معيار)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(analysis.scoring_breakdown).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{scoringLabels[key] || key}</span>
                      <span className={`font-semibold ${getScoreColor((val / maxPerCriteria) * 100)}`}>{val}/{maxPerCriteria}</span>
                    </div>
                    <Progress value={(val / maxPerCriteria) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" defaultValue={['licenses', 'env', 'obligations', 'risks', 'missing', 'recommendations']} className="space-y-2">
          {/* Licenses */}
          {analysis.licenses?.length > 0 && (
            <AccordionItem value="licenses" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />التراخيص والتصاريح ({analysis.licenses.length})</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {analysis.licenses.map((lic, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(lic.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{lic.name}</span>
                            {lic.number && <Badge variant="outline" className="text-[10px]">{lic.number}</Badge>}
                            <Badge className={lic.status === 'valid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : lic.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                              {lic.status === 'valid' ? 'ساري' : lic.status === 'expired' ? 'منتهي' : lic.status === 'expiring_soon' ? 'قارب على الانتهاء' : 'غير متوفر'}
                            </Badge>
                          </div>
                          {lic.issuing_authority && <p className="text-xs text-muted-foreground mt-1">الجهة المانحة: {lic.issuing_authority}</p>}
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            {lic.issue_date && <span>📅 صدور: {lic.issue_date}</span>}
                            {lic.expiry_date && <span>⏰ انتهاء: {lic.expiry_date}</span>}
                          </div>
                          {lic.conditions && <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">📋 الشروط: {lic.conditions}</p>}
                          {lic.notes && <p className="text-xs text-muted-foreground mt-1">💡 {lic.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Environmental Compliance */}
          {analysis.environmental_compliance && (
            <AccordionItem value="env" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-500" />الامتثال البيئي ({analysis.environmental_compliance.score}%)</div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.environmental_compliance.score)}`}>{analysis.environmental_compliance.score}%</span>
                  <Progress value={analysis.environmental_compliance.score} className="flex-1 h-2" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis.environmental_compliance.details}</p>
                {analysis.environmental_compliance.violations_risk && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">⚠️ مخاطر المخالفات:</p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">{analysis.environmental_compliance.violations_risk}</p>
                  </div>
                )}
                {analysis.environmental_compliance.specific_requirements?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">المتطلبات المحددة:</p>
                    {analysis.environmental_compliance.specific_requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                        <span className="text-primary">•</span><span>{req}</span>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.environmental_compliance.laws_referenced?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.environmental_compliance.laws_referenced.map((law, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]"><Scale className="h-3 w-3 ml-1" />{law}</Badge>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Obligations */}
          {analysis.obligations?.length > 0 && (
            <AccordionItem value="obligations" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />الاشتراطات والالتزامات ({analysis.obligations.length})</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {analysis.obligations.map((ob, i) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg space-y-1">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(ob.status)}
                        <div className="flex-1">
                          <p className="text-xs leading-relaxed">{ob.text}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {ob.source_document && <Badge variant="outline" className="text-[9px]">📄 {ob.source_document}</Badge>}
                            {ob.deadline && <Badge variant="outline" className="text-[9px]">⏰ {ob.deadline}</Badge>}
                          </div>
                          {ob.legal_consequence && (
                            <p className="text-[10px] text-red-500 mt-1">⚖️ عواقب عدم الاستيفاء: {ob.legal_consequence}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Waste Types */}
          {analysis.waste_types_analysis && (
            <AccordionItem value="waste" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-500" />تحليل أنواع المخلفات</div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {Array.isArray(analysis.waste_types_analysis.licensed_types) && analysis.waste_types_analysis.licensed_types.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">الأنواع المرخصة:</p>
                    {analysis.waste_types_analysis.licensed_types.map((wt, i) => (
                      <div key={i} className="p-2 bg-muted/30 rounded text-xs space-y-1">
                        {typeof wt === 'string' ? (
                          <span>{wt}</span>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{wt.name}</span>
                              {wt.code && <Badge variant="outline" className="text-[9px]">{wt.code}</Badge>}
                            </div>
                            {wt.allowed_quantity && <p className="text-muted-foreground">الكمية المسموحة: {wt.allowed_quantity}</p>}
                            {wt.treatment_method && <p className="text-muted-foreground">طريقة المعالجة: {wt.treatment_method}</p>}
                            {wt.storage_conditions && <p className="text-muted-foreground">شروط التخزين: {wt.storage_conditions}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.waste_types_analysis.actually_handled?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">المُعامل فعلياً من الشحنات:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.waste_types_analysis.actually_handled.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.waste_types_analysis.discrepancies && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">⚠️ تباينات: {analysis.waste_types_analysis.discrepancies}</p>
                  </div>
                )}
                {analysis.waste_types_analysis.notes && <p className="text-xs text-muted-foreground">{analysis.waste_types_analysis.notes}</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Financial Analysis */}
          {analysis.financial_analysis && (
            <AccordionItem value="financial" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" />التحليل المالي</div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-lg font-bold">{analysis.financial_analysis.total_operations_value?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي العمليات (ج.م)</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className={`text-lg font-bold ${getScoreColor(analysis.financial_analysis.collection_rate)}`}>{analysis.financial_analysis.collection_rate}%</p>
                    <p className="text-[10px] text-muted-foreground">معدل التحصيل</p>
                  </div>
                </div>
                {analysis.financial_analysis.financial_health && (
                  <p className="text-xs font-medium">الصحة المالية: {analysis.financial_analysis.financial_health}</p>
                )}
                {analysis.financial_analysis.details && (
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis.financial_analysis.details}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Fleet Analysis */}
          {analysis.fleet_analysis && analysis.fleet_analysis.total_vehicles > 0 && (
            <AccordionItem value="fleet" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-blue-500" />تحليل الأسطول والسائقين</div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-lg font-bold">{analysis.fleet_analysis.total_vehicles}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي المركبات</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className={`text-lg font-bold ${getScoreColor(analysis.fleet_analysis.operational_readiness)}`}>{analysis.fleet_analysis.operational_readiness}%</p>
                    <p className="text-[10px] text-muted-foreground">الجاهزية التشغيلية</p>
                  </div>
                </div>
                {analysis.fleet_analysis.license_issues && <p className="text-xs text-yellow-600">⚠️ {analysis.fleet_analysis.license_issues}</p>}
                {analysis.fleet_analysis.details && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis.fleet_analysis.details}</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Operational Analysis */}
          {analysis.operational_analysis && (
            <AccordionItem value="operational" className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-purple-500" />التحليل التشغيلي</div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <p className={`text-lg font-bold ${getScoreColor(analysis.operational_analysis.completion_rate)}`}>{analysis.operational_analysis.completion_rate}%</p>
                    <p className="text-[9px] text-muted-foreground">معدل الإنجاز</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <p className={`text-lg font-bold ${analysis.operational_analysis.cancellation_rate > 20 ? 'text-destructive' : 'text-emerald-500'}`}>{analysis.operational_analysis.cancellation_rate}%</p>
                    <p className="text-[9px] text-muted-foreground">معدل الإلغاء</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg text-center">
                    <p className={`text-lg font-bold ${getScoreColor(analysis.operational_analysis.efficiency_score)}`}>{analysis.operational_analysis.efficiency_score}%</p>
                    <p className="text-[9px] text-muted-foreground">الكفاءة</p>
                  </div>
                </div>
                {analysis.operational_analysis.patterns && <p className="text-xs text-muted-foreground">📊 الأنماط: {analysis.operational_analysis.patterns}</p>}
                {analysis.operational_analysis.details && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{analysis.operational_analysis.details}</p>}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Risks */}
          {analysis.risks?.length > 0 && (
            <AccordionItem value="risks" className="border border-yellow-200 dark:border-yellow-800 rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3">
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />تحليل المخاطر ({analysis.risks.length})</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {analysis.risks.map((risk, i) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRiskBadge(risk.severity)}
                        {risk.probability && <Badge variant="outline" className="text-[9px]">احتمالية: {risk.probability === 'high' ? 'عالية' : risk.probability === 'medium' ? 'متوسطة' : 'منخفضة'}</Badge>}
                        <Badge variant="outline" className="text-[9px]">
                          {risk.category === 'legal' ? '⚖️ قانوني' : risk.category === 'environmental' ? '🌿 بيئي' : risk.category === 'operational' ? '⚙️ تشغيلي' : risk.category === 'financial' ? '💰 مالي' : '📢 سمعة'}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed">{risk.description}</p>
                      {risk.potential_penalties && (
                        <p className="text-[10px] text-red-500">💰 العقوبات المحتملة: {risk.potential_penalties}</p>
                      )}
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">✅ التخفيف: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Missing Documents */}
          {analysis.missing_documents?.length > 0 && (
            <AccordionItem value="missing" className="border border-destructive/30 rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3 text-destructive">
                <div className="flex items-center gap-2"><FileWarning className="h-4 w-4" />مستندات ناقصة ({analysis.missing_documents.length})</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {analysis.missing_documents.map((doc, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg space-y-1">
                      {typeof doc === 'string' ? (
                        <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />{doc}</div>
                      ) : (
                        <>
                          <p className="text-sm font-medium flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive shrink-0" />{doc.name}</p>
                          {doc.legal_basis && <p className="text-[10px] text-muted-foreground">📜 الأساس القانوني: {doc.legal_basis}</p>}
                          {doc.issuing_authority && <p className="text-[10px] text-muted-foreground">🏛️ الجهة المسؤولة: {doc.issuing_authority}</p>}
                          {doc.consequence && <p className="text-[10px] text-red-500">⚠️ العواقب: {doc.consequence}</p>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <AccordionItem value="recommendations" className="border border-emerald-500/30 rounded-lg px-3">
              <AccordionTrigger className="text-sm font-semibold gap-2 py-3 text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />التوصيات ({analysis.recommendations.length})</div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, i) => {
                    const prioColors: Record<string, string> = {
                      critical: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    };
                    const prioLabels: Record<string, string> = { critical: 'حرج', high: 'عاجل', medium: 'متوسط', low: 'منخفض' };
                    return (
                      <div key={i} className="p-3 bg-muted/20 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={prioColors[rec.priority] || prioColors.medium}>{prioLabels[rec.priority] || rec.priority}</Badge>
                          <span className="text-sm font-medium">{rec.action}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                          {rec.deadline && <span>⏰ الموعد: {rec.deadline}</span>}
                          {rec.estimated_cost && <span>💰 التكلفة: {rec.estimated_cost}</span>}
                          {rec.responsible_party && <span>👤 المسؤول: {rec.responsible_party}</span>}
                        </div>
                        {rec.impact && <p className="text-xs text-muted-foreground">📈 الأثر: {rec.impact}</p>}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
};

export default OrganizationAnalysis;

/**
 * ComplianceHub — Unified compliance analysis center
 * Two modes:
 *   1. Soft Analysis (non-binding standards comparison)
 *   2. AI Strict Analysis (AI-powered deep analysis — also non-binding, advisory only)
 * NEVER blocks any shipment or operation
 */

import { useState } from 'react';
import { useSoftComplianceAnalyzer, CATEGORY_LABELS, type ComplianceLevel, type StandardCategory } from '@/hooks/useSoftComplianceAnalyzer';
import { useAIComplianceAnalyzer, type AIComplianceReport } from '@/hooks/useAIComplianceAnalyzer';
import { useCompliancePDFReport } from '@/hooks/useCompliancePDFReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, ShieldCheck, ShieldAlert, Brain, Sparkles,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  FileText, Scale, Loader2, Info, ThumbsUp, ThumbsDown,
  Gavel, Target, ArrowUpCircle
} from 'lucide-react';

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  excellent: { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', label: 'ممتاز', icon: ShieldCheck },
  good: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'جيد', icon: Shield },
  acceptable: { color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20', label: 'مقبول', icon: ShieldAlert },
  needs_improvement: { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20', label: 'يحتاج تحسين', icon: AlertTriangle },
  poor: { color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20', label: 'ضعيف', icon: XCircle },
  weak: { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20', label: 'ضعيف', icon: AlertTriangle },
  critical: { color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20', label: 'حرج', icon: XCircle },
};

export default function ComplianceHub() {
  const [activeTab, setActiveTab] = useState('soft');
  const { data: softReport, isLoading: softLoading } = useSoftComplianceAnalyzer();
  const aiAnalyzer = useAIComplianceAnalyzer();
  const { generateReport, hasData } = useCompliancePDFReport();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Disclaimer Banner */}
      <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-700 dark:text-blue-400">تقارير استشارية غير ملزمة</AlertTitle>
        <AlertDescription className="text-blue-600/80">
          هذه التحليلات لأغراض استشارية فقط — لا تمنع أي عملية شحنة أو تشغيلية. تهدف لمساعدتك في تحسين مستوى الامتثال.
        </AlertDescription>
      </Alert>

      {/* PDF Export Button */}
      {hasData && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={generateReport} className="gap-2">
            <FileText className="h-4 w-4" /> طباعة تقرير الامتثال (PDF)
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="soft" className="gap-2">
            <Scale className="h-4 w-4" />
            تحليل المعايير
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            تحليل ذكي (AI)
          </TabsTrigger>
        </TabsList>

        {/* ═══ Soft Compliance Tab ═══ */}
        <TabsContent value="soft" className="space-y-4">
          {softLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">جارٍ تحليل المعايير...</div>
          ) : softReport ? (
            <>
              {/* Overall Score */}
              <Card className={LEVEL_CONFIG[softReport.overallLevel]?.bg || ''}>
                <CardContent className="p-6 flex items-center gap-4">
                  {(() => { const Icon = LEVEL_CONFIG[softReport.overallLevel]?.icon || Shield; return <Icon className={`h-12 w-12 ${LEVEL_CONFIG[softReport.overallLevel]?.color}`} />; })()}
                  <div className="flex-1">
                    <h2 className={`text-lg font-bold ${LEVEL_CONFIG[softReport.overallLevel]?.color}`}>
                      {LEVEL_CONFIG[softReport.overallLevel]?.label} — {softReport.overallScore}%
                    </h2>
                    <p className="text-sm text-muted-foreground">{softReport.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {softReport.strengths.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-600"><ThumbsUp className="h-4 w-4" /> نقاط القوة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {softReport.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-600" />{s}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {softReport.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-yellow-600"><ArrowUpCircle className="h-4 w-4" /> توصيات تحسينية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {softReport.recommendations.map((r, i) => (
                          <li key={i} className="text-sm flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-yellow-600" />{r}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(softReport.categories).map(([key, cat]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{CATEGORY_LABELS[key as StandardCategory]}</CardTitle>
                        <Badge variant={cat.score >= 75 ? 'default' : cat.score >= 50 ? 'secondary' : 'destructive'}>{cat.score}%</Badge>
                      </div>
                      <Progress value={cat.score} className="h-1.5" />
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {cat.checks.map(check => (
                        <div key={check.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-1 last:border-0">
                          <div className="flex items-center gap-1.5">
                            {check.status === 'met' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
                             check.status === 'partial' ? <AlertTriangle className="h-3 w-3 text-yellow-600" /> :
                             check.status === 'not_applicable' ? <Info className="h-3 w-3 text-muted-foreground" /> :
                             <XCircle className="h-3 w-3 text-destructive" />}
                            <span>{check.label}</span>
                          </div>
                          <span className="text-muted-foreground truncate max-w-[120px]">{check.description}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ═══ AI Analysis Tab ═══ */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Sparkles className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-bold">تحليل الامتثال بالذكاء الاصطناعي</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                تحليل عميق وصارم لجميع المستندات والتراخيص والعمليات بواسطة الذكاء الاصطناعي — مع مقارنة بالقانون 202/2020 والمعايير الدولية.
              </p>
              <Button
                size="lg"
                onClick={() => aiAnalyzer.mutate()}
                disabled={aiAnalyzer.isPending}
                className="gap-2"
              >
                {aiAnalyzer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {aiAnalyzer.isPending ? 'جارٍ التحليل...' : 'بدء التحليل الذكي'}
              </Button>
              <p className="text-xs text-muted-foreground">⚠️ هذا التقرير استشاري وغير ملزم</p>
            </CardContent>
          </Card>

          {/* AI Report Display */}
          {aiAnalyzer.data?.report && !('parse_error' in aiAnalyzer.data.report) && (
            <AIReportDisplay report={aiAnalyzer.data.report as AIComplianceReport} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AIReportDisplay({ report }: { report: AIComplianceReport }) {
  const levelConf = LEVEL_CONFIG[report.level] || LEVEL_CONFIG.acceptable;
  const LevelIcon = levelConf.icon;

  return (
    <div className="space-y-4">
      {/* Overall */}
      <Card className={levelConf.bg}>
        <CardContent className="p-6 flex items-center gap-4">
          <LevelIcon className={`h-12 w-12 ${levelConf.color}`} />
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${levelConf.color}`}>{levelConf.label} — {report.overall_score}/100</h2>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600 flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> نقاط القوة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive flex items-center gap-2"><ThumbsDown className="h-4 w-4" /> نقاط الضعف</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-start gap-2"><XCircle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" /><span className="font-medium">{w.point}</span></div>
                  <p className="text-xs text-muted-foreground mr-5 mt-0.5">المخاطر: {w.risk}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Recommendations */}
      {report.urgent_recommendations?.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-orange-600" /> توصيات عاجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.urgent_recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{r.priority === 'high' ? 'عاجل' : 'متوسط'}</Badge>
                    <span>{r.action}</span>
                  </div>
                  {r.deadline_days && <span className="text-xs text-muted-foreground">{r.deadline_days} يوم</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Risks */}
      {report.legal_risks?.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Gavel className="h-4 w-4 text-destructive" /> مخاطر قانونية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.legal_risks.map((r, i) => (
                <div key={i} className="text-sm border-b border-border/30 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.severity === 'high' ? 'destructive' : r.severity === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">{r.severity === 'high' ? 'عالي' : r.severity === 'medium' ? 'متوسط' : 'منخفض'}</Badge>
                    <span>{r.risk}</span>
                  </div>
                  {r.law_reference && <p className="text-xs text-muted-foreground mr-5 mt-0.5">المرجع: {r.law_reference}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standards Comparison */}
      {report.standards_comparison?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> مقارنة بالمعايير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {report.standards_comparison.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 pb-1.5 last:border-0">
                  <span>{s.standard}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.current_status === 'met' ? 'default' : s.current_status === 'partial' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {s.current_status === 'met' ? 'مستوفى' : s.current_status === 'partial' ? 'جزئي' : 'غير مستوفى'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي لأغراض استشارية فقط. لا يُعد بديلاً عن الاستشارة القانونية المتخصصة ولا يمنع أي عملية تشغيلية.
        </AlertDescription>
      </Alert>
    </div>
  );
}

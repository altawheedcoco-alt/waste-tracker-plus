/**
 * لوحة النضج الرقمي — Digital Maturity Dashboard
 * تقيس مؤشر التحول الرقمي للمؤسسة وتقدم توصيات تحسين
 */
import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Activity, FileText, PenTool, Brain, Shield, Workflow,
  TrendingUp, AlertTriangle, CheckCircle2, Target, Zap,
  BarChart3, Lightbulb, ArrowUpRight, RefreshCw, Database,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface MaturityDimension {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
  score: number;
  maxScore: number;
  indicators: { name: string; status: 'achieved' | 'partial' | 'missing'; weight: number }[];
}

const maturityLevels = [
  { min: 0, max: 20, label: 'أساسي', labelEn: 'Basic', color: 'bg-red-500', emoji: '🔴' },
  { min: 21, max: 40, label: 'ناشئ', labelEn: 'Emerging', color: 'bg-orange-500', emoji: '🟠' },
  { min: 41, max: 60, label: 'متوسط', labelEn: 'Intermediate', color: 'bg-yellow-500', emoji: '🟡' },
  { min: 61, max: 80, label: 'متقدم', labelEn: 'Advanced', color: 'bg-blue-500', emoji: '🔵' },
  { min: 81, max: 100, label: 'رائد', labelEn: 'Leader', color: 'bg-green-500', emoji: '🟢' },
];

const getMaturityLevel = (score: number) =>
  maturityLevels.find((l) => score >= l.min && score <= l.max) || maturityLevels[0];

const DigitalMaturityDashboard = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('organization_id').eq('id', data.user.id).single()
          .then(({ data: p }) => setOrgId(p?.organization_id || null));
      }
    });
  }, []);

  // Calculate maturity dimensions based on org data
  const [dimensions, setDimensions] = useState<MaturityDimension[]>([]);
  const [scanning, setScanning] = useState(false);

  const runMaturityScan = async () => {
    if (!orgId) return;
    setScanning(true);
    try {
      // Fetch various counts to calculate maturity
      const [
        { count: docsCount },
        { count: signaturesCount },
        { count: workflowCount },
        { count: ocrCount },
        { count: shipmentsCount },
        { count: invoicesCount },
      ] = await Promise.all([
        supabase.from('entity_documents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('document_signatures').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        (supabase.from('workflow_rules') as any).select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        (supabase.from('ocr_scan_results') as any).select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).or(`generator_id.eq.${orgId},transporter_id.eq.${orgId}`),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);

      const docScore = Math.min(100, ((docsCount || 0) / 10) * 100);
      const sigScore = Math.min(100, ((signaturesCount || 0) / 5) * 100);
      const wfScore = Math.min(100, ((workflowCount || 0) / 3) * 100);
      const ocrScore2 = Math.min(100, ((ocrCount || 0) / 5) * 100);
      const dataScore = Math.min(100, (((shipmentsCount || 0) + (invoicesCount || 0)) / 20) * 100);

      const dims: MaturityDimension[] = [
        {
          id: 'documents', label: 'رقمنة المستندات', labelEn: 'Document Digitization',
          icon: FileText, score: docScore, maxScore: 100,
          indicators: [
            { name: 'مستندات مرفوعة رقمياً', status: (docsCount || 0) > 0 ? 'achieved' : 'missing', weight: 30 },
            { name: 'تصنيف تلقائي للمستندات', status: (ocrCount || 0) > 0 ? 'achieved' : 'missing', weight: 25 },
            { name: 'أرشفة إلكترونية منظمة', status: (docsCount || 0) >= 5 ? 'achieved' : 'partial', weight: 25 },
            { name: 'مشاركة رقمية آمنة', status: (docsCount || 0) >= 3 ? 'partial' : 'missing', weight: 20 },
          ],
        },
        {
          id: 'signatures', label: 'التوقيع الإلكتروني', labelEn: 'E-Signatures',
          icon: PenTool, score: sigScore, maxScore: 100,
          indicators: [
            { name: 'توقيعات إلكترونية مفعلة', status: (signaturesCount || 0) > 0 ? 'achieved' : 'missing', weight: 30 },
            { name: 'ختم مؤسسي رقمي', status: (signaturesCount || 0) >= 3 ? 'achieved' : 'partial', weight: 25 },
            { name: 'تحقق بالهوية الوطنية', status: 'missing', weight: 25 },
            { name: 'سلسلة توقيعات متعددة', status: (signaturesCount || 0) >= 5 ? 'partial' : 'missing', weight: 20 },
          ],
        },
        {
          id: 'workflow', label: 'أتمتة سير العمل', labelEn: 'Workflow Automation',
          icon: Workflow, score: wfScore, maxScore: 100,
          indicators: [
            { name: 'قواعد أتمتة مفعلة', status: (workflowCount || 0) > 0 ? 'achieved' : 'missing', weight: 35 },
            { name: 'إشعارات تلقائية', status: 'achieved', weight: 25 },
            { name: 'موافقات رقمية', status: 'partial', weight: 20 },
            { name: 'تدفقات متسلسلة', status: (workflowCount || 0) >= 3 ? 'achieved' : 'missing', weight: 20 },
          ],
        },
        {
          id: 'ai', label: 'تبني الذكاء الاصطناعي', labelEn: 'AI Adoption',
          icon: Brain, score: ocrScore2, maxScore: 100,
          indicators: [
            { name: 'تحليل مستندات بالذكاء', status: (ocrCount || 0) > 0 ? 'achieved' : 'missing', weight: 30 },
            { name: 'تصنيف تلقائي ذكي', status: (ocrCount || 0) >= 3 ? 'achieved' : 'missing', weight: 25 },
            { name: 'توصيات ذكية', status: 'partial', weight: 25 },
            { name: 'تنبؤات واستشراف', status: 'missing', weight: 20 },
          ],
        },
        {
          id: 'data', label: 'تكامل البيانات', labelEn: 'Data Integration',
          icon: Database, score: dataScore, maxScore: 100,
          indicators: [
            { name: 'بيانات شحنات رقمية', status: (shipmentsCount || 0) > 0 ? 'achieved' : 'missing', weight: 30 },
            { name: 'فواتير إلكترونية', status: (invoicesCount || 0) > 0 ? 'achieved' : 'missing', weight: 25 },
            { name: 'ربط تلقائي بين الأنظمة', status: 'partial', weight: 25 },
            { name: 'تقارير لحظية', status: (shipmentsCount || 0) >= 5 ? 'achieved' : 'partial', weight: 20 },
          ],
        },
        {
          id: 'security', label: 'الأمن الرقمي', labelEn: 'Digital Security',
          icon: Shield, score: 70, maxScore: 100,
          indicators: [
            { name: 'تشفير البيانات', status: 'achieved', weight: 25 },
            { name: 'مصادقة ثنائية', status: 'partial', weight: 25 },
            { name: 'سجل تدقيق شامل', status: 'achieved', weight: 25 },
            { name: 'حماية RLS', status: 'achieved', weight: 25 },
          ],
        },
      ];

      setDimensions(dims);

      // Save to DB
      const overall = dims.reduce((s, d) => s + d.score, 0) / dims.length;
      await (supabase.from('digital_maturity_scores') as any).upsert({
        organization_id: orgId,
        score_date: new Date().toISOString().split('T')[0],
        overall_score: Math.round(overall * 100) / 100,
        document_digitization_score: docScore,
        workflow_automation_score: wfScore,
        e_signature_score: sigScore,
        data_integration_score: dataScore,
        ai_adoption_score: ocrScore2,
        security_score: 70,
        maturity_level: getMaturityLevel(overall).labelEn.toLowerCase(),
        recommendations: dims.flatMap(d =>
          d.indicators.filter(i => i.status !== 'achieved').map(i => ({
            dimension: d.id, indicator: i.name, priority: i.weight > 25 ? 'high' : 'medium',
          }))
        ),
      }, { onConflict: 'organization_id,score_date' });

      toast.success('تم تحديث مؤشر النضج الرقمي');
    } catch (err) {
      console.error(err);
      toast.error('فشل في حساب المؤشر');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (orgId) runMaturityScan();
  }, [orgId]);

  const overallScore = useMemo(
    () => dimensions.length ? Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) : 0,
    [dimensions]
  );

  const level = getMaturityLevel(overallScore);
  const recommendations = useMemo(
    () => dimensions.flatMap(d =>
      d.indicators.filter(i => i.status !== 'achieved').map(i => ({
        dimension: isAr ? d.label : d.labelEn, indicator: i.name, weight: i.weight,
        status: i.status,
      }))
    ).sort((a, b) => b.weight - a.weight).slice(0, 8),
    [dimensions, isAr]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-2 md:p-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                {isAr ? 'مؤشر النضج الرقمي' : 'Digital Maturity Index'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'قياس وتتبع مستوى التحول الرقمي لمؤسستك' : 'Measure and track your organization\'s digital transformation'}
              </p>
            </div>
          </div>
          <Button onClick={runMaturityScan} disabled={scanning} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {isAr ? 'إعادة الفحص' : 'Rescan'}
          </Button>
        </div>

        {/* Overall Score Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                      className="stroke-primary transition-all duration-1000"
                      strokeDasharray={`${overallScore * 2.64} 264`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{overallScore}%</span>
                    <span className="text-xs text-muted-foreground">{level.emoji} {isAr ? level.label : level.labelEn}</span>
                  </div>
                </div>

                {/* Level Scale */}
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold text-lg">
                    {isAr ? 'المستوى الحالي' : 'Current Level'}: {isAr ? level.label : level.labelEn}
                  </h3>
                  <div className="flex gap-1">
                    {maturityLevels.map((l) => (
                      <div key={l.labelEn} className="flex-1 space-y-1">
                        <div className={`h-2 rounded-full ${overallScore >= l.min ? l.color : 'bg-muted'} transition-colors`} />
                        <p className="text-[10px] text-center text-muted-foreground">{isAr ? l.label : l.labelEn}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? `مؤسستك حققت ${overallScore}% من التحول الرقمي الكامل. ${overallScore < 60 ? 'هناك فرص كبيرة للتحسين.' : 'أداء جيد، واصل التحسين.'}`
                      : `Your organization achieved ${overallScore}% digital transformation.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="dimensions" className="w-full">
          <TabsList className="w-full justify-start bg-muted/60 rounded-xl">
            <TabsTrigger value="dimensions" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              {isAr ? 'الأبعاد' : 'Dimensions'}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5">
              <Lightbulb className="w-4 h-4" />
              {isAr ? 'التوصيات' : 'Recommendations'}
            </TabsTrigger>
          </TabsList>

          {/* Dimensions Grid */}
          <TabsContent value="dimensions" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dimensions.map((dim, idx) => {
                const DimIcon = dim.icon;
                const dimLevel = getMaturityLevel(dim.score);
                return (
                  <motion.div key={dim.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}>
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <DimIcon className="w-5 h-5 text-primary" />
                            {isAr ? dim.label : dim.labelEn}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {dimLevel.emoji} {Math.round(dim.score)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Progress value={dim.score} className="h-2" />
                        <div className="space-y-2">
                          {dim.indicators.map((ind, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {ind.status === 'achieved' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              ) : ind.status === 'partial' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                              ) : (
                                <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                              <span className={ind.status === 'achieved' ? 'text-foreground' : 'text-muted-foreground'}>
                                {ind.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="mt-4">
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${rec.weight > 25 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{rec.indicator}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.dimension} · {isAr ? 'الأولوية' : 'Priority'}: {rec.weight > 25 ? (isAr ? 'عالية' : 'High') : (isAr ? 'متوسطة' : 'Medium')}
                        </p>
                      </div>
                      <Badge variant={rec.status === 'partial' ? 'secondary' : 'outline'} className="text-xs">
                        {rec.status === 'partial' ? (isAr ? 'جزئي' : 'Partial') : (isAr ? 'مطلوب' : 'Required')}
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-primary" />
                    </div>
                  </Card>
                </motion.div>
              ))}
              {recommendations.length === 0 && (
                <Card className="p-8 text-center">
                  <Zap className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="font-semibold">{isAr ? 'ممتاز! لا توجد توصيات عاجلة' : 'Excellent! No urgent recommendations'}</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DigitalMaturityDashboard;

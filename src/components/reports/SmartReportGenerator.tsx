import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Sparkles, Loader2, Download, Copy, Calendar,
  BarChart3, Shield, Leaf, Truck, Factory, AlertTriangle,
  CheckCircle2, Clock, Archive,
} from 'lucide-react';

const REPORT_TYPES = [
  { value: 'environmental', label: 'تقرير بيئي شامل', icon: Leaf, desc: 'تقرير عن الأثر البيئي وإدارة المخلفات' },
  { value: 'compliance', label: 'تقرير امتثال', icon: Shield, desc: 'مطابقة المعايير والتراخيص' },
  { value: 'operational', label: 'تقرير تشغيلي', icon: Truck, desc: 'أداء الشحنات والعمليات' },
  { value: 'esg', label: 'تقرير ESG', icon: BarChart3, desc: 'الحوكمة والاستدامة البيئية والاجتماعية' },
  { value: 'waste_audit', label: 'تدقيق مخلفات', icon: Factory, desc: 'تحليل كميات وأنواع المخلفات' },
  { value: 'incident', label: 'تقرير حوادث', icon: AlertTriangle, desc: 'توثيق وتحليل الحوادث البيئية' },
];

const SmartReportGenerator = memo(() => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState('environmental');
  const [customTitle, setCustomTitle] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch saved reports
  const { data: savedReports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['generated-reports', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const generateReport = async () => {
    if (!organization?.id || !user?.id) return;
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const selectedType = REPORT_TYPES.find(t => t.value === reportType);
      const title = customTitle || `${selectedType?.label} — ${organization.name}`;

      const resp = await supabase.functions.invoke('ai-report-generator', {
        body: {
          reportType,
          title,
          organizationName: organization.name,
          organizationType: (organization as any)?.organization_type,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          additionalNotes: additionalNotes || undefined,
          includeCharts,
        },
      });

      if (resp.error) throw resp.error;

      const content = resp.data?.report || resp.data?.content || 'لم يتم إنشاء التقرير. حاول مرة أخرى.';
      setGeneratedContent(content);

      // Save to DB
      await supabase.from('generated_reports').insert({
        organization_id: organization.id,
        created_by: user.id,
        report_type: reportType,
        title,
        content,
        summary: content.slice(0, 200),
        ai_model_used: resp.data?.model || 'gemini-2.5-flash',
        report_period_start: periodStart || null,
        report_period_end: periodEnd || null,
        status: 'completed',
        metadata: { includeCharts, additionalNotes: !!additionalNotes },
      } as any);

      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (err: any) {
      console.error('Report generation error:', err);
      toast.error('فشل في إنشاء التقرير', { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('تم نسخ التقرير');
  };

  const archiveReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generated_reports')
        .update({ is_archived: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
      toast.success('تم أرشفة التقرير');
    },
  });

  const statusIcons: Record<string, typeof CheckCircle2> = {
    completed: CheckCircle2,
    draft: Clock,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Generator */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            مولد التقارير الذكي
          </CardTitle>
          <CardDescription>اختر نوع التقرير وسيقوم الذكاء الاصطناعي بإنشائه تلقائياً بناءً على بيانات منظمتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REPORT_TYPES.map(type => (
              <motion.button
                key={type.value}
                onClick={() => setReportType(type.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                  reportType === type.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 bg-card'
                }`}
              >
                <type.icon className={`w-6 h-6 ${reportType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">{type.label}</span>
                <span className="text-[10px] text-muted-foreground">{type.desc}</span>
              </motion.button>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عنوان مخصص (اختياري)</Label>
              <Input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="سيتم إنشاء عنوان تلقائياً إن لم يُحدد"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Calendar className="w-3 h-3" />من تاريخ</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Calendar className="w-3 h-3" />إلى تاريخ</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات إضافية (اختياري)</Label>
            <Textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="أضف أي تفاصيل أو متطلبات خاصة..."
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="charts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
              <Label htmlFor="charts" className="text-sm">تضمين رسوم بيانية ومخططات</Label>
            </div>
            <Button onClick={generateReport} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      <AnimatePresence>
        {generatedContent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  التقرير المُنشأ
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyReport} className="gap-1.5">
                    <Copy className="w-3.5 h-3.5" />نسخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-sm bg-muted/30 p-6 rounded-xl border">
                  {generatedContent}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            التقارير السابقة
            <Badge variant="secondary" className="text-xs">{savedReports.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReports ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : savedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">لا توجد تقارير سابقة — أنشئ أول تقرير ذكي</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReports.map((report: any) => {
                const typeInfo = REPORT_TYPES.find(t => t.value === report.report_type);
                const StatusIcon = statusIcons[report.status] || Clock;
                return (
                  <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      {typeInfo ? <typeInfo.icon className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{typeInfo?.label || report.report_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className="w-4 h-4 text-emerald-500" />
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setGeneratedContent(report.content)}
                        className="text-xs h-7"
                      >
                        عرض
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => archiveReport.mutate(report.id)}
                        className="text-xs h-7 text-muted-foreground"
                      >
                        <Archive className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

SmartReportGenerator.displayName = 'SmartReportGenerator';
export default SmartReportGenerator;

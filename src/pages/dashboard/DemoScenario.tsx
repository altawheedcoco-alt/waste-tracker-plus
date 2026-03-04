import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Play, CheckCircle2, Clock, Building2, Truck, Recycle, Trash2, User, FileText, Package, AlertTriangle, Factory } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportStep {
  timestamp: string;
  step: string;
  details: string;
  entity: string;
  icon: string;
  scenario?: string;
}

interface ScenarioSummary {
  name: string;
  shipmentId?: string;
  shipmentNumber: string;
  destination: string;
  wasteType: string;
  quantity: string;
  hazardLevel: string;
  totalValue: string;
  duration: string;
  weightDiscrepancy: string;
  status: string;
}

interface DemoSummary {
  scenarios: ScenarioSummary[];
  organizations: Record<string, { id: string; name: string; type: string } | null>;
  driver: string;
  complianceStatus: string;
}

const DemoScenario = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [report, setReport] = useState<ReportStep[]>([]);
  const [summary, setSummary] = useState<DemoSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDemo = async () => {
    setIsRunning(true);
    setError(null);
    setReport([]);
    setSummary(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      const response = await supabase.functions.invoke('seed-demo-scenario', {});
      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      if (!result.success) throw new Error(result.error || 'فشل تنفيذ التجربة');

      setReport(result.report || []);
      setSummary(result.summary || null);
      setIsDone(true);
      toast.success('تم تنفيذ التجربتين بنجاح!');
    } catch (err: any) {
      setError(err.message);
      toast.error('حدث خطأ: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getEntityIcon = (entity: string) => {
    if (entity.includes('مولد')) return <Building2 className="h-4 w-4 text-blue-500" />;
    if (entity.includes('ناقل') || entity.includes('نقل')) return <Truck className="h-4 w-4 text-orange-500" />;
    if (entity.includes('مدور') || entity.includes('تدوير')) return <Recycle className="h-4 w-4 text-green-500" />;
    if (entity.includes('تخلص')) return <Factory className="h-4 w-4 text-red-500" />;
    if (entity.includes('سائق') || entity.includes('أحمد')) return <User className="h-4 w-4 text-purple-500" />;
    if (entity.includes('شحنة')) return <Package className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  const recyclerSteps = report.filter(s => s.scenario === 'recycler' || (!s.scenario && !isDone));
  const disposalSteps = report.filter(s => s.scenario === 'disposal');
  const sharedSteps = report.filter(s => !s.scenario || s.scenario === '');

  const renderTimeline = (steps: ReportStep[]) => (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 group">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">
              {step.icon}
            </div>
            {i < steps.length - 1 && <div className="w-px h-full bg-border min-h-[40px]" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-sm">{step.step}</span>
              <Badge variant="outline" className="text-[10px] gap-1">
                {getEntityIcon(step.entity)}
                {step.entity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{step.details}</p>
            <span className="text-[10px] text-muted-foreground/60">
              {new Date(step.timestamp).toLocaleTimeString('ar-EG')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderScenarioCard = (scenario: ScenarioSummary) => (
    <Card key={scenario.shipmentNumber}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold">{scenario.name}</h3>
          <Badge variant={scenario.status.includes('✅') ? 'default' : 'destructive'} className="text-xs">
            {scenario.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'رقم الشحنة', value: scenario.shipmentNumber },
            { label: 'الوجهة', value: scenario.destination },
            { label: 'نوع المخلفات', value: scenario.wasteType },
            { label: 'الكمية', value: scenario.quantity },
            { label: 'مستوى الخطورة', value: scenario.hazardLevel },
            { label: 'القيمة', value: scenario.totalValue },
            { label: 'المدة', value: scenario.duration },
            { label: 'فارق الوزن', value: scenario.weightDiscrepancy },
          ].map((item, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/50 space-y-0.5">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <p className="text-xs font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">التجربة الافتراضية الكاملة</h1>
            <p className="text-muted-foreground">سيناريوهين: شحنة للتدوير + شحنة للتخلص النهائي</p>
          </div>
        </div>

        {!isDone && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">تشغيل سيناريوهين كاملين</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                سيُنشئ النظام تجربتين متكاملتين: الأولى شحنة بلاستيك للتدوير والثانية شحنة كيميائية خطرة للتخلص النهائي، 
                مع جميع الجهات والهياكل التنظيمية والسائق والإقرارات والسجلات.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                {[
                  { icon: Recycle, label: 'شحنة تدوير', color: 'text-green-500' },
                  { icon: Factory, label: 'شحنة تخلص', color: 'text-red-500' },
                  { icon: Building2, label: '4 جهات + مرفق', color: 'text-blue-500' },
                  { icon: FileText, label: 'هياكل تنظيمية', color: 'text-emerald-500' },
                  { icon: User, label: 'سائق تجريبي', color: 'text-purple-500' },
                  { icon: Package, label: 'إقرارات وسجلات', color: 'text-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="eco" size="lg" onClick={runDemo} disabled={isRunning} className="mt-4">
                {isRunning ? (
                  <><span className="animate-spin mr-2">⏳</span>جاري تنفيذ التجربتين...</>
                ) : (
                  <><Play className="h-5 w-5 ml-2" />تشغيل التجربة الآن</>
                )}
              </Button>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isDone && summary && (
          <>
            {/* Scenario Summaries */}
            <div className="grid md:grid-cols-2 gap-4">
              {summary.scenarios.map(renderScenarioCard)}
            </div>

            {/* Organizations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  الجهات المشاركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(summary.organizations).filter(([, v]) => v).map(([key, org]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg border">
                      {getEntityIcon(org!.type)}
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">{org!.type}</p>
                        <p className="text-xs font-medium truncate">{org!.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Reports in Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  التقرير التفصيلي ({report.length} خطوة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" dir="rtl">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">الكل ({report.length})</TabsTrigger>
                    <TabsTrigger value="shared">مشترك ({sharedSteps.length})</TabsTrigger>
                    <TabsTrigger value="recycler">♻️ التدوير ({recyclerSteps.length})</TabsTrigger>
                    <TabsTrigger value="disposal">🏭 التخلص ({disposalSteps.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    <ScrollArea className="h-[500px]">{renderTimeline(report)}</ScrollArea>
                  </TabsContent>
                  <TabsContent value="shared">
                    <ScrollArea className="h-[500px]">{renderTimeline(sharedSteps)}</ScrollArea>
                  </TabsContent>
                  <TabsContent value="recycler">
                    <ScrollArea className="h-[500px]">{renderTimeline(recyclerSteps)}</ScrollArea>
                  </TabsContent>
                  <TabsContent value="disposal">
                    <ScrollArea className="h-[500px]">{renderTimeline(disposalSteps)}</ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-3 flex-wrap">
              <Button variant="eco" onClick={() => navigate('/dashboard/shipments')}>
                <Package className="h-4 w-4 ml-1" />عرض الشحنات
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/org-structure')}>
                <Building2 className="h-4 w-4 ml-1" />الهيكل التنظيمي
              </Button>
              <Button variant="outline" onClick={() => { setIsDone(false); setReport([]); setSummary(null); }}>
                <Play className="h-4 w-4 ml-1" />تجربة جديدة
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DemoScenario;

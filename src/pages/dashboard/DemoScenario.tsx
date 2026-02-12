import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Play, CheckCircle2, Clock, Building2, Truck, Recycle, Trash2, User, FileText, Package, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportStep {
  timestamp: string;
  step: string;
  details: string;
  entity: string;
  icon: string;
}

interface DemoSummary {
  shipmentId: string;
  shipmentNumber: string;
  organizations: Record<string, { id: string; name: string; type: string }>;
  driver: string;
  wasteType: string;
  quantity: string;
  totalValue: string;
  duration: string;
  weightDiscrepancy: string;
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
      toast.success('تم تنفيذ التجربة الافتراضية بنجاح!');
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
    if (entity.includes('تخلص')) return <Trash2 className="h-4 w-4 text-red-500" />;
    if (entity.includes('سائق') || entity.includes('أحمد')) return <User className="h-4 w-4 text-purple-500" />;
    if (entity.includes('شحنة')) return <Package className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">التجربة الافتراضية الكاملة</h1>
            <p className="text-muted-foreground">محاكاة دورة شحنة كاملة مع جميع الجهات والعمليات</p>
          </div>
        </div>

        {/* Start Card */}
        {!isDone && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">بدء التجربة الافتراضية</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                سيقوم النظام بإنشاء بيانات تجريبية كاملة تشمل: 4 جهات (مولد، ناقل، مدوّر، تخلص)، 
                هيكل تنظيمي لكل جهة، سائق، وشحنة كاملة مع جميع مراحل دورة الحياة والإقرارات والسجلات.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {[
                  { icon: Building2, label: '4 جهات', color: 'text-blue-500' },
                  { icon: FileText, label: 'هياكل تنظيمية', color: 'text-emerald-500' },
                  { icon: User, label: 'سائق تجريبي', color: 'text-purple-500' },
                  { icon: Package, label: 'شحنة كاملة', color: 'text-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="eco" size="lg" onClick={runDemo} disabled={isRunning} className="mt-4">
                {isRunning ? (
                  <><span className="animate-spin mr-2">⏳</span>جاري تنفيذ التجربة...</>
                ) : (
                  <><Play className="h-5 w-5 ml-2" />تشغيل التجربة الآن</>
                )}
              </Button>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isDone && summary && (
          <>
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ملخص التجربة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">رقم الشحنة</span>
                    <p className="font-mono font-bold text-sm">{summary.shipmentNumber}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">نوع المخلفات</span>
                    <p className="font-bold text-sm">{summary.wasteType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">الكمية</span>
                    <p className="font-bold text-sm">{summary.quantity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">القيمة الإجمالية</span>
                    <p className="font-bold text-sm">{summary.totalValue}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">السائق</span>
                    <p className="font-bold text-sm">{summary.driver}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">مدة الرحلة</span>
                    <p className="font-bold text-sm">{summary.duration}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">فارق الوزن</span>
                    <p className="font-bold text-sm">{summary.weightDiscrepancy}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <span className="text-xs text-muted-foreground">الامتثال</span>
                    <p className="font-bold text-sm">{summary.complianceStatus}</p>
                  </div>
                </div>

                {/* Organizations */}
                <Separator className="my-4" />
                <h3 className="font-semibold mb-3">الجهات المشاركة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(summary.organizations).map(([key, org]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg border">
                      {getEntityIcon(org.type)}
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{org.type}</p>
                        <p className="text-sm font-medium truncate">{org.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  التقرير التفصيلي ({report.length} خطوة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-0">
                    {report.map((step, i) => (
                      <div key={i} className="flex gap-3 group">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">
                            {step.icon}
                          </div>
                          {i < report.length - 1 && <div className="w-px h-full bg-border min-h-[40px]" />}
                        </div>
                        {/* Content */}
                        <div className="pb-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
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
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="eco" onClick={() => navigate(`/dashboard/shipments`)}>
                <Package className="h-4 w-4 ml-1" />
                عرض الشحنات
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/org-structure')}>
                <Building2 className="h-4 w-4 ml-1" />
                عرض الهيكل التنظيمي
              </Button>
              <Button variant="outline" onClick={() => { setIsDone(false); setReport([]); setSummary(null); }}>
                <Play className="h-4 w-4 ml-1" />
                تجربة جديدة
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DemoScenario;

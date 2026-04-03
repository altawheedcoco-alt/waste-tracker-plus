import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Brain, AlertTriangle, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

const AIForecasting = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const forecasts = [
    { category: "نفايات صناعية", current: 450, predicted: 520, trend: "up", confidence: 87, unit: "طن/شهر" },
    { category: "نفايات إلكترونية", current: 120, predicted: 145, trend: "up", confidence: 82, unit: "طن/شهر" },
    { category: "نفايات عضوية", current: 890, predicted: 850, trend: "down", confidence: 91, unit: "طن/شهر" },
    { category: "نفايات بلاستيكية", current: 340, predicted: 390, trend: "up", confidence: 79, unit: "طن/شهر" },
    { category: "نفايات خطرة", current: 75, predicted: 68, trend: "down", confidence: 94, unit: "طن/شهر" },
  ];

  const seasonalPatterns = [
    { month: "يناير", volume: 2100 }, { month: "فبراير", volume: 1950 },
    { month: "مارس", volume: 2300 }, { month: "أبريل", volume: 2450 },
    { month: "مايو", volume: 2600 }, { month: "يونيو", volume: 2800 },
    { month: "يوليو", volume: 2750 }, { month: "أغسطس", volume: 2500 },
    { month: "سبتمبر", volume: 2350 }, { month: "أكتوبر", volume: 2200 },
    { month: "نوفمبر", volume: 2050 }, { month: "ديسمبر", volume: 2150 },
  ];

  const maxVolume = Math.max(...seasonalPatterns.map(s => s.volume));

  const alerts = [
    { type: "warning", message: "متوقع زيادة 15% في النفايات الصناعية خلال الربع القادم", action: "تجهيز سعة تخزين إضافية" },
    { type: "info", message: "اتجاه انخفاض في النفايات الخطرة - مؤشر إيجابي على الامتثال", action: "مراجعة وتحديث خطط الطوارئ" },
    { type: "critical", message: "الطلب على خدمات النقل سيتجاوز السعة المتاحة بحلول مايو", action: "التعاقد مع ناقلين إضافيين" },
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            التنبؤ الذكي بالمخلفات
          </h1>
          <p className="text-muted-foreground mt-1">تحليل وتنبؤ بأحجام المخلفات باستخدام الذكاء الاصطناعي</p>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'جاري التحليل...' : 'تحديث التنبؤات'}
        </Button>
      </div>

      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecasts">التنبؤات</TabsTrigger>
          <TabsTrigger value="seasonal">الأنماط الموسمية</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات الذكية</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts.map((f, i) => (
              <Card key={i} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{f.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">الحالي</p>
                      <p className="text-xl font-bold text-foreground">{f.current}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${f.trend === 'up' ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {f.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        {Math.abs(((f.predicted - f.current) / f.current) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">المتوقع</p>
                      <p className="text-xl font-bold text-primary">{f.predicted}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{f.unit}</span>
                    <Badge variant="outline" className="text-xs">
                      ثقة {f.confidence}%
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${f.confidence}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                الأنماط الموسمية السنوية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seasonalPatterns.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">{s.month}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-primary to-primary/60 rounded transition-all"
                        style={{ width: `${(s.volume / maxVolume) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-16 text-left">{s.volume}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert, i) => (
            <Card key={i} className={`border-r-4 ${
              alert.type === 'critical' ? 'border-r-destructive' :
              alert.type === 'warning' ? 'border-r-orange-500' : 'border-r-primary'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    alert.type === 'critical' ? 'text-destructive' :
                    alert.type === 'warning' ? 'text-orange-500' : 'text-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{alert.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">الإجراء المقترح:</span> {alert.action}
                    </p>
                  </div>
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'outline'}>
                    {alert.type === 'critical' ? 'حرج' : alert.type === 'warning' ? 'تحذير' : 'معلومة'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
      </DashboardLayout>
  );
};

export default AIForecasting;

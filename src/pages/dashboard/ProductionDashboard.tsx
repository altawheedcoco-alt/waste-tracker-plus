import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Gauge, TrendingUp, Package, Zap, Droplets, Flame, BarChart3 } from "lucide-react";

const ProductionDashboard = () => {
  const productionLines = [
    { id: "PL-01", name: "خط فرز البلاستيك", status: "running", efficiency: 87, inputToday: 12.5, outputToday: 10.8, wasteRate: 13.6, uptime: 94 },
    { id: "PL-02", name: "خط تكسير المعادن", status: "running", efficiency: 92, inputToday: 8.2, outputToday: 7.6, wasteRate: 7.3, uptime: 98 },
    { id: "PL-03", name: "خط معالجة الورق", status: "maintenance", efficiency: 0, inputToday: 0, outputToday: 0, wasteRate: 0, uptime: 65 },
    { id: "PL-04", name: "خط تجميع الزجاج", status: "running", efficiency: 78, inputToday: 5.4, outputToday: 4.2, wasteRate: 22.2, uptime: 88 },
  ];

  const dailyStats = {
    totalInput: 26.1,
    totalOutput: 22.6,
    overallEfficiency: 86.6,
    energyConsumption: 2450,
    waterUsage: 180,
    carbonSaved: 8.2,
  };

  const batches = [
    { id: "B-2026-0307-01", line: "خط فرز البلاستيك", wasteType: "PET", inputKg: 5000, outputKg: 4350, status: "completed", quality: "A" },
    { id: "B-2026-0307-02", line: "خط تكسير المعادن", wasteType: "حديد خردة", inputKg: 3200, outputKg: 2980, status: "in_progress", quality: "-" },
    { id: "B-2026-0307-03", line: "خط فرز البلاستيك", wasteType: "HDPE", inputKg: 7500, outputKg: 6450, status: "completed", quality: "B" },
    { id: "B-2026-0307-04", line: "خط تجميع الزجاج", wasteType: "زجاج شفاف", inputKg: 5400, outputKg: 4200, status: "in_progress", quality: "-" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Factory className="h-7 w-7 text-primary" />
          لوحة الإنتاج والتصنيع
        </h1>
        <p className="text-muted-foreground mt-1">مراقبة خطوط الإنتاج وتتبع الدفعات في الوقت الحقيقي</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Package className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.totalInput}</p>
          <p className="text-[10px] text-muted-foreground">مدخلات (طن)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.totalOutput}</p>
          <p className="text-[10px] text-muted-foreground">مخرجات (طن)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Gauge className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.overallEfficiency}%</p>
          <p className="text-[10px] text-muted-foreground">كفاءة الاستخلاص</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.energyConsumption}</p>
          <p className="text-[10px] text-muted-foreground">كهرباء (kWh)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.waterUsage}</p>
          <p className="text-[10px] text-muted-foreground">مياه (م³)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Flame className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{dailyStats.carbonSaved}</p>
          <p className="text-[10px] text-muted-foreground">كربون موفر (طن)</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="lines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lines">خطوط الإنتاج</TabsTrigger>
          <TabsTrigger value="batches">تتبع الدفعات</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="space-y-3">
          {productionLines.map((line) => (
            <Card key={line.id} className={`border-r-4 ${
              line.status === 'maintenance' ? 'border-r-orange-500' : 'border-r-emerald-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{line.id}</p>
                  </div>
                  <Badge variant={line.status === 'running' ? 'default' : 'outline'}>
                    {line.status === 'running' ? '🟢 يعمل' : '🟡 صيانة'}
                  </Badge>
                </div>
                {line.status === 'running' && (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">الكفاءة</p>
                        <p className="font-bold text-foreground">{line.efficiency}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">مدخلات</p>
                        <p className="font-bold text-foreground">{line.inputToday} طن</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">مخرجات</p>
                        <p className="font-bold text-foreground">{line.outputToday} طن</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">هالك</p>
                        <p className="font-bold text-foreground">{line.wasteRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">وقت التشغيل:</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${line.uptime}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{line.uptime}%</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-right text-muted-foreground">رقم الدفعة</th>
                      <th className="p-3 text-right text-muted-foreground">الخط</th>
                      <th className="p-3 text-right text-muted-foreground">النوع</th>
                      <th className="p-3 text-right text-muted-foreground">مدخل (كجم)</th>
                      <th className="p-3 text-right text-muted-foreground">مخرج (كجم)</th>
                      <th className="p-3 text-right text-muted-foreground">الجودة</th>
                      <th className="p-3 text-right text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id} className="border-t border-border">
                        <td className="p-3 font-mono text-foreground text-xs">{b.id}</td>
                        <td className="p-3 text-foreground">{b.line}</td>
                        <td className="p-3 text-foreground">{b.wasteType}</td>
                        <td className="p-3 text-foreground">{b.inputKg.toLocaleString()}</td>
                        <td className="p-3 text-foreground">{b.outputKg.toLocaleString()}</td>
                        <td className="p-3">
                          {b.quality !== '-' ? <Badge variant={b.quality === 'A' ? 'default' : 'outline'}>{b.quality}</Badge> : '-'}
                        </td>
                        <td className="p-3">
                          <Badge variant={b.status === 'completed' ? 'default' : 'outline'}>
                            {b.status === 'completed' ? 'مكتمل' : 'قيد التشغيل'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;

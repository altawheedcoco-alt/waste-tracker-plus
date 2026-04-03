import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, CheckCircle, Clock, Truck, Calendar, TrendingUp } from "lucide-react";

const PreventiveMaintenance = () => {
  const [activeTab, setActiveTab] = useState("upcoming");

  const vehicles = [
    { id: "TRK-001", name: "شاحنة نقل 1", type: "شاحنة 10 طن", nextService: "2026-03-15", kmSinceService: 8500, maxKm: 10000, health: 85, status: "good" },
    { id: "TRK-002", name: "شاحنة نقل 2", type: "شاحنة 5 طن", nextService: "2026-03-10", kmSinceService: 9200, maxKm: 10000, health: 45, status: "warning" },
    { id: "TRK-003", name: "حاوية متحركة 1", type: "حاوية 20 قدم", nextService: "2026-03-08", kmSinceService: 9800, maxKm: 10000, health: 20, status: "critical" },
    { id: "TRK-004", name: "شاحنة خطرة", type: "شاحنة ADR", nextService: "2026-04-01", kmSinceService: 3200, maxKm: 10000, health: 95, status: "good" },
    { id: "EQP-001", name: "رافعة شوكية", type: "رافعة 3 طن", nextService: "2026-03-20", kmSinceService: 500, maxKm: 1000, health: 70, status: "good" },
  ];

  const maintenanceHistory = [
    { date: "2026-02-28", vehicle: "TRK-001", type: "تغيير زيت", cost: 1200, technician: "أحمد محمد" },
    { date: "2026-02-20", vehicle: "TRK-003", type: "صيانة فرامل", cost: 3500, technician: "محمد علي" },
    { date: "2026-02-15", vehicle: "TRK-002", type: "فحص شامل", cost: 2800, technician: "أحمد محمد" },
    { date: "2026-02-10", vehicle: "EQP-001", type: "تغيير إطارات", cost: 4200, technician: "خالد حسن" },
  ];

  const predictions = [
    { vehicle: "TRK-002", component: "نظام التبريد", probability: 78, estimatedDate: "2026-03-18", estimatedCost: 4500 },
    { vehicle: "TRK-003", component: "مضخة الوقود", probability: 65, estimatedDate: "2026-03-25", estimatedCost: 6000 },
    { vehicle: "TRK-001", component: "حزام المحرك", probability: 42, estimatedDate: "2026-04-10", estimatedCost: 1800 },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-7 w-7 text-primary" />
            الصيانة الوقائية والتنبؤية
          </h1>
          <p className="text-muted-foreground mt-1">إدارة ذكية لصيانة الأسطول والمعدات</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{vehicles.filter(v => v.status === 'good').length}</p>
          <p className="text-xs text-muted-foreground">حالة جيدة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{vehicles.filter(v => v.status === 'warning').length}</p>
          <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{vehicles.filter(v => v.status === 'critical').length}</p>
          <p className="text-xs text-muted-foreground">حالة حرجة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{predictions.length}</p>
          <p className="text-xs text-muted-foreground">تنبؤات أعطال</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">حالة المركبات</TabsTrigger>
          <TabsTrigger value="predictions">تنبؤات الأعطال</TabsTrigger>
          <TabsTrigger value="history">سجل الصيانة</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-3">
          {vehicles.map((v) => (
            <Card key={v.id} className={`border-r-4 ${
              v.status === 'critical' ? 'border-r-destructive' :
              v.status === 'warning' ? 'border-r-orange-500' : 'border-r-emerald-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.id} • {v.type}</p>
                    </div>
                  </div>
                  <Badge variant={v.status === 'critical' ? 'destructive' : v.status === 'warning' ? 'outline' : 'default'}>
                    صحة {v.health}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">الاستهلاك:</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      v.health > 60 ? 'bg-emerald-500' : v.health > 30 ? 'bg-orange-500' : 'bg-destructive'
                    }`} style={{ width: `${(v.kmSinceService / v.maxKm) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{v.kmSinceService}/{v.maxKm} كم</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">الصيانة القادمة: {v.nextService}</span>
                  <Button size="sm" variant="outline">جدولة صيانة</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-3">
          {predictions.map((p, i) => (
            <Card key={i} className="border-r-4 border-r-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{p.vehicle} - {p.component}</p>
                    <p className="text-sm text-muted-foreground">تاريخ متوقع: {p.estimatedDate}</p>
                  </div>
                  <div className="text-left">
                    <Badge variant={p.probability > 70 ? 'destructive' : 'outline'}>
                      احتمالية {p.probability}%
                    </Badge>
                    <p className="text-sm font-medium text-foreground mt-1">{p.estimatedCost.toLocaleString()} ج.م</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="default">جدولة صيانة استباقية</Button>
                  <Button size="sm" variant="outline">تجاهل</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-right text-muted-foreground">التاريخ</th>
                      <th className="p-3 text-right text-muted-foreground">المركبة</th>
                      <th className="p-3 text-right text-muted-foreground">نوع الصيانة</th>
                      <th className="p-3 text-right text-muted-foreground">التكلفة</th>
                      <th className="p-3 text-right text-muted-foreground">الفني</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map((m, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-3 text-foreground">{m.date}</td>
                        <td className="p-3 text-foreground">{m.vehicle}</td>
                        <td className="p-3 text-foreground">{m.type}</td>
                        <td className="p-3 text-foreground">{m.cost.toLocaleString()} ج.م</td>
                        <td className="p-3 text-muted-foreground">{m.technician}</td>
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

export default PreventiveMaintenance;

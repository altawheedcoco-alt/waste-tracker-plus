import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Truck, AlertTriangle, TrendingUp, Calendar, MapPin, BarChart3 } from "lucide-react";

const CapacityManagement = () => {
  const facilities = [
    {
      id: "FAC-01", name: "مدفن صحي - 6 أكتوبر", type: "landfill",
      totalCapacity: 500000, usedCapacity: 385000, dailyIntake: 450,
      remainingDays: 255, status: "normal", location: "الجيزة - 6 أكتوبر",
      sections: [
        { name: "الخلية A", capacity: 100, used: 95 },
        { name: "الخلية B", capacity: 100, used: 72 },
        { name: "الخلية C", capacity: 100, used: 45 },
        { name: "الخلية D", capacity: 100, used: 18 },
      ]
    },
    {
      id: "FAC-02", name: "محطة المعالجة المركزية", type: "treatment",
      totalCapacity: 200000, usedCapacity: 178000, dailyIntake: 320,
      remainingDays: 69, status: "warning", location: "القاهرة - 15 مايو",
      sections: [
        { name: "وحدة المعالجة 1", capacity: 100, used: 92 },
        { name: "وحدة المعالجة 2", capacity: 100, used: 88 },
        { name: "منطقة التخزين", capacity: 100, used: 85 },
      ]
    },
    {
      id: "FAC-03", name: "مرفق تخلص المخلفات الخطرة", type: "hazardous",
      totalCapacity: 50000, usedCapacity: 47500, dailyIntake: 35,
      remainingDays: 71, status: "critical", location: "الإسكندرية - برج العرب",
      sections: [
        { name: "خزان كيميائي 1", capacity: 100, used: 98 },
        { name: "خزان كيميائي 2", capacity: 100, used: 90 },
        { name: "منطقة الحرق", capacity: 100, used: 78 },
      ]
    },
  ];

  const incomingRequests = [
    { from: "شركة النقل الآمن", wasteType: "نفايات صناعية", quantity: 45, date: "2026-03-08", facility: "FAC-01" },
    { from: "ناقل أمين", wasteType: "مخلفات خطرة", quantity: 12, date: "2026-03-09", facility: "FAC-03" },
    { from: "شركة المحروسة", wasteType: "نفايات عضوية", quantity: 80, date: "2026-03-10", facility: "FAC-02" },
  ];

  const getUsagePercent = (used: number, total: number) => ((used / total) * 100).toFixed(1);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-orange-500';
      default: return 'text-emerald-500';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gauge className="h-7 w-7 text-primary" />
          إدارة السعة والطاقة الاستيعابية
        </h1>
        <p className="text-muted-foreground mt-1">مراقبة وإدارة سعات مرافق التخلص والمعالجة</p>
      </div>

      <Tabs defaultValue="facilities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="facilities">المرافق</TabsTrigger>
          <TabsTrigger value="requests">الطلبات الواردة</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="space-y-4">
          {facilities.map((f) => {
            const usagePercent = parseFloat(getUsagePercent(f.usedCapacity, f.totalCapacity));
            return (
              <Card key={f.id} className={`border-r-4 ${
                f.status === 'critical' ? 'border-r-destructive' :
                f.status === 'warning' ? 'border-r-orange-500' : 'border-r-emerald-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-lg">{f.name}</h3>
                        <Badge variant={f.status === 'critical' ? 'destructive' : f.status === 'warning' ? 'outline' : 'default'}>
                          {f.status === 'critical' ? 'حرج' : f.status === 'warning' ? 'تحذير' : 'طبيعي'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{f.location}</span>
                        <span className="font-mono text-xs">{f.id}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`text-3xl font-bold ${getStatusColor(f.status)}`}>{usagePercent}%</p>
                      <p className="text-xs text-muted-foreground">ممتلئ</p>
                    </div>
                  </div>

                  {/* Main capacity bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">السعة الإجمالية</span>
                      <span className="text-foreground font-medium">
                        {f.usedCapacity.toLocaleString()} / {f.totalCapacity.toLocaleString()} طن
                      </span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        usagePercent > 90 ? 'bg-destructive' : usagePercent > 75 ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {f.sections.map((s, i) => (
                      <div key={i} className="bg-muted/50 p-2 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{s.name}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            s.used > 90 ? 'bg-destructive' : s.used > 75 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`} style={{ width: `${s.used}%` }} />
                        </div>
                        <p className="text-xs font-medium text-foreground mt-1">{s.used}%</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">استقبال يومي:</span>
                      <span className="font-medium text-foreground">{f.dailyIntake} طن</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">أيام متبقية:</span>
                      <span className={`font-medium ${f.remainingDays < 100 ? 'text-destructive' : 'text-foreground'}`}>
                        {f.remainingDays} يوم
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="requests" className="space-y-3">
          {incomingRequests.map((req, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{req.from}</h3>
                    <p className="text-sm text-muted-foreground">{req.wasteType} • {req.quantity} طن</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">{req.date}</p>
                    <Badge variant="outline">{req.facility}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">قبول</Button>
                  <Button size="sm" variant="outline">رفض</Button>
                  <Button size="sm" variant="outline">عرض مقابل</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CapacityManagement;

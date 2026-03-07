import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, FileText, BarChart3, MessageCircle, Calendar, Clock, CheckCircle } from "lucide-react";

const ConsultantPortal = () => {
  const clients = [
    {
      id: "1", name: "شركة النقل الآمن", type: "transporter", status: "active",
      complianceScore: 82, nextAudit: "2026-04-15", openIssues: 3,
      lastContact: "2026-03-05", contractEnd: "2026-12-31",
    },
    {
      id: "2", name: "مصنع النيل للتدوير", type: "recycler", status: "active",
      complianceScore: 91, nextAudit: "2026-05-01", openIssues: 1,
      lastContact: "2026-03-03", contractEnd: "2027-06-30",
    },
    {
      id: "3", name: "شركة المحروسة للنظافة", type: "generator", status: "at_risk",
      complianceScore: 65, nextAudit: "2026-03-20", openIssues: 7,
      lastContact: "2026-02-28", contractEnd: "2026-09-30",
    },
    {
      id: "4", name: "مدفن الجيزة للتخلص", type: "disposal", status: "active",
      complianceScore: 78, nextAudit: "2026-04-10", openIssues: 2,
      lastContact: "2026-03-06", contractEnd: "2027-03-31",
    },
  ];

  const tasks = [
    { client: "شركة المحروسة للنظافة", task: "إعداد ملف التدقيق البيئي", due: "2026-03-15", priority: "high", status: "in_progress" },
    { client: "شركة النقل الآمن", task: "مراجعة تراخيص ADR", due: "2026-03-20", priority: "medium", status: "pending" },
    { client: "مصنع النيل للتدوير", task: "تحديث مصفوفة المخاطر", due: "2026-03-25", priority: "low", status: "pending" },
    { client: "مدفن الجيزة للتخلص", task: "تقرير الرصد البيئي الربعي", due: "2026-03-30", priority: "high", status: "pending" },
  ];

  const revenueData = {
    monthly: 45000,
    activeContracts: 4,
    pendingInvoices: 2,
    totalRevenue: 540000,
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          بوابة الاستشاري
        </h1>
        <p className="text-muted-foreground mt-1">إدارة العملاء والمهام الاستشارية البيئية</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{revenueData.activeContracts}</p>
          <p className="text-xs text-muted-foreground">عقود نشطة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <BarChart3 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{revenueData.monthly.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">إيراد شهري (ج.م)</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <FileText className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{revenueData.pendingInvoices}</p>
          <p className="text-xs text-muted-foreground">فواتير معلقة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <CheckCircle className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{clients.filter(c => c.complianceScore >= 80).length}</p>
          <p className="text-xs text-muted-foreground">عملاء ممتثلون</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">العملاء</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id} className={`border-r-4 ${
              client.complianceScore >= 80 ? 'border-r-emerald-500' :
              client.complianceScore >= 60 ? 'border-r-orange-500' : 'border-r-destructive'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{client.name}</h3>
                      <Badge variant={client.status === 'at_risk' ? 'destructive' : 'default'}>
                        {client.status === 'at_risk' ? 'معرض للخطر' : 'نشط'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.type === 'transporter' ? 'ناقل' : client.type === 'recycler' ? 'مدوّر' : client.type === 'generator' ? 'مولّد' : 'جهة تخلص'}
                    </p>
                  </div>
                  <div className="text-left">
                    <div className={`text-3xl font-bold ${
                      client.complianceScore >= 80 ? 'text-emerald-500' :
                      client.complianceScore >= 60 ? 'text-orange-500' : 'text-destructive'
                    }`}>
                      {client.complianceScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">امتثال</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">التدقيق القادم</p>
                    <p className="font-medium text-foreground">{client.nextAudit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">مشاكل مفتوحة</p>
                    <p className="font-medium text-foreground">{client.openIssues}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">نهاية العقد</p>
                    <p className="font-medium text-foreground">{client.contractEnd}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><MessageCircle className="h-3 w-3 ml-1" />مراسلة</Button>
                  <Button size="sm" variant="outline"><FileText className="h-3 w-3 ml-1" />تقرير</Button>
                  <Button size="sm">عرض الملف</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-3">
          {tasks.map((task, i) => (
            <Card key={i} className={`border-r-4 ${
              task.priority === 'high' ? 'border-r-destructive' :
              task.priority === 'medium' ? 'border-r-orange-500' : 'border-r-primary'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{task.task}</h3>
                    <p className="text-sm text-muted-foreground">{task.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.status === 'in_progress' ? 'default' : 'outline'}>
                      {task.status === 'in_progress' ? 'جاري التنفيذ' : 'معلق'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />الموعد: {task.due}
                  </span>
                  <Button size="sm" variant="outline">
                    {task.status === 'in_progress' ? 'إكمال' : 'بدء العمل'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultantPortal;

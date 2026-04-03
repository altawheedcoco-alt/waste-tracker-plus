import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MapPin, Calendar, Building2, FileText, Eye, Scale, Clock } from "lucide-react";

const RegulatoryViolations = () => {
  const violations = [
    {
      id: "VIO-2026-001", entity: "شركة النقل السريع", entityType: "transporter", type: "تجاوز الحمولة المقررة",
      severity: "critical", date: "2026-03-05", location: "طريق القاهرة-الإسكندرية الصحراوي",
      description: "تم رصد تجاوز الحمولة المقررة بنسبة 35% عبر بيانات الميزان الرقمي",
      status: "pending", fine: 50000, deadline: "2026-03-20",
    },
    {
      id: "VIO-2026-002", entity: "مصنع الدلتا للتدوير", entityType: "recycler", type: "تخزين مخلفات خطرة بدون ترخيص",
      severity: "high", date: "2026-03-01", location: "المنطقة الصناعية - العاشر من رمضان",
      description: "تم اكتشاف تخزين مواد مصنفة كخطرة خارج النطاق المرخص للمنشأة",
      status: "under_review", fine: 100000, deadline: "2026-03-15",
    },
    {
      id: "VIO-2026-003", entity: "شركة المحروسة للنظافة", entityType: "generator", type: "عدم تقديم التقارير الدورية",
      severity: "medium", date: "2026-02-25", location: "القاهرة - وسط المدينة",
      description: "تأخر في تقديم التقرير الربعي لجهاز تنظيم إدارة المخلفات (WMRA) بأكثر من 30 يوماً",
      status: "resolved", fine: 10000, deadline: "2026-03-10",
    },
    {
      id: "VIO-2026-004", entity: "ناقل أمين للمخلفات", entityType: "transporter", type: "سائق بدون تصريح ADR",
      severity: "high", date: "2026-03-03", location: "الجيزة - أبو رواش",
      description: "تم ضبط سائق ينقل مخلفات خطرة بدون تصريح ADR ساري",
      status: "pending", fine: 25000, deadline: "2026-03-18",
    },
  ];

  const stats = {
    total: violations.length,
    pending: violations.filter(v => v.status === 'pending').length,
    underReview: violations.filter(v => v.status === 'under_review').length,
    resolved: violations.filter(v => v.status === 'resolved').length,
    totalFines: violations.reduce((sum, v) => sum + v.fine, 0),
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityLabel = (s: string) => {
    switch (s) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending': return 'قيد الانتظار';
      case 'under_review': return 'قيد المراجعة';
      case 'resolved': return 'تم الحل';
      default: return s;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-destructive" />
          نظام المخالفات والجزاءات
        </h1>
        <p className="text-muted-foreground mt-1">إدارة ومتابعة المخالفات البيئية والتنظيمية</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي المخالفات</p>
        </CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">قيد الانتظار</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{stats.underReview}</p>
          <p className="text-xs text-muted-foreground">قيد المراجعة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground">تم الحل</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.totalFines.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">إجمالي الغرامات (ج.م)</p>
        </CardContent></Card>
      </div>

      <div className="space-y-4">
        {violations.map((v) => (
          <Card key={v.id} className={`border-r-4 ${
            v.severity === 'critical' ? 'border-r-destructive' :
            v.severity === 'high' ? 'border-r-orange-500' : 'border-r-amber-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{v.id}</span>
                    <Badge className={getSeverityColor(v.severity)}>{getSeverityLabel(v.severity)}</Badge>
                    <Badge variant={v.status === 'resolved' ? 'default' : 'outline'}>
                      {getStatusLabel(v.status)}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{v.type}</h3>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-destructive">{v.fine.toLocaleString()} ج.م</p>
                  <p className="text-xs text-muted-foreground">غرامة</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{v.entity}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.date}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{v.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>الموعد النهائي: {v.deadline}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Eye className="h-3 w-3 ml-1" />عرض التفاصيل</Button>
                  {v.status !== 'resolved' && (
                    <Button size="sm" variant="outline"><FileText className="h-3 w-3 ml-1" />إصدار إنذار</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RegulatoryViolations;

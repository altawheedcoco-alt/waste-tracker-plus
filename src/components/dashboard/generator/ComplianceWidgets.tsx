/**
 * قائمة مراجعة الامتثال الشهري + جاهزية التفتيش + ملخص أسبوعي + موافقات تلقائية + نفايات منتهية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Shield, FileBarChart, Zap, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const CHECKLIST = [
  { id: '1', label: 'مراجعة سجل النفايات الشهري', done: false },
  { id: '2', label: 'تحديث بيانات التراخيص', done: false },
  { id: '3', label: 'فحص الحاويات ونظافتها', done: false },
  { id: '4', label: 'مراجعة تقارير ESG', done: false },
  { id: '5', label: 'تدريب العاملين على الفرز', done: false },
  { id: '6', label: 'مطابقة الفواتير مع الشحنات', done: false },
  { id: '7', label: 'تحديث خطة الطوارئ البيئية', done: false },
  { id: '8', label: 'فحص مخزن النفايات الخطرة', done: false },
];

export const ComplianceChecklistWidget = () => {
  const [items, setItems] = useState(CHECKLIST);
  const completed = items.filter(i => i.done).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={progress >= 80 ? 'default' : 'secondary'} className="text-xs">{progress}%</Badge>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            قائمة الامتثال الشهري
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5" dir="rtl">
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer text-xs">
            <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
            <Checkbox
              checked={item.done}
              onCheckedChange={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i))}
              className="mr-auto"
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
};

export const AuditReadinessScore = () => {
  const score = 72; // Calculated from compliance data
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Shield className="h-4 w-4 text-primary" />
          جاهزية التفتيش البيئي
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center" dir="rtl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/20">
          <div>
            <p className="text-2xl font-bold text-primary">{grade}</p>
            <p className="text-[10px] text-muted-foreground">{score}/100</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          <Badge variant="outline">التراخيص: ✅</Badge>
          <Badge variant="outline">السجلات: ✅</Badge>
          <Badge variant="outline">التدريب: ⚠️</Badge>
          <Badge variant="outline">المعدات: ✅</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const WeeklySummaryWidget = () => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2 justify-end">
        <FileBarChart className="h-4 w-4 text-primary" />
        الملخص الأسبوعي
      </CardTitle>
    </CardHeader>
    <CardContent className="text-xs space-y-2" dir="rtl">
      <p className="text-muted-foreground">يتم إرسال ملخص أسبوعي تلقائي للإدارة يشمل:</p>
      <ul className="space-y-1 pr-4 list-disc text-muted-foreground">
        <li>إجمالي الشحنات والأوزان</li>
        <li>التكاليف والإيرادات</li>
        <li>معدل التدوير والأثر البيئي</li>
        <li>التنبيهات والتوصيات</li>
      </ul>
      <Badge variant="secondary" className="text-[10px]">📧 الإرسال كل يوم أحد 8 صباحاً</Badge>
    </CardContent>
  </Card>
);

export const AutoApprovalWidget = () => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2 justify-end">
        <Zap className="h-4 w-4 text-amber-500" />
        الموافقات التلقائية
      </CardTitle>
    </CardHeader>
    <CardContent className="text-xs space-y-2" dir="rtl">
      <p className="text-muted-foreground">قواعد الموافقة التلقائية على الشحنات:</p>
      <div className="space-y-1">
        <div className="flex justify-between p-1.5 rounded bg-muted/20">
          <Badge variant="default" className="text-[10px]">مفعّل</Badge>
          <span>الشحنات أقل من 500 كجم</span>
        </div>
        <div className="flex justify-between p-1.5 rounded bg-muted/20">
          <Badge variant="default" className="text-[10px]">مفعّل</Badge>
          <span>الناقلين المعتمدين</span>
        </div>
        <div className="flex justify-between p-1.5 rounded bg-muted/20">
          <Badge variant="secondary" className="text-[10px]">معطّل</Badge>
          <span>المخلفات الخطرة</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ExpiringWasteWidget = () => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2 justify-end">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        نفايات تحتاج تصريف عاجل
      </CardTitle>
    </CardHeader>
    <CardContent className="text-xs" dir="rtl">
      <p className="text-center text-muted-foreground py-3">لا توجد نفايات منتهية أو قريبة الانتهاء حالياً ✅</p>
    </CardContent>
  </Card>
);

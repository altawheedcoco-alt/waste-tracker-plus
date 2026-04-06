import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

const downtimeData = [
  { line: 'خط PET #1', planned: 8, unplanned: 3, total: 11, reason: 'صيانة مجدولة + عطل حزام' },
  { line: 'خط HDPE #2', planned: 6, unplanned: 12, total: 18, reason: 'عطل موتور + نقص مواد' },
  { line: 'خط الورق #3', planned: 24, unplanned: 0, total: 24, reason: 'صيانة شاملة مخططة' },
  { line: 'خط الحديد #4', planned: 4, unplanned: 1, total: 5, reason: 'تغيير فلتر' },
  { line: 'خط الزجاج #5', planned: 2, unplanned: 8, total: 10, reason: 'عطل فرن + كسر بطانة' },
];

const RecyclerDowntimeAnalysis = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Clock className="h-5 w-5 text-primary" />
        تحليل أوقات التوقف (ساعة/أسبوع)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {downtimeData.map((d, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{d.line}</span>
            <div className="flex items-center gap-1">
              {d.unplanned > d.planned && <AlertTriangle className="h-3 w-3 text-destructive" />}
              <span className="text-sm font-bold">{d.total} ساعة</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>مخطط: {d.planned}س</span>
            <span className={d.unplanned > 5 ? 'text-destructive' : ''}>غير مخطط: {d.unplanned}س</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{d.reason}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerDowntimeAnalysis;

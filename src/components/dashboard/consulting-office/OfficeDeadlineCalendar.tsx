/**
 * تقويم المواعيد النهائية للمكتب
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertTriangle, Clock, FileText } from 'lucide-react';

const deadlines = [
  { task: 'تسليم تقرير EIA - مصنع الأسمنت', date: '2026-04-10', type: 'report', urgent: true },
  { task: 'اجتماع مراجعة - هيئة المجتمعات', date: '2026-04-12', type: 'meeting', urgent: false },
  { task: 'تجديد اعتماد WMRA', date: '2026-04-15', type: 'license', urgent: true },
  { task: 'تقديم عرض سعر - محطة معالجة', date: '2026-04-18', type: 'proposal', urgent: false },
  { task: 'مراجعة مستندات - المنطقة الحرة', date: '2026-04-22', type: 'review', urgent: false },
];

const OfficeDeadlineCalendar = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        المواعيد القادمة
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {deadlines.filter(d => d.urgent).length} عاجل
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {deadlines.map((d, i) => (
        <div key={i} className={`flex items-center gap-2 p-2 rounded border ${d.urgent ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
          {d.urgent ? <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" /> : <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{d.task}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeDeadlineCalendar;

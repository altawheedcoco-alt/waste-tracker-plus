import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const overdue = [
  { client: 'مصنع الحديد', amount: 45000, daysOverdue: 15, lastReminder: '2026-03-28', status: 'overdue' as const },
  { client: 'فندق النيل', amount: 12000, daysOverdue: 5, lastReminder: '2026-04-01', status: 'warning' as const },
  { client: 'مصنع البلاستيك', amount: 28000, daysOverdue: 30, lastReminder: '2026-03-15', status: 'critical' as const },
];

const statusConfig = {
  warning: { label: 'متأخر', color: 'bg-yellow-100 text-yellow-800' },
  overdue: { label: 'متأخر جداً', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800' },
};

export default function OverdueInvoiceTracker() {
  const total = overdue.reduce((s, o) => s + o.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-primary" />
          كاشف الفواتير المتأخرة
        </CardTitle>
        <Badge variant="destructive">{total.toLocaleString()} ج.م مستحقة</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdue.map((o, i) => {
          const config = statusConfig[o.status];
          return (
            <div key={i} className="p-2.5 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{o.client}</span>
                <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-bold text-red-600">{o.amount.toLocaleString()} ج.م</span>
                <span>{o.daysOverdue} يوم تأخير</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-0.5 flex-1"><Send className="w-3 h-3" /> تذكير</Button>
                <Button size="sm" variant="destructive" className="h-6 text-[10px] gap-0.5 flex-1"><Clock className="w-3 h-3" /> تعليق خدمة</Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

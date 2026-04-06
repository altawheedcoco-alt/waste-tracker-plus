/**
 * لوحة تنبيهات الرقابة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertOctagon, AlertTriangle, Info, Clock } from 'lucide-react';

const alerts = [
  { message: 'ترخيص شركة النقل المتحدة ينتهي خلال 7 أيام', severity: 'critical', time: 'منذ ساعة' },
  { message: 'تجاوز حد الانبعاثات في مصنع البلاستيك', severity: 'critical', time: 'منذ 3 ساعات' },
  { message: '12 جهة مولّدة لم تقدم إقرارها الشهري', severity: 'warning', time: 'منذ يوم' },
  { message: 'طلب ترخيص جديد بانتظار المراجعة منذ 20 يوم', severity: 'warning', time: 'منذ يومين' },
  { message: 'تحديث قاعدة بيانات أكواد النفايات (Basel)', severity: 'info', time: 'منذ 3 أيام' },
];

const severityConfig: Record<string, { icon: typeof AlertOctagon; color: string }> = {
  critical: { icon: AlertOctagon, color: 'text-red-600' },
  warning: { icon: AlertTriangle, color: 'text-amber-600' },
  info: { icon: Info, color: 'text-blue-600' },
};

const RegulatorAlertCenter = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        مركز التنبيهات
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {alerts.filter(a => a.severity === 'critical').length} حرج
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {alerts.map((a, i) => {
        const cfg = severityConfig[a.severity];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded border">
            <Icon className={`h-4 w-4 ${cfg.color} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="text-xs">{a.message}</p>
              <span className="text-[9px] text-muted-foreground">{a.time}</span>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorAlertCenter;

/**
 * ودجت ملخص نشاط التدقيق الشهري — لجهة ISO
 * يعرض إحصائيات الشهر الحالي مع مقارنة بالشهر السابق
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ClipboardCheck, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

interface ISOMonthlyActivityProps {
  audits: any[];
}

const ISOMonthlyActivity = memo(({ audits }: ISOMonthlyActivityProps) => {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthAudits = audits.filter(a => a.audit_date?.startsWith(thisMonth) || a.created_at?.startsWith(thisMonth));
  const lastMonthAudits = audits.filter(a => a.audit_date?.startsWith(lastMonthStr) || a.created_at?.startsWith(lastMonthStr));

  const thisCompleted = thisMonthAudits.filter(a => a.status === 'completed').length;
  const lastCompleted = lastMonthAudits.filter(a => a.status === 'completed').length;
  const trend = thisCompleted - lastCompleted;

  const passRate = thisMonthAudits.length > 0
    ? Math.round((thisMonthAudits.filter(a => a.overall_result === 'pass').length / thisMonthAudits.length) * 100)
    : 0;

  const metrics = [
    {
      icon: ClipboardCheck,
      label: 'مراجعات الشهر',
      value: thisMonthAudits.length,
      color: 'text-primary',
    },
    {
      icon: CheckCircle2,
      label: 'مكتملة',
      value: thisCompleted,
      color: 'text-emerald-500',
    },
    {
      icon: AlertTriangle,
      label: 'جارية',
      value: thisMonthAudits.filter(a => a.status !== 'completed').length,
      color: 'text-amber-500',
    },
    {
      icon: Calendar,
      label: 'معدل النجاح',
      value: `${passRate}%`,
      color: passRate >= 70 ? 'text-emerald-500' : 'text-amber-500',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            نشاط الشهر الحالي
          </span>
          {trend !== 0 && (
            <Badge variant="outline" className={`text-[10px] gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend} عن الشهر السابق
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 text-center">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className={`text-lg font-bold ${m.color}`}>{m.value}</span>
              <span className="text-[9px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ISOMonthlyActivity.displayName = 'ISOMonthlyActivity';
export default ISOMonthlyActivity;

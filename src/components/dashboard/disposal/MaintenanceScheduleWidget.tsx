/**
 * ودجة جدول الصيانة — خاص بجهات التخلص
 * يعرض مواعيد الصيانة القادمة والحالية للمعدات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

interface MaintenanceTask {
  equipment: string;
  type: 'preventive' | 'corrective' | 'inspection';
  status: 'scheduled' | 'overdue' | 'completed';
  dueLabel: string;
}

const MaintenanceScheduleWidget = () => {
  // بيانات صيانة تقديرية (يمكن ربطها بقاعدة البيانات)
  const tasks: MaintenanceTask[] = [
    { equipment: 'كسارة المخلفات الرئيسية', type: 'preventive', status: 'scheduled', dueLabel: 'بعد 3 أيام' },
    { equipment: 'نظام معالجة الغازات', type: 'inspection', status: 'overdue', dueLabel: 'متأخر يومين' },
    { equipment: 'ميزان الجسر', type: 'preventive', status: 'completed', dueLabel: 'تم أمس' },
    { equipment: 'مضخات الرشح', type: 'corrective', status: 'scheduled', dueLabel: 'غداً' },
    { equipment: 'كاميرات المراقبة البيئية', type: 'inspection', status: 'completed', dueLabel: 'تم اليوم' },
  ];

  const statusIcons = {
    scheduled: <Clock className="h-3.5 w-3.5 text-blue-500" />,
    overdue: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  };

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    overdue: 'bg-red-500/10 text-red-700 dark:text-red-300',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-300',
  };

  const statusLabels = {
    scheduled: 'مجدول',
    overdue: 'متأخر',
    completed: 'مكتمل',
  };

  const typeLabels = {
    preventive: 'وقائية',
    corrective: 'تصحيحية',
    inspection: 'فحص',
  };

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          جدول الصيانة
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-[9px] mr-auto">
              {overdueCount} متأخر
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              {statusIcons[task.status]}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{task.equipment}</p>
                <p className="text-[9px] text-muted-foreground">{typeLabels[task.type]} — {task.dueLabel}</p>
              </div>
              <Badge variant="outline" className={`text-[8px] border-0 ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 rounded-lg bg-primary/5 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">
            {tasks.filter(t => t.status === 'completed').length} من {tasks.length} مهام مكتملة هذا الأسبوع
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceScheduleWidget;

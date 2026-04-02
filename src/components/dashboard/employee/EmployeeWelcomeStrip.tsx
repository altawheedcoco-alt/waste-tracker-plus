/**
 * شريط ترحيب ذكي للموظف — يعرض ملخص اليوم وعدد المهام المعلقة
 */
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sunrise, Sun, Moon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface EmployeeWelcomeStripProps {
  employeeName: string;
  permissionsCount: number;
  pendingTasks?: number;
  completedToday?: number;
}

const EmployeeWelcomeStrip = memo(({ employeeName, permissionsCount, pendingTasks = 0, completedToday = 0 }: EmployeeWelcomeStripProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';
  const Icon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  return (
    <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{greeting}، {employeeName}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingTasks > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-300">
                <Clock className="w-3 h-3" />
                {pendingTasks} معلق
              </Badge>
            )}
            {completedToday > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                {completedToday} مكتمل
              </Badge>
            )}
            {permissionsCount === 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3" />
                بدون صلاحيات
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EmployeeWelcomeStrip.displayName = 'EmployeeWelcomeStrip';
export default EmployeeWelcomeStrip;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays } from 'lucide-react';
import type { EmployeeDashboardStats } from '@/hooks/useEmployeeDashboardData';

interface Props {
  balances: EmployeeDashboardStats['leaveBalances'];
}

const leaveTypeLabels: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  emergency: 'طارئة',
  unpaid: 'بدون راتب',
  maternity: 'أمومة',
  paternity: 'أبوة',
  hajj: 'حج',
  marriage: 'زواج',
  bereavement: 'عزاء',
};

const EmployeeLeaveWidget = ({ balances }: Props) => {
  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            رصيد الإجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد أرصدة إجازات مسجلة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          رصيد الإجازات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.map((b, i) => {
          const total = Number(b.entitled_days) || 1;
          const used = Number(b.used_days) || 0;
          const remaining = Number(b.remaining_days) || 0;
          const percentage = Math.min((used / total) * 100, 100);

          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {leaveTypeLabels[b.leave_type_id] || 'إجازة'}
                </span>
                <span className="text-muted-foreground">
                  {remaining} / {total} يوم متبقي
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EmployeeLeaveWidget;

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, CalendarCheck, AlertTriangle, Timer, 
  Package, Bell, FileText, Briefcase 
} from 'lucide-react';
import type { EmployeeDashboardStats } from '@/hooks/useEmployeeDashboardData';

interface Props {
  stats: EmployeeDashboardStats;
  orgType?: string;
}

const EmployeeKPICards = ({ stats, orgType }: Props) => {
  const todayStatus = stats.todayAttendance?.status;
  const isCheckedIn = !!stats.todayAttendance?.check_in && !stats.todayAttendance?.check_out;

  const cards = [
    {
      icon: Clock,
      label: 'حالة اليوم',
      value: isCheckedIn ? 'حاضر' : todayStatus === 'present' ? 'انصرف' : 'لم يسجل',
      badge: isCheckedIn ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground',
      visible: true,
    },
    {
      icon: CalendarCheck,
      label: 'أيام الحضور (الشهر)',
      value: `${stats.monthAttendanceDays} يوم`,
      badge: '',
      visible: true,
    },
    {
      icon: AlertTriangle,
      label: 'أيام التأخير',
      value: `${stats.monthLateDays} يوم`,
      badge: stats.monthLateDays > 3 ? 'bg-destructive/10 text-destructive' : '',
      visible: true,
    },
    {
      icon: Timer,
      label: 'ساعات إضافية',
      value: `${stats.monthOvertimeHours.toFixed(1)} ساعة`,
      badge: '',
      visible: true,
    },
    {
      icon: Package,
      label: 'الشحنات',
      value: `${stats.myShipmentsCount}`,
      badge: stats.pendingShipmentsCount > 0 ? 'bg-amber-500/10 text-amber-600' : '',
      badgeText: stats.pendingShipmentsCount > 0 ? `${stats.pendingShipmentsCount} معلقة` : '',
      visible: ['generator', 'transporter', 'recycler', 'disposal', 'transport_office'].includes(orgType || ''),
    },
    {
      icon: Bell,
      label: 'إشعارات جديدة',
      value: `${stats.unreadNotifications}`,
      badge: stats.unreadNotifications > 0 ? 'bg-primary/10 text-primary' : '',
      visible: true,
    },
    {
      icon: FileText,
      label: 'طلبات إجازة معلقة',
      value: `${stats.pendingLeaveRequests}`,
      badge: '',
      visible: true,
    },
    {
      icon: Briefcase,
      label: 'نوع العقد',
      value: stats.contract?.contract_type === 'full_time' ? 'دوام كامل' 
        : stats.contract?.contract_type === 'part_time' ? 'دوام جزئي'
        : stats.contract?.contract_type || 'غير محدد',
      badge: '',
      visible: !!stats.contract,
    },
  ];

  const visibleCards = cards.filter(c => c.visible);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {visibleCards.map((card, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <card.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{card.value}</p>
              {card.badge && (card as any).badgeText && (
                <Badge className={`text-[10px] ${card.badge}`}>
                  {(card as any).badgeText}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeKPICards;

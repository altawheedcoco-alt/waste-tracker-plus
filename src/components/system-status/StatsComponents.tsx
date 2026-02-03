import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Building2,
  Truck,
  FileText,
  Users,
  Headphones,
  Star,
  FileCheck,
  Recycle,
  AlertTriangle,
} from 'lucide-react';
import { SystemStats } from '@/hooks/useSystemStats';

interface LiveStatsGridProps {
  stats: SystemStats | undefined;
  isLoading: boolean;
}

export const LiveStatsGrid = ({ stats, isLoading }: LiveStatsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsItems = [
    {
      label: 'إجمالي الشحنات',
      value: stats?.totalShipments || 0,
      subValue: `${stats?.confirmedShipments || 0} مكتملة`,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'الجهات المسجلة',
      value: stats?.totalOrganizations || 0,
      subValue: `${stats?.verifiedOrganizations || 0} موثقة`,
      icon: Building2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'السائقين',
      value: stats?.totalDrivers || 0,
      subValue: `${stats?.activeDrivers || 0} نشط`,
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'العقود',
      value: stats?.totalContracts || 0,
      subValue: `${stats?.activeContracts || 0} فعال`,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'المستخدمين',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'تذاكر الدعم',
      value: stats?.totalTickets || 0,
      subValue: `${stats?.openTickets || 0} مفتوحة`,
      icon: Headphones,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'تقييم الدعم',
      value: stats?.avgTicketRating || 0,
      subValue: 'من 5',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'الوثائق',
      value: stats?.totalDocuments || 0,
      subValue: `${stats?.pendingDocuments || 0} معلقة`,
      icon: FileCheck,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      label: 'شهادات التدوير',
      value: stats?.totalRecyclingReports || 0,
      icon: Recycle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'طلبات معلقة',
      value: stats?.pendingApprovals || 0,
      icon: AlertTriangle,
      color: stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'text-red-500' : 'text-gray-500',
      bgColor: stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'bg-red-500/10' : 'bg-gray-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {statsItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{item.value}</span>
                {item.subValue && (
                  <span className="text-xs text-muted-foreground">{item.subValue}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

interface OverallProgressCardProps {
  overallProgress: number;
  completedCount: number;
  inProgressCount: number;
  plannedCount: number;
  issuesCount: number;
}

export const OverallProgressCard = ({
  overallProgress,
  completedCount,
  inProgressCount,
  plannedCount,
  issuesCount,
}: OverallProgressCardProps) => (
  <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">نسبة اكتمال النظام</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl font-bold text-primary">{overallProgress}%</span>
        <div className="text-right text-sm text-muted-foreground">
          <p>أداء ممتاز! المنصة جاهزة للاستخدام الكامل</p>
        </div>
      </div>
      <Progress value={overallProgress} className="h-3 mb-4" />
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-green-500/10">
          <div className="font-bold text-green-600 text-lg">{completedCount}</div>
          <div className="text-muted-foreground">مكتملة</div>
        </div>
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <div className="font-bold text-yellow-600 text-lg">{inProgressCount}</div>
          <div className="text-muted-foreground">قيد التطوير</div>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10">
          <div className="font-bold text-blue-600 text-lg">{plannedCount}</div>
          <div className="text-muted-foreground">مخططة</div>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10">
          <div className="font-bold text-red-600 text-lg">{issuesCount}</div>
          <div className="text-muted-foreground">بها ملاحظات</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Truck, Users, Building2, LucideIcon, ChevronLeft, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { TransporterStats } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import InteractiveStatCard from '../shared/InteractiveStatCard';
import { DetailSection } from '../shared/InteractiveDetailDrawer';

interface TransporterStatsGridProps {
  stats: TransporterStats | undefined;
  isLoading: boolean;
  onStatClick?: (filter: string) => void;
}

const TransporterStatsGrid = ({ stats, isLoading, onStatClick }: TransporterStatsGridProps) => {
  const buildShipmentSections = (filterValue: string): DetailSection[] => {
    const total = stats?.total || 0;
    const active = stats?.active || 0;
    const completed = total - active;
    
    return [
      {
        id: 'breakdown',
        title: 'توزيع الشحنات',
        icon: TrendingUp,
        defaultOpen: true,
        content: (
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary">{active}</Badge>
              <span className="text-sm">نشطة</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary">{completed}</Badge>
              <span className="text-sm">مكتملة</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="outline">{total}</Badge>
              <span className="text-sm font-medium">الإجمالي</span>
            </div>
          </div>
        ),
      },
      {
        id: 'drivers',
        title: 'السائقون',
        icon: Users,
        badge: stats?.drivers || 0,
        content: (
          <div className="text-right text-sm text-muted-foreground">
            <p>{stats?.drivers || 0} سائق مسجل في النظام</p>
          </div>
        ),
      },
      {
        id: 'partners',
        title: 'الجهات المرتبطة',
        icon: Building2,
        badge: stats?.partnerCompanies || 0,
        link: '/dashboard/partners',
        content: (
          <div className="text-right text-sm text-muted-foreground">
            <p>{stats?.partnerCompanies || 0} شركة شريكة (مولدين ومدورين)</p>
          </div>
        ),
      },
    ];
  };

  const statCards = [
    {
      title: 'إجمالي الشحنات',
      value: stats?.total || 0,
      subtitle: 'جميع الشحنات',
      icon: FileText,
      filterValue: 'all',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'الشحنات النشطة',
      value: stats?.active || 0,
      subtitle: 'قيد التنفيذ حالياً',
      icon: Truck,
      filterValue: 'active',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'سائقي',
      value: stats?.drivers || 0,
      subtitle: 'سائقين مسجلين',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'الشركات الشريكة',
      value: stats?.partnerCompanies || 0,
      subtitle: 'مولدين ومدورين',
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {statCards.map((stat, index) => (
        <InteractiveStatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          bgColor={stat.bgColor}
          subtitle={stat.subtitle}
          delay={index * 0.1}
          onClick={stat.filterValue && onStatClick ? () => {
            onStatClick(stat.filterValue === 'active' ? 'in_transit' : stat.filterValue!);
          } : undefined}
          detailSections={!stat.filterValue ? buildShipmentSections('all') : undefined}
          detailTitle={stat.title}
          detailDescription={`تفاصيل ${stat.title}`}
        />
      ))}
    </div>
  );
};

export default TransporterStatsGrid;

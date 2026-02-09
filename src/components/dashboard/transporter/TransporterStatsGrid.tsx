import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Truck, Users, Building2, LucideIcon } from 'lucide-react';
import { TransporterStats } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardDef {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  filterValue?: string;
}

interface TransporterStatsGridProps {
  stats: TransporterStats | undefined;
  isLoading: boolean;
  onStatClick?: (filter: string) => void;
}

const TransporterStatsGrid = ({ stats, isLoading, onStatClick }: TransporterStatsGridProps) => {
  const statCards: StatCardDef[] = [
    { title: 'إجمالي الشحنات', value: stats?.total || 0, subtitle: 'جميع الشحنات', icon: FileText, filterValue: 'all' },
    { title: 'الشحنات النشطة', value: stats?.active || 0, subtitle: 'قيد التنفيذ حالياً', icon: Truck, filterValue: 'active' },
    { title: 'سائقي', value: stats?.drivers || 0, subtitle: 'سائقين مسجلين', icon: Users },
    { title: 'الشركات الشريكة', value: stats?.partnerCompanies || 0, subtitle: 'مولدين ومدورين', icon: Building2 },
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
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={stat.filterValue && onStatClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
            onClick={() => stat.filterValue && onStatClick?.(stat.filterValue)}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default TransporterStatsGrid;

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import InteractiveStatCard from './InteractiveStatCard';
import { DetailSection } from './InteractiveDetailDrawer';

export interface StatCardItem {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
  trend?: { value: number; label?: string };
  /** Detail sections for drill-down */
  detailSections?: DetailSection[];
  detailTitle?: string;
  detailDescription?: string;
  onClick?: () => void;
}

interface StatsCardsGridProps {
  stats: StatCardItem[];
  isLoading?: boolean;
}

const StatsCardsGrid = ({ stats, isLoading }: StatsCardsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-7 bg-muted rounded w-1/2" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <InteractiveStatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          bgColor={stat.bgColor}
          subtitle={stat.subtitle}
          trend={stat.trend}
          delay={0.1 + index * 0.05}
          detailSections={stat.detailSections}
          detailTitle={stat.detailTitle}
          detailDescription={stat.detailDescription}
          onClick={stat.onClick}
        />
      ))}
    </div>
  );
};

export default StatsCardsGrid;

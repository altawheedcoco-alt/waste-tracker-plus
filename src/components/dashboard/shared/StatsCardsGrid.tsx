import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export interface StatCardItem {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
  trend?: { value: number; label?: string };
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
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
        >
          <Card className="hover:shadow-md transition-all duration-300 group overflow-hidden relative">
            {/* Subtle gradient accent at top */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${stat.bgColor} opacity-60`} />
            <CardContent className="pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <AnimatedCounter
                      value={stat.value}
                      className="text-2xl font-bold tracking-tight"
                    />
                    {stat.subtitle && (
                      <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                    )}
                  </div>
                  {stat.trend && (
                    <p className={`text-xs mt-1 ${stat.trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.trend.value >= 0 ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                      {stat.trend.label && <span className="text-muted-foreground mr-1">{stat.trend.label}</span>}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCardsGrid;

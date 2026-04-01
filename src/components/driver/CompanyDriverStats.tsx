/**
 * بطاقة إحصائيات سريعة للسائق التابع — تظهر فوق المهام
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Truck, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyDriverStatsProps {
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  isAvailable: boolean;
  organizationName?: string;
}

const CompanyDriverStats = ({ rating, totalTrips, acceptanceRate, isAvailable }: CompanyDriverStatsProps) => {
  const stats = [
    { icon: Star, label: 'التقييم', value: rating > 0 ? rating.toFixed(1) : '—', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Truck, label: 'الرحلات', value: totalTrips.toString(), color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Target, label: 'الالتزام', value: acceptanceRate > 0 ? `${Math.round(acceptanceRate)}%` : '—', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Clock, label: 'الحالة', value: isAvailable ? 'متاح' : 'مشغول', color: isAvailable ? 'text-emerald-500' : 'text-muted-foreground', bg: isAvailable ? 'bg-emerald-500/10' : 'bg-muted/30' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="border-border/40">
            <CardContent className="p-2.5 text-center">
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <p className="text-sm font-bold leading-tight">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CompanyDriverStats;
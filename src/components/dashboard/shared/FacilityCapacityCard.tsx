import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface FacilityCapacityCardProps {
  facility: {
    current_fill_percentage?: number | null;
    total_capacity_tons?: number | null;
    daily_capacity_tons?: number | null;
    price_per_ton?: number | null;
    currency?: string | null;
    eeaa_rating?: string | null;
  };
}

const FacilityCapacityCard = ({ facility }: FacilityCapacityCardProps) => {
  const fillPercent = facility.current_fill_percentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${fillPercent > 80 ? 'text-red-500' : 'text-amber-500'}`} />
            السعة التشغيلية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>نسبة الامتلاء الحالية</span>
            <span className="font-bold">{fillPercent}%</span>
          </div>
          <Progress value={fillPercent} className="h-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">السعة الكلية:</span>
              <span className="font-medium mr-1">{facility.total_capacity_tons || '-'} طن</span>
            </div>
            <div>
              <span className="text-muted-foreground">السعة اليومية:</span>
              <span className="font-medium mr-1">{facility.daily_capacity_tons || '-'} طن</span>
            </div>
            <div>
              <span className="text-muted-foreground">سعر الطن:</span>
              <span className="font-medium mr-1">{facility.price_per_ton || '-'} {facility.currency}</span>
            </div>
            <div>
              <span className="text-muted-foreground">التقييم:</span>
              <span className="font-medium mr-1">{facility.eeaa_rating || '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacilityCapacityCard;

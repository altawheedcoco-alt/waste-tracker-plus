import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Truck, Clock, CheckCircle2, Fuel, 
  Route, Star, Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Shipment {
  id: string;
  status: string;
  quantity: number;
  waste_type: string;
  created_at: string;
  delivered_at: string | null;
  in_transit_at: string | null;
}

interface DriverDailySummaryProps {
  shipments: Shipment[];
  driverName: string;
}

const DriverDailySummary = ({ shipments, driverName }: DriverDailySummaryProps) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayShipments = shipments.filter(s => s.created_at?.startsWith(today));
    const deliveredToday = shipments.filter(s => s.delivered_at?.startsWith(today));
    const totalWeight = deliveredToday.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Calculate average delivery time
    const deliveryTimes = deliveredToday
      .filter(s => s.in_transit_at && s.delivered_at)
      .map(s => {
        const start = new Date(s.in_transit_at!).getTime();
        const end = new Date(s.delivered_at!).getTime();
        return (end - start) / (1000 * 60); // minutes
      });
    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

    // Simple performance score
    const totalCompleted = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const totalAll = shipments.length;
    const completionRate = totalAll > 0 ? (totalCompleted / totalAll) * 100 : 0;
    const performanceScore = Math.min(100, Math.round(completionRate * 0.7 + Math.min(30, deliveredToday.length * 10)));

    // تقدير المسافة بناءً على عدد الرحلات المكتملة (متوسط 35 كم/رحلة في المناطق الحضرية المصرية)
    const estimatedKm = deliveredToday.length * 35;
    const fuelSaved = Math.round(estimatedKm * 0.08);

    return {
      deliveredToday: deliveredToday.length,
      totalWeight,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      performanceScore,
      estimatedKm,
      fuelSaved,
      completionRate: Math.round(completionRate),
    };
  }, [shipments]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Greeting & Score */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{greeting} 👋</p>
              <h2 className="text-xl font-bold">{driverName}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{stats.performanceScore}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">نقاط الأداء</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">{stats.deliveredToday}</p>
            <p className="text-xs text-muted-foreground">تسليم اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{stats.totalWeight.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">طن منقول</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{stats.avgDeliveryTime}</p>
            <p className="text-xs text-muted-foreground">دقيقة متوسط</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.estimatedKm}</p>
            <p className="text-xs text-muted-foreground">كم مقطوعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      {stats.deliveredToday >= 3 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">إنجاز اليوم! 🏆</p>
                <p className="text-xs text-muted-foreground">
                  أكملت {stats.deliveredToday} رحلات - ممتاز!
                </p>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                <Star className="w-3 h-3 ml-1" />
                +{stats.deliveredToday * 10} نقطة
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default DriverDailySummary;

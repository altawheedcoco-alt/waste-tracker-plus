/**
 * تحليلات أداء السائق المستقل
 */
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, Star, Truck, TrendingUp, Clock,
  CheckCircle2, XCircle, Target, Award
} from 'lucide-react';
import { useDriverType } from '@/hooks/useDriverType';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <Card className="rounded-xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold text-lg">{value}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const DriverAnalytics = () => {
  const { driverProfile } = useDriverType();

  const stats = {
    totalTrips: driverProfile?.total_trips || 0,
    rating: driverProfile?.rating || 0,
    acceptanceRate: driverProfile?.acceptance_rate || 0,
    rejectionCount: driverProfile?.rejection_count || 0,
    serviceArea: driverProfile?.service_area_km || 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            تحليلات الأداء
          </h1>
        </div>

        {/* Rating Hero */}
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Star className="w-10 h-10 text-primary fill-primary" />
            </div>
            <p className="text-4xl font-bold text-primary mb-1">{stats.rating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">تقييمك العام</p>
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(stats.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Truck}
            label="إجمالي الرحلات"
            value={stats.totalTrips}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
            delay={0.05}
          />
          <StatCard
            icon={Target}
            label="نطاق الخدمة"
            value={`${stats.serviceArea} كم`}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
            delay={0.1}
          />
          <StatCard
            icon={CheckCircle2}
            label="نسبة القبول"
            value={`${stats.acceptanceRate}%`}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
            delay={0.15}
          />
          <StatCard
            icon={XCircle}
            label="مرات الرفض"
            value={stats.rejectionCount}
            color="bg-red-100 dark:bg-red-900/30 text-red-600"
            delay={0.2}
          />
        </div>

        {/* Performance Bars */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              مؤشرات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span>نسبة القبول</span>
                <span className="font-bold">{stats.acceptanceRate}%</span>
              </div>
              <Progress value={stats.acceptanceRate} className="h-2.5 rounded-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span>التقييم</span>
                <span className="font-bold">{((stats.rating / 5) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(stats.rating / 5) * 100} className="h-2.5 rounded-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span>الالتزام بالمواعيد</span>
                <span className="font-bold">--</span>
              </div>
              <Progress value={0} className="h-2.5 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              نصائح لتحسين أدائك
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• حافظ على نسبة قبول أعلى من 80%</li>
              <li>• التزم بمواعيد التسليم المحددة</li>
              <li>• وسّع نطاق خدمتك لاستقبال عروض أكثر</li>
              <li>• حافظ على تقييم 4.5+ من العملاء</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DriverAnalytics;

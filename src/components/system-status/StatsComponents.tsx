import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
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

// Animated counter component
const AnimatedValue = ({ value, duration = 1.2 }: { value: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
    });
    const unsub = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return () => { controls.stop(); unsub(); };
  }, [value, duration, motionVal, rounded]);

  return <span ref={ref}>0</span>;
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

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
    { label: 'إجمالي الشحنات', value: stats?.totalShipments || 0, subValue: `${stats?.confirmedShipments || 0} مكتملة`, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'الجهات المسجلة', value: stats?.totalOrganizations || 0, subValue: `${stats?.verifiedOrganizations || 0} موثقة`, icon: Building2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { label: 'السائقين', value: stats?.totalDrivers || 0, subValue: `${stats?.activeDrivers || 0} نشط`, icon: Truck, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { label: 'العقود', value: stats?.totalContracts || 0, subValue: `${stats?.activeContracts || 0} فعال`, icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { label: 'المستخدمين', value: stats?.totalUsers || 0, icon: Users, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { label: 'تذاكر الدعم', value: stats?.totalTickets || 0, subValue: `${stats?.openTickets || 0} مفتوحة`, icon: Headphones, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { label: 'تقييم الدعم', value: stats?.avgTicketRating || 0, subValue: 'من 5', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    { label: 'الوثائق', value: stats?.totalDocuments || 0, subValue: `${stats?.pendingDocuments || 0} معلقة`, icon: FileCheck, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { label: 'شهادات التدوير', value: stats?.totalRecyclingReports || 0, icon: Recycle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'طلبات معلقة', value: stats?.pendingApprovals || 0, icon: AlertTriangle, color: stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'text-red-500' : 'text-gray-500', bgColor: stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'bg-red-500/10' : 'bg-gray-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {statsItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    className={`p-1.5 rounded-lg ${item.bgColor}`}
                    initial={{ rotate: -15, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: idx * 0.06 + 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </motion.div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    <AnimatedValue value={item.value} />
                  </span>
                  {item.subValue && (
                    <motion.span
                      className="text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.06 + 0.6 }}
                    >
                      {item.subValue}
                    </motion.span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
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

const counterBoxVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 12 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: 0.4 + i * 0.1, type: 'spring' as const, stiffness: 180, damping: 14 },
  }),
};

export const OverallProgressCard = ({
  overallProgress,
  completedCount,
  inProgressCount,
  plannedCount,
  issuesCount,
}: OverallProgressCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">نسبة اكتمال النظام</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <motion.span
            className="text-4xl font-bold text-primary"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
          >
            <AnimatedValue value={overallProgress} />%
          </motion.span>
          <motion.div
            className="text-right text-sm text-muted-foreground"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p>أداء ممتاز! المنصة جاهزة للاستخدام الكامل</p>
          </motion.div>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'right' }}
        >
          <Progress value={overallProgress} className="h-3 mb-4" />
        </motion.div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { value: completedCount, label: 'مكتملة', bg: 'bg-green-500/10', color: 'text-green-600' },
            { value: inProgressCount, label: 'قيد التطوير', bg: 'bg-yellow-500/10', color: 'text-yellow-600' },
            { value: plannedCount, label: 'مخططة', bg: 'bg-blue-500/10', color: 'text-blue-600' },
            { value: issuesCount, label: 'بها ملاحظات', bg: 'bg-red-500/10', color: 'text-red-600' },
          ].map((item, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={counterBoxVariants}
              initial="hidden"
              animate="visible"
              className={`p-2 rounded-lg ${item.bg}`}
              whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
            >
              <div className={`font-bold ${item.color} text-lg`}>
                <AnimatedValue value={item.value} duration={0.8} />
              </div>
              <div className="text-muted-foreground">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  ShieldAlert, 
  BarChart3, 
  DollarSign, 
  Layers 
} from 'lucide-react';

const AnomalyDetectorPanel = lazy(() => import('./AnomalyDetectorPanel'));
const DemandForecastPanel = lazy(() => import('./DemandForecastPanel'));
const PriceOptimizerPanel = lazy(() => import('./PriceOptimizerPanel'));
const CapacityPlannerPanel = lazy(() => import('./CapacityPlannerPanel'));

const LoadingFallback = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </CardContent>
  </Card>
);

const AdvancedAIDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">التحليلات الذكية المتقدمة</h2>
            <p className="text-sm text-muted-foreground">
              أدوات ذكاء اصطناعي متقدمة للتحليلات التنبؤية واتخاذ القرار
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="anomaly" className="w-full" dir="rtl">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="anomaly" className="flex items-center gap-2 text-xs md:text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">كشف الشذوذ</span>
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2 text-xs md:text-sm">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">توقع الطلب</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2 text-xs md:text-sm">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">تحسين الأسعار</span>
          </TabsTrigger>
          <TabsTrigger value="capacity" className="flex items-center gap-2 text-xs md:text-sm">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">تخطيط السعة</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomaly" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <AnomalyDetectorPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="demand" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <DemandForecastPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <PriceOptimizerPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="capacity" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <CapacityPlannerPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAIDashboard;

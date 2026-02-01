import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Recycle, BarChart3, Lightbulb, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import RecyclerWasteAnalytics from '@/components/ai/recycler/RecyclerWasteAnalytics';
import RecyclerDetailedAnalytics from '@/components/ai/recycler/RecyclerDetailedAnalytics';
import RecyclerPerformanceAdvisor from '@/components/ai/recycler/RecyclerPerformanceAdvisor';

const RecyclerAITools = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold">أدوات تحليل التدوير</h1>
              <p className="text-muted-foreground text-sm">تحليلات متقدمة لأداء منشأة التدوير</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>إحصائيات المعالجة</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>تحليل تفصيلي</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2 text-xs md:text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>توصيات الأداء</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <RecyclerWasteAnalytics />
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <RecyclerDetailedAnalytics />
          </TabsContent>

          <TabsContent value="advisor" className="mt-6">
            <RecyclerPerformanceAdvisor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RecyclerAITools;

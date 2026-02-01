import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, BarChart3, Lightbulb, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import WasteAnalytics from '@/components/ai/WasteAnalytics';
import WasteReductionAdvisor from '@/components/ai/WasteReductionAdvisor';
import WasteTypeDetailedAnalytics from '@/components/ai/WasteTypeDetailedAnalytics';
import { useDisplayMode } from '@/hooks/useDisplayMode';

const AITools = () => {
  const { isMobile } = useDisplayMode();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-eco flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold">أدوات تحليل المخلفات</h1>
              <p className="text-muted-foreground text-sm">أدوات ذكية لتحليل وإدارة مخلفات منشأتك</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <TabsList className={`grid grid-cols-3 w-full max-w-2xl`}>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>تحليل تفصيلي</span>
            </TabsTrigger>
            <TabsTrigger value="reduction" className="flex items-center gap-2 text-xs md:text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>توصيات الحد</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <WasteAnalytics />
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <WasteTypeDetailedAnalytics />
          </TabsContent>

          <TabsContent value="reduction" className="mt-6">
            <WasteReductionAdvisor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AITools;

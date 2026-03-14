import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Recycle, BarChart3, Lightbulb, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import RecyclerWasteAnalytics from '@/components/ai/recycler/RecyclerWasteAnalytics';
import RecyclerDetailedAnalytics from '@/components/ai/recycler/RecyclerDetailedAnalytics';
import RecyclerPerformanceAdvisor from '@/components/ai/recycler/RecyclerPerformanceAdvisor';
import { useLanguage } from '@/contexts/LanguageContext';

const RecyclerAITools = () => {
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <div className="space-y-4 p-3 md:p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
              <Recycle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-right min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">{t('recyclerAI.title')}</h1>
              <p className="text-muted-foreground text-[11px] sm:text-sm truncate">{t('recyclerAI.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                {t('recyclerAI.processingStats')}
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {t('recyclerAI.detailedAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                {t('recyclerAI.performanceRecs')}
              </TabsTrigger>
            </TabsList>
          </div>

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

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, BarChart3, Lightbulb, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import TransporterAnalytics from '@/components/ai/transporter/TransporterAnalytics';
import TransporterDetailedAnalytics from '@/components/ai/transporter/TransporterDetailedAnalytics';
import TransporterPerformanceAdvisor from '@/components/ai/transporter/TransporterPerformanceAdvisor';
import { useLanguage } from '@/contexts/LanguageContext';

const TransporterAITools = () => {
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
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-right min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">{t('transporterAI.title')}</h1>
              <p className="text-muted-foreground text-[11px] sm:text-sm truncate">{t('transporterAI.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                {t('transporterAI.transportStats')}
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {t('transporterAI.detailedAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="advisor" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                {t('transporterAI.performanceRecs')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analytics" className="mt-6">
            <TransporterAnalytics />
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <TransporterDetailedAnalytics />
          </TabsContent>

          <TabsContent value="advisor" className="mt-6">
            <TransporterPerformanceAdvisor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TransporterAITools;

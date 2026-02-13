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
      <div className="space-y-6 p-4 md:p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold">{t('transporterAI.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('transporterAI.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="analytics" className="w-full" dir="rtl">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>{t('transporterAI.transportStats')}</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>{t('transporterAI.detailedAnalysis')}</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2 text-xs md:text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>{t('transporterAI.performanceRecs')}</span>
            </TabsTrigger>
          </TabsList>

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

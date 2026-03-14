import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, BarChart3, Lightbulb, CalendarDays, Brain, FileText, Sparkles, Heart, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import WasteAnalytics from '@/components/ai/WasteAnalytics';
import WasteReductionAdvisor from '@/components/ai/WasteReductionAdvisor';
import WasteTypeDetailedAnalytics from '@/components/ai/WasteTypeDetailedAnalytics';
import AIInsightsDashboard from '@/components/ai/AIInsightsDashboard';
import SmartDocumentUpload from '@/components/ai/SmartDocumentUpload';
import AdvancedAIDashboard from '@/components/ai/AdvancedAIDashboard';
import SentimentAnalysisPanel from '@/components/ai/SentimentAnalysisPanel';
import SmartPredictionsPanel from '@/components/ai/SmartPredictionsPanel';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const AITools = () => {
  const { isMobile } = useDisplayMode();
  const { t } = useLanguage();

  const handleDocumentClassified = (result: any, file: File) => {
    toast.success(`${t('aiTools.docClassified')}: ${result.document_type}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-3 md:p-6">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl gradient-eco flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="text-right min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">{t('aiTools.title')}</h1>
              <p className="text-muted-foreground text-[11px] sm:text-sm truncate">{t('aiTools.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="advanced" className="w-full" dir="rtl">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
            <TabsList className="inline-flex w-max gap-0.5 h-auto p-1">
              <TabsTrigger value="advanced" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.advanced')}
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Heart className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.sentiment')}
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.predictions')}
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Brain className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.insights')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.documents')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.analytics')}
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.detailed')}
              </TabsTrigger>
              <TabsTrigger value="reduction" className="flex items-center gap-1.5 text-[10px] sm:text-sm px-2.5 py-1.5 whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                {t('aiTools.reduction')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="advanced" className="mt-6">
            <AdvancedAIDashboard />
          </TabsContent>

          <TabsContent value="sentiment" className="mt-6">
            <SentimentAnalysisPanel />
          </TabsContent>

          <TabsContent value="predictions" className="mt-6">
            <SmartPredictionsPanel />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <AIInsightsDashboard />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="max-w-2xl">
              <SmartDocumentUpload onClassified={handleDocumentClassified} />
            </div>
          </TabsContent>

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

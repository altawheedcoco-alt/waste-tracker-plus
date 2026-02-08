import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, BarChart3, Lightbulb, CalendarDays, Brain, FileText, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import WasteAnalytics from '@/components/ai/WasteAnalytics';
import WasteReductionAdvisor from '@/components/ai/WasteReductionAdvisor';
import WasteTypeDetailedAnalytics from '@/components/ai/WasteTypeDetailedAnalytics';
import AIInsightsDashboard from '@/components/ai/AIInsightsDashboard';
import SmartDocumentUpload from '@/components/ai/SmartDocumentUpload';
import AdvancedAIDashboard from '@/components/ai/AdvancedAIDashboard';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { toast } from 'sonner';

const AITools = () => {
  const { isMobile } = useDisplayMode();

  const handleDocumentClassified = (result: any, file: File) => {
    toast.success(`تم تصنيف المستند: ${result.document_type}`);
  };

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
              <h1 className="text-xl md:text-2xl font-bold">أدوات الذكاء الاصطناعي</h1>
              <p className="text-muted-foreground text-sm">أدوات ذكية لتحليل وإدارة مخلفات منشأتك</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="advanced" className="w-full" dir="rtl">
          <TabsList className={`grid grid-cols-6 w-full max-w-4xl`}>
            <TabsTrigger value="advanced" className="flex items-center gap-2 text-xs md:text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">تحليلات متقدمة</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2 text-xs md:text-sm">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">رؤى ذكية</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 text-xs md:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">تصنيف المستندات</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">تحليل تفصيلي</span>
            </TabsTrigger>
            <TabsTrigger value="reduction" className="flex items-center gap-2 text-xs md:text-sm">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">توصيات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advanced" className="mt-6">
            <AdvancedAIDashboard />
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

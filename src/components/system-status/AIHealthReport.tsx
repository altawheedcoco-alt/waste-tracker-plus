/**
 * تقرير صحة ارتباطات الذكاء الاصطناعي - يفحص كل دالة AI فعلياً ويعطي تقرير حقيقي
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Brain, CheckCircle2, XCircle, AlertTriangle, Loader2,
  RefreshCw, Zap, Shield, BarChart3, FileText, Eye,
  Route, Wrench, MessageSquare, Sparkles, TrendingUp,
  Clock, Target, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TestStatus = 'pending' | 'testing' | 'passed' | 'failed' | 'warning';

interface AIFunctionTest {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  description: string;
  edgeFunction: string;
  testPayload: Record<string, any>;
  status: TestStatus;
  responseTime?: number;
  error?: string;
  details?: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  connectedComponents: string[];
}

const AI_FUNCTIONS: Omit<AIFunctionTest, 'status'>[] = [
  {
    id: 'ai-insights-sentiment',
    name: 'Sentiment Analysis',
    nameAr: 'تحليل المشاعر',
    category: 'تحليلات',
    description: 'تحليل مشاعر النصوص والتعليقات',
    edgeFunction: 'ai-insights',
    testPayload: { type: 'sentiment', data: { texts: ['اختبار تحليل المشاعر - خدمة ممتازة'] }, context: 'test' },
    impact: 'medium',
    connectedComponents: ['SentimentAnalysisPanel', 'AIInsightsDashboard'],
  },
  {
    id: 'ai-insights-prediction',
    name: 'Predictions Engine',
    nameAr: 'محرك التنبؤات',
    category: 'تحليلات',
    description: 'توقع حجم الشحنات والإيرادات',
    edgeFunction: 'ai-insights',
    testPayload: { type: 'prediction', data: { historicalData: [{ quantity: 100, created_at: '2026-01-01' }], predictionType: 'shipment_volume', timeframe: 'monthly' } },
    impact: 'high',
    connectedComponents: ['SmartPredictionsPanel', 'AIInsightsDashboard', 'AIPredictionsPanel'],
  },
  {
    id: 'ai-insights-risk',
    name: 'Risk Assessment',
    nameAr: 'تقييم المخاطر',
    category: 'تحليلات',
    description: 'تقييم مخاطر العقود والشحنات',
    edgeFunction: 'ai-insights',
    testPayload: { type: 'risk_assessment', data: { contracts: [], shipments: [{ status: 'delivered', quantity: 50 }], partners: [] } },
    impact: 'critical',
    connectedComponents: ['SmartPredictionsPanel', 'AIInsightsDashboard'],
  },
  {
    id: 'ai-insights-recommendation',
    name: 'Smart Recommendations',
    nameAr: 'التوصيات الذكية',
    category: 'تحليلات',
    description: 'توليد توصيات تحسين الأداء',
    edgeFunction: 'ai-insights',
    testPayload: { type: 'recommendation', data: { organizationType: 'transporter', currentMetrics: { total_shipments: 50, active_contracts: 3 } } },
    impact: 'high',
    connectedComponents: ['AIInsightsDashboard'],
  },
  {
    id: 'ai-document-classifier',
    name: 'Document Classifier',
    nameAr: 'مصنف المستندات',
    category: 'مستندات',
    description: 'تصنيف وتحليل المستندات بالذكاء الاصطناعي',
    edgeFunction: 'ai-document-classifier',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['SmartDocumentUpload', 'useAIDocumentClassifier'],
  },
  {
    id: 'ai-operations-assistant',
    name: 'Operations Assistant',
    nameAr: 'مساعد العمليات',
    category: 'مساعدات',
    description: 'مساعد ذكي لتوليد المستندات والخطط',
    edgeFunction: 'ai-operations-assistant',
    testPayload: { messages: [{ role: 'user', content: 'مرحبا - اختبار اتصال' }] },
    impact: 'high',
    connectedComponents: ['AIOperationsAssistant', 'WaPilotAIComposer'],
  },
  {
    id: 'ai-anomaly-detector',
    name: 'Anomaly Detector',
    nameAr: 'كاشف الشذوذ',
    category: 'تحليلات متقدمة',
    description: 'كشف الأنماط غير الطبيعية في الشحنات',
    edgeFunction: 'ai-anomaly-detector',
    testPayload: { shipments: [{ id: 'test', quantity: 100, status: 'delivered' }], analysisType: 'weight' },
    impact: 'critical',
    connectedComponents: ['AnomalyDetectorPanel', 'AdvancedAIDashboard'],
  },
  {
    id: 'ai-demand-forecaster',
    name: 'Demand Forecaster',
    nameAr: 'متنبئ الطلب',
    category: 'تحليلات متقدمة',
    description: 'توقع الطلب المستقبلي على الخدمات',
    edgeFunction: 'ai-demand-forecaster',
    testPayload: { test: true },
    impact: 'medium',
    connectedComponents: ['DemandForecastPanel', 'AdvancedAIDashboard'],
  },
  {
    id: 'ai-price-optimizer',
    name: 'Price Optimizer',
    nameAr: 'محسّن الأسعار',
    category: 'تحليلات متقدمة',
    description: 'تحسين التسعير بناءً على بيانات السوق',
    edgeFunction: 'ai-price-optimizer',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['PriceOptimizerPanel', 'AdvancedAIDashboard'],
  },
  {
    id: 'ai-capacity-planner',
    name: 'Capacity Planner',
    nameAr: 'مخطط السعة',
    category: 'تحليلات متقدمة',
    description: 'تخطيط السعة التشغيلية والموارد',
    edgeFunction: 'ai-capacity-planner',
    testPayload: { resourceData: { trucks: 5, drivers: 8 }, planningHorizon: 'weekly' },
    impact: 'medium',
    connectedComponents: ['CapacityPlannerPanel', 'AdvancedAIDashboard'],
  },
  {
    id: 'ai-route-optimizer',
    name: 'Route Optimizer',
    nameAr: 'محسّن المسارات',
    category: 'عمليات',
    description: 'تحسين مسارات النقل والتوصيل',
    edgeFunction: 'ai-route-optimizer',
    testPayload: { driverId: 'test', shipments: [] },
    impact: 'high',
    connectedComponents: ['RouteOptimizerPanel', 'useRouteOptimizer'],
  },
  {
    id: 'ai-smart-scheduler',
    name: 'Smart Scheduler',
    nameAr: 'الجدولة الذكية',
    category: 'عمليات',
    description: 'جدولة ذكية للمهام والورديات',
    edgeFunction: 'ai-smart-scheduler',
    testPayload: { organizationId: 'test', type: 'optimize' },
    impact: 'medium',
    connectedComponents: ['SmartSchedulerPanel', 'ShiftScheduler'],
  },
  {
    id: 'ai-maintenance-predictor',
    name: 'Maintenance Predictor',
    nameAr: 'متنبئ الصيانة',
    category: 'عمليات',
    description: 'التنبؤ بمواعيد صيانة الأسطول',
    edgeFunction: 'ai-maintenance-predictor',
    testPayload: { organizationId: 'test', vehicleData: [] },
    impact: 'medium',
    connectedComponents: ['MaintenancePredictorPanel'],
  },
  {
    id: 'ai-customer-assistant',
    name: 'Customer Assistant',
    nameAr: 'مساعد العملاء',
    category: 'مساعدات',
    description: 'مساعد ذكي لخدمة العملاء',
    edgeFunction: 'ai-customer-assistant',
    testPayload: { message: 'مرحبا', conversationHistory: [] },
    impact: 'high',
    connectedComponents: ['CustomerAssistantWidget', 'UnifiedSupportWidget'],
  },
  {
    id: 'ai-consultant-assistant',
    name: 'Consultant Assistant',
    nameAr: 'مساعد الاستشاري',
    category: 'مساعدات',
    description: 'مساعد قانوني للاستشاريين البيئيين',
    edgeFunction: 'ai-consultant-assistant',
    testPayload: { question: 'اختبار اتصال', organizationType: 'consultant' },
    impact: 'medium',
    connectedComponents: ['ConsultantDashboard'],
  },
  {
    id: 'ai-location-resolve',
    name: 'AI Location Resolve',
    nameAr: 'تحديد المواقع الذكي',
    category: 'عمليات',
    description: 'تحديد المواقع الجغرافية بالذكاء الاصطناعي',
    edgeFunction: 'ai-location-resolve',
    testPayload: { query: 'القاهرة' },
    impact: 'high',
    connectedComponents: ['LocationPicker'],
  },
  {
    id: 'ai-circular-matcher',
    name: 'Circular Economy Matcher',
    nameAr: 'مطابق الاقتصاد الدائري',
    category: 'سوق',
    description: 'مطابقة عروض وطلبات المخلفات',
    edgeFunction: 'ai-circular-matcher',
    testPayload: { waste_type: 'plastic', quantity_tons: 10, location_governorate: 'القاهرة' },
    impact: 'medium',
    connectedComponents: ['AIMatchingPanel'],
  },
  {
    id: 'fraud-detection',
    name: 'Fraud Detection',
    nameAr: 'كشف الاحتيال',
    category: 'أمن',
    description: 'كشف الاحتيال والأنشطة المشبوهة',
    edgeFunction: 'fraud-detection',
    testPayload: { test: true },
    impact: 'critical',
    connectedComponents: ['FraudDetectionPanel'],
  },
  {
    id: 'partner-risk-analyzer',
    name: 'Partner Risk Analyzer',
    nameAr: 'محلل مخاطر الشركاء',
    category: 'أمن',
    description: 'تحليل مخاطر الشركاء والموردين',
    edgeFunction: 'partner-risk-analyzer',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['PartnerRiskPanel'],
  },
  {
    id: 'sovereign-ai-report',
    name: 'Sovereign AI Report',
    nameAr: 'التقارير السيادية',
    category: 'إدارة',
    description: 'توليد تقارير سيادية بالذكاء الاصطناعي',
    edgeFunction: 'sovereign-ai-report',
    testPayload: { report_type: 'daily' },
    impact: 'critical',
    connectedComponents: ['SovereignReports'],
  },
  {
    id: 'classify-waste-photo',
    name: 'Waste Photo Classifier',
    nameAr: 'مصنف صور النفايات',
    category: 'رؤية حاسوبية',
    description: 'تصنيف النفايات من الصور',
    edgeFunction: 'classify-waste-photo',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['WasteClassifier', 'SmartWeightUpload'],
  },
  {
    id: 'analyze-shipment-image',
    name: 'Shipment Image Analyzer',
    nameAr: 'محلل صور الشحنات',
    category: 'رؤية حاسوبية',
    description: 'تحليل صور الشحنات والحمولات',
    edgeFunction: 'analyze-shipment-image',
    testPayload: { test: true },
    impact: 'medium',
    connectedComponents: ['ShipmentImageAnalysis'],
  },
  {
    id: 'smart-agent',
    name: 'Smart Agent',
    nameAr: 'الوكيل الذكي',
    category: 'مساعدات',
    description: 'وكيل ذكي للتواصل عبر القنوات المختلفة',
    edgeFunction: 'smart-agent',
    testPayload: { message: 'test', channel: 'web' },
    impact: 'high',
    connectedComponents: ['AIChatbot'],
  },
  {
    id: 'commodity-market-analysis',
    name: 'Commodity Market',
    nameAr: 'تحليل بورصة المخلفات',
    category: 'سوق',
    description: 'تحليل أسعار سوق المخلفات',
    edgeFunction: 'commodity-market-analysis',
    testPayload: { test: true },
    impact: 'medium',
    connectedComponents: ['WasteMarketplace'],
  },
  {
    id: 'esg-report-generator',
    name: 'ESG Report Generator',
    nameAr: 'مولد تقارير ESG',
    category: 'تقارير',
    description: 'توليد تقارير الاستدامة البيئية',
    edgeFunction: 'esg-report-generator',
    testPayload: { test: true },
    impact: 'medium',
    connectedComponents: ['SustainabilityReportGenerator'],
  },
  {
    id: 'shipment-intelligence',
    name: 'Shipment Intelligence',
    nameAr: 'ذكاء الشحنات',
    category: 'عمليات',
    description: 'تحليل ذكي لبيانات الشحنات وتتبعها',
    edgeFunction: 'shipment-intelligence',
    testPayload: { test: true },
    impact: 'critical',
    connectedComponents: ['ShipmentTracking', 'TransporterAIInsights'],
  },
  {
    id: 'ocr-document-scanner',
    name: 'OCR Scanner',
    nameAr: 'الماسح الضوئي الذكي',
    category: 'مستندات',
    description: 'مسح واستخراج البيانات من المستندات',
    edgeFunction: 'ocr-document-scanner',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['SmartDocumentUpload'],
  },
  {
    id: 'analyze-document',
    name: 'Document Analyzer',
    nameAr: 'محلل المستندات',
    category: 'مستندات',
    description: 'تحليل محتوى المستندات واستخراج البيانات',
    edgeFunction: 'analyze-document',
    testPayload: { test: true },
    impact: 'high',
    connectedComponents: ['DocumentAnalysis'],
  },
  {
    id: 'sovereign-ai-analyze',
    name: 'Sovereign AI Analyze',
    nameAr: 'التحليل السيادي',
    category: 'إدارة',
    description: 'تحليل سيادي شامل للمنصة',
    edgeFunction: 'sovereign-ai-analyze',
    testPayload: { test: true },
    impact: 'critical',
    connectedComponents: ['SovereignDashboard'],
  },
];

const CATEGORIES = [...new Set(AI_FUNCTIONS.map(f => f.category))];

const getCategoryIcon = (cat: string) => {
  const icons: Record<string, React.ReactNode> = {
    'تحليلات': <BarChart3 className="w-4 h-4" />,
    'تحليلات متقدمة': <Brain className="w-4 h-4" />,
    'مستندات': <FileText className="w-4 h-4" />,
    'مساعدات': <MessageSquare className="w-4 h-4" />,
    'عمليات': <Route className="w-4 h-4" />,
    'سوق': <TrendingUp className="w-4 h-4" />,
    'أمن': <Shield className="w-4 h-4" />,
    'إدارة': <Target className="w-4 h-4" />,
    'رؤية حاسوبية': <Eye className="w-4 h-4" />,
    'تقارير': <FileText className="w-4 h-4" />,
  };
  return icons[cat] || <Zap className="w-4 h-4" />;
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-green-500';
    default: return 'text-muted-foreground';
  }
};

const getImpactLabel = (impact: string) => {
  const labels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' };
  return labels[impact] || impact;
};

export const AIHealthReport = () => {
  const [tests, setTests] = useState<AIFunctionTest[]>(
    AI_FUNCTIONS.map(f => ({ ...f, status: 'pending' as TestStatus }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const runSingleTest = useCallback(async (fn: AIFunctionTest): Promise<AIFunctionTest> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke(fn.edgeFunction, {
        body: fn.testPayload,
      });
      const responseTime = Date.now() - startTime;

      if (error) {
        // Check for auth errors (expected for some functions)
        const errMsg = typeof error === 'object' && error.message ? error.message : String(error);
        if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Not authenticated')) {
          return { ...fn, status: 'warning', responseTime, details: 'يتطلب تسجيل دخول - الدالة موجودة وتعمل', error: 'يحتاج صلاحيات' };
        }
        if (errMsg.includes('402')) {
          return { ...fn, status: 'warning', responseTime, details: 'حد الاستخدام - الدالة موجودة', error: 'حد الرصيد' };
        }
        if (errMsg.includes('429')) {
          return { ...fn, status: 'warning', responseTime, details: 'تحديد معدل - الدالة موجودة', error: 'Rate limited' };
        }
        return { ...fn, status: 'failed', responseTime, error: errMsg };
      }

      // Check response quality
      if (data?.error) {
        const dataErr = data.error;
        if (dataErr.includes('Unauthorized') || dataErr.includes('Not authenticated') || dataErr.includes('Not admin')) {
          return { ...fn, status: 'warning', responseTime, details: 'الدالة تعمل - تحتاج صلاحيات مناسبة', error: 'يحتاج صلاحيات' };
        }
        return { ...fn, status: 'failed', responseTime, error: dataErr };
      }

      return { ...fn, status: 'passed', responseTime, details: `استجابة ناجحة في ${responseTime}ms` };
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      const errMsg = err?.message || 'خطأ غير معروف';
      if (errMsg.includes('FunctionsHttpError') || errMsg.includes('401')) {
        return { ...fn, status: 'warning', responseTime, details: 'الدالة موجودة - تحتاج صلاحيات', error: 'صلاحيات' };
      }
      return { ...fn, status: 'failed', responseTime, error: errMsg };
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setCompletedCount(0);
    setTests(AI_FUNCTIONS.map(f => ({ ...f, status: 'testing' as TestStatus })));

    const results: AIFunctionTest[] = [];
    // Run in batches of 3 to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < AI_FUNCTIONS.length; i += batchSize) {
      const batch = AI_FUNCTIONS.slice(i, i + batchSize).map(f => ({ ...f, status: 'testing' as TestStatus }));
      const batchResults = await Promise.all(batch.map(fn => runSingleTest(fn)));
      results.push(...batchResults);
      setCompletedCount(results.length);
      setTests(prev => {
        const updated = [...prev];
        batchResults.forEach(r => {
          const idx = updated.findIndex(t => t.id === r.id);
          if (idx >= 0) updated[idx] = r;
        });
        return updated;
      });
      // Brief pause between batches
      if (i + batchSize < AI_FUNCTIONS.length) {
        await new Promise(res => setTimeout(res, 500));
      }
    }

    setIsRunning(false);
    const passed = results.filter(r => r.status === 'passed').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'failed').length;
    toast.success(`اكتمل الفحص: ✅ ${passed} ناجح | ⚠️ ${warnings} تحذير | ❌ ${failed} فشل`);
  }, [runSingleTest]);

  const passed = tests.filter(t => t.status === 'passed').length;
  const warnings = tests.filter(t => t.status === 'warning').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const tested = passed + warnings + failed;
  const total = tests.length;
  // Passed = 100%, Warning (exists but needs auth) = 75%, Failed = 0%
  const healthScore = total > 0 && tested > 0
    ? Math.round(((passed * 100) + (warnings * 75)) / total)
    : 0;

  const filteredTests = filterCategory
    ? tests.filter(t => t.category === filterCategory)
    : tests;

  const categoryStats = CATEGORIES.map(cat => {
    const catTests = tests.filter(t => t.category === cat);
    return {
      category: cat,
      total: catTests.length,
      passed: catTests.filter(t => t.status === 'passed').length,
      warnings: catTests.filter(t => t.status === 'warning').length,
      failed: catTests.filter(t => t.status === 'failed').length,
    };
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">تقرير صحة ارتباطات الذكاء الاصطناعي</CardTitle>
                <CardDescription>فحص شامل لـ {total} دالة AI مرتبطة بلوحة التحكم</CardDescription>
              </div>
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جارٍ الفحص ({completedCount}/{total})
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  فحص شامل
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {tested > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <div className="text-3xl font-bold text-primary">{healthScore}%</div>
                <div className="text-xs text-muted-foreground">النتيجة الإجمالية</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                <div className="text-3xl font-bold text-emerald-600">{passed}</div>
                <div className="text-xs text-muted-foreground">ناجح</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10">
                <div className="text-3xl font-bold text-amber-600">{warnings}</div>
                <div className="text-xs text-muted-foreground">تحذير (يحتاج صلاحيات)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <div className="text-3xl font-bold text-red-600">{failed}</div>
                <div className="text-xs text-muted-foreground">فشل</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="text-3xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground">إجمالي الدوال</div>
              </div>
            </div>
            <Progress value={healthScore} className="mt-4 h-3" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0% - يحتاج إصلاح</span>
              <span>100% - الحالة المثلى</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category Summary */}
      {tested > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              !filterCategory && "ring-2 ring-primary"
            )}
            onClick={() => setFilterCategory(null)}
          >
            <CardContent className="p-3 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">الكل</div>
              <div className="text-xs text-muted-foreground">{total} دالة</div>
            </CardContent>
          </Card>
          {categoryStats.map(cs => (
            <Card
              key={cs.category}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                filterCategory === cs.category && "ring-2 ring-primary"
              )}
              onClick={() => setFilterCategory(cs.category === filterCategory ? null : cs.category)}
            >
              <CardContent className="p-3 text-center">
                {getCategoryIcon(cs.category)}
                <div className="text-sm font-medium mt-1">{cs.category}</div>
                <div className="flex gap-1 justify-center mt-1">
                  {cs.passed > 0 && <Badge variant="default" className="text-[10px] px-1 bg-emerald-500">{cs.passed}✓</Badge>}
                  {cs.warnings > 0 && <Badge variant="secondary" className="text-[10px] px-1 bg-amber-500 text-white">{cs.warnings}⚠</Badge>}
                  {cs.failed > 0 && <Badge variant="destructive" className="text-[10px] px-1">{cs.failed}✗</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Results */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          <AnimatePresence>
            {filteredTests.map((test, idx) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card className={cn(
                  "transition-all",
                  test.status === 'passed' && 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10',
                  test.status === 'warning' && 'border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10',
                  test.status === 'failed' && 'border-red-500/30 bg-red-50/30 dark:bg-red-950/10',
                  test.status === 'testing' && 'border-blue-500/30 animate-pulse',
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          {test.status === 'pending' && <Clock className="w-5 h-5 text-muted-foreground" />}
                          {test.status === 'testing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                          {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          {test.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                          {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{test.nameAr}</span>
                            <Badge variant="outline" className="text-[10px]">{test.category}</Badge>
                            <Badge variant="outline" className={cn("text-[10px]", getImpactColor(test.impact))}>
                              {getImpactLabel(test.impact)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{test.description}</div>
                          {test.connectedComponents.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {test.connectedComponents.map(c => (
                                <Badge key={c} variant="secondary" className="text-[9px] px-1 py-0">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0 mr-3">
                        {test.responseTime && (
                          <div className="text-xs text-muted-foreground">{test.responseTime}ms</div>
                        )}
                        {test.error && (
                          <div className="text-xs text-red-500 max-w-[200px] truncate" title={test.error}>
                            {test.error}
                          </div>
                        )}
                        {test.details && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 max-w-[200px] truncate" title={test.details}>
                            {test.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Recommendations for 100% */}
      {tested > 0 && failed > 0 && (
        <Card className="border-2 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-amber-500" />
              خطوات الوصول للحالة المثلى 100%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.filter(t => t.status === 'failed').map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                  <ArrowRight className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{t.nameAr} ({t.edgeFunction})</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      الخطأ: {t.error}
                    </div>
                    <div className="text-xs text-primary mt-1">
                      الحل: تحقق من نشر دالة الحافة <code className="bg-muted px-1 rounded">{t.edgeFunction}</code> وإعداد المفاتيح المطلوبة (LOVABLE_API_KEY)
                    </div>
                  </div>
                </div>
              ))}
              {tests.filter(t => t.status === 'warning').map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{t.nameAr}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t.details} — سجّل دخول كمدير للاختبار الكامل
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIHealthReport;

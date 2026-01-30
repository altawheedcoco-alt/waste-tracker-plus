import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Scale, Recycle, Route, FileText } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import WeightExtractor from '@/components/ai/WeightExtractor';
import WasteClassifier from '@/components/ai/WasteClassifier';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AITools = () => {
  const [reportData, setReportData] = useState('');
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [routeLocations, setRouteLocations] = useState('');
  const [optimizedRoute, setOptimizedRoute] = useState<string | null>(null);
  const { isLoading, generateReport, optimizeRoute } = useAIAssistant();

  const handleGenerateReport = async () => {
    if (!reportData.trim()) return;
    try {
      const data = JSON.parse(reportData);
      const result = await generateReport(data);
      setGeneratedReport(result);
    } catch {
      // If not valid JSON, send as plain text
      const result = await generateReport({ raw_data: reportData });
      setGeneratedReport(result);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!routeLocations.trim()) return;
    const locations = routeLocations.split('\n').filter(l => l.trim());
    const result = await optimizeRoute(locations);
    setOptimizedRoute(result);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Back Button */}
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-eco flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">أدوات الذكاء الاصطناعي</h1>
              <p className="text-muted-foreground">استخدم قوة الذكاء الاصطناعي لتسهيل عملياتك</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="weight" className="w-full" dir="rtl">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="weight" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span className="hidden md:inline">استخراج الوزن</span>
            </TabsTrigger>
            <TabsTrigger value="classify" className="flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              <span className="hidden md:inline">تصنيف النفايات</span>
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              <span className="hidden md:inline">تحسين المسار</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">تقرير ذكي</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="mt-6">
            <WeightExtractor 
              onDataExtracted={(data) => {
                console.log('Extracted weight data:', data);
              }}
            />
          </TabsContent>

          <TabsContent value="classify" className="mt-6">
            <WasteClassifier 
              onClassified={(classification) => {
                console.log('Classification:', classification);
              }}
            />
          </TabsContent>

          <TabsContent value="route" className="mt-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <Route className="w-5 h-5 text-primary" />
                  تحسين المسارات
                </CardTitle>
                <CardDescription>
                  أدخل المواقع التي تريد زيارتها وسيقترح لك النظام أفضل ترتيب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={routeLocations}
                  onChange={(e) => setRouteLocations(e.target.value)}
                  placeholder="أدخل المواقع (كل موقع في سطر جديد)&#10;مثال:&#10;الرياض - حي النخيل&#10;الرياض - حي الملقا&#10;الرياض - حي العليا"
                  className="min-h-[150px] text-right"
                  dir="rtl"
                />
                <Button 
                  onClick={handleOptimizeRoute}
                  disabled={isLoading || !routeLocations.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Route className="w-4 h-4 ml-2" />
                      تحسين المسار
                    </>
                  )}
                </Button>

                {optimizedRoute && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <h4 className="font-medium mb-2 text-right">المسار المقترح:</h4>
                    <div className="prose prose-sm max-w-none text-right">
                      <ReactMarkdown>{optimizedRoute}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <FileText className="w-5 h-5 text-primary" />
                  تقارير ذكية
                </CardTitle>
                <CardDescription>
                  أدخل البيانات وسيقوم الذكاء الاصطناعي بتحليلها وإنشاء تقرير شامل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={reportData}
                  onChange={(e) => setReportData(e.target.value)}
                  placeholder="أدخل البيانات للتحليل (نص أو JSON)&#10;مثال:&#10;عدد الشحنات هذا الشهر: 150&#10;أنواع النفايات: بلاستيك 40%، ورق 30%، معادن 30%&#10;الوزن الإجمالي: 5000 طن"
                  className="min-h-[150px] text-right"
                  dir="rtl"
                />
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isLoading || !reportData.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري إنشاء التقرير...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 ml-2" />
                      إنشاء التقرير
                    </>
                  )}
                </Button>

                {generatedReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <h4 className="font-medium mb-2 text-right">التقرير:</h4>
                    <div className="prose prose-sm max-w-none text-right">
                      <ReactMarkdown>{generatedReport}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AITools;

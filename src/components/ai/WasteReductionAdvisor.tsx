import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Loader2, Leaf, Target, TrendingDown, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface WasteSummary {
  type: string;
  typeName: string;
  quantity: number;
  percentage: number;
}

const WasteReductionAdvisor = () => {
  const { organization } = useAuth();
  const { isLoading, generateReport } = useAIAssistant();
  const [wasteSummary, setWasteSummary] = useState<WasteSummary[]>([]);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    if (organization?.id) {
      fetchWasteData();
    }
  }, [organization?.id]);

  const fetchWasteData = async () => {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('waste_type, quantity')
        .eq('generator_id', organization?.id);

      if (error) throw error;

      if (shipments) {
        const aggregated: Record<string, number> = {};
        let total = 0;
        
        shipments.forEach(s => {
          if (!aggregated[s.waste_type]) {
            aggregated[s.waste_type] = 0;
          }
          aggregated[s.waste_type] += s.quantity || 0;
          total += s.quantity || 0;
        });

        const summary = Object.entries(aggregated)
          .map(([type, quantity]) => ({
            type,
            typeName: getWasteTypeName(type),
            quantity,
            percentage: total > 0 ? (quantity / total) * 100 : 0,
          }))
          .sort((a, b) => b.quantity - a.quantity);

        setWasteSummary(summary);
        setTotalQuantity(total);
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getWasteTypeName = (type: string): string => {
    const names: Record<string, string> = {
      plastic: 'بلاستيك',
      paper: 'ورق وكرتون',
      metal: 'معادن',
      glass: 'زجاج',
      electronic: 'إلكترونيات',
      organic: 'عضوية',
      chemical: 'كيميائية',
      medical: 'طبية',
      construction: 'مخلفات بناء',
      other: 'أخرى',
    };
    return names[type] || type;
  };

  const getWasteIcon = (type: string) => {
    if (['chemical', 'medical'].includes(type)) return AlertTriangle;
    if (['organic'].includes(type)) return Leaf;
    return CheckCircle2;
  };

  const handleGetRecommendations = async () => {
    const analysisData = {
      organization_name: organization?.name,
      organization_type: 'منشأة مولدة للمخلفات',
      total_waste_kg: totalQuantity,
      waste_breakdown: wasteSummary.map(w => ({
        type: w.typeName,
        quantity_kg: w.quantity,
        percentage: w.percentage.toFixed(1) + '%',
      })),
    };

    const prompt = `أنت مستشار بيئي متخصص في إدارة المخلفات. بناءً على بيانات المخلفات التالية للمنشأة "${organization?.name}"، قدم توصيات عملية ومحددة للحد من توليد المخلفات:

البيانات:
${JSON.stringify(analysisData, null, 2)}

يرجى تقديم:
1. تحليل للوضع الحالي وأكبر مصادر المخلفات
2. توصيات محددة لكل نوع من المخلفات الرئيسية
3. أهداف واقعية للتقليل (نسب مئوية)
4. خطوات عملية يمكن تنفيذها فوراً
5. فوائد اقتصادية متوقعة من تطبيق التوصيات
6. أفضل الممارسات من الصناعة

استخدم تنسيق واضح مع عناوين فرعية ونقاط محددة.`;

    const result = await generateReport({ prompt, data: analysisData });
    setRecommendations(result);
  };

  return (
    <div className="space-y-6">
      {/* Current Waste Overview */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Target className="w-5 h-5 text-primary" />
            ملخص المخلفات الحالية
          </CardTitle>
          <CardDescription>
            نظرة عامة على أنواع وكميات المخلفات المولدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : wasteSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات مخلفات حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {wasteSummary.slice(0, 5).map((waste, index) => {
                const Icon = getWasteIcon(waste.type);
                return (
                  <motion.div
                    key={waste.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                        {waste.percentage.toFixed(1)}%
                      </Badge>
                      <span className="text-sm font-medium">
                        {waste.quantity.toLocaleString()} كجم
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{waste.typeName}</span>
                      <Icon className={`w-4 h-4 ${index === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                  </motion.div>
                );
              })}
              
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{totalQuantity.toLocaleString()} كجم</span>
                  <span className="text-muted-foreground">إجمالي المخلفات</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="h-full border-green-500/20">
            <CardContent className="p-4 text-right">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">تقليل من المصدر</h4>
              <p className="text-sm text-muted-foreground">
                أفضل طريقة للتعامل مع المخلفات هي منع توليدها من الأساس
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-blue-500/20">
            <CardContent className="p-4 text-right">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                <Leaf className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">إعادة الاستخدام</h4>
              <p className="text-sm text-muted-foreground">
                ابحث عن طرق لإعادة استخدام المواد قبل التخلص منها
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-purple-500/20">
            <CardContent className="p-4 text-right">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1">الفرز الصحيح</h4>
              <p className="text-sm text-muted-foreground">
                الفرز السليم يزيد من قيمة المخلفات القابلة لإعادة التدوير
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Sparkles className="w-5 h-5 text-primary" />
            توصيات ذكية للحد من المخلفات
          </CardTitle>
          <CardDescription>
            احصل على توصيات مخصصة بناءً على بيانات مخلفاتك الفعلية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGetRecommendations}
            disabled={isLoading || loadingData || wasteSummary.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري إعداد التوصيات...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 ml-2" />
                الحصول على توصيات مخصصة
              </>
            )}
          </Button>

          {recommendations && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20"
            >
              <div className="flex items-center gap-2 mb-4 justify-end">
                <h4 className="font-semibold text-green-700 dark:text-green-400">خطة الحد من المخلفات</h4>
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div className="prose prose-sm max-w-none text-right dark:prose-invert">
                <ReactMarkdown>{recommendations}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteReductionAdvisor;

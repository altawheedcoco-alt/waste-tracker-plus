import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, TrendingUp, TrendingDown, Lightbulb, Target,
  ArrowRight, Zap, Droplets, DollarSign, Gauge,
  BarChart3, CheckCircle2, AlertTriangle, Flame, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizationInsight {
  id: string;
  category: 'yield' | 'energy' | 'cost' | 'waste' | 'quality';
  title: string;
  description: string;
  impact: string;
  impactValue: number;
  impactUnit: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  steps: string[];
  savingsEGP: number;
  benchmark: { current: number; target: number; industry: number; unit: string };
  applied?: boolean;
}

const categoryConfig = {
  yield: { label: 'نسبة التحويل', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  energy: { label: 'كفاءة الطاقة', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  cost: { label: 'تخفيض التكلفة', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  waste: { label: 'تقليل الفاقد', icon: Leaf, color: 'text-green-500', bg: 'bg-green-500/10' },
  quality: { label: 'جودة المخرجات', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const priorityConfig = {
  high: { label: 'عالي', color: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { label: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  low: { label: 'منخفض', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const effortConfig = {
  easy: { label: 'سهل', color: 'text-emerald-500' },
  medium: { label: 'متوسط', color: 'text-amber-500' },
  hard: { label: 'صعب', color: 'text-destructive' },
};

const SmartProductionOptimizer = () => {
  const [insights, setInsights] = useState<OptimizationInsight[]>([
    {
      id: '1', category: 'yield', title: 'رفع نسبة تحويل البلاستيك PET بنسبة 8%',
      description: 'تحليل بيانات الإنتاج يُظهر أن خط البلاستيك يعمل عند 76% بينما المعيار الصناعي 84%. السبب الرئيسي: تلوث المدخلات بنسبة عالية.',
      impact: 'زيادة الإنتاج', impactValue: 8, impactUnit: '%',
      priority: 'high', effort: 'medium',
      steps: [
        'تركيب محطة فرز بصري قبل خط التقطيع',
        'تشديد معايير قبول المواد الخام (نسبة تلوث < 5%)',
        'ضبط درجة حرارة الصهر إلى 270°C بدلاً من 250°C لـ PET',
        'إضافة مرحلة غسيل ساخن ثانية للمواد عالية التلوث',
      ],
      savingsEGP: 45000,
      benchmark: { current: 76, target: 84, industry: 84, unit: '%' },
    },
    {
      id: '2', category: 'energy', title: 'تقليل استهلاك الكهرباء 15% في ساعات الذروة',
      description: 'تحليل أنماط الاستهلاك يكشف أن 60% من الطاقة تُستهلك في ساعات الذروة (10ص-4م). جدولة العمليات الثقيلة لساعات خارج الذروة يوفر 15%.',
      impact: 'توفير طاقة', impactValue: 15, impactUnit: '%',
      priority: 'high', effort: 'easy',
      steps: [
        'تشغيل ماكينة الصهر (120kW) من 6-10 صباحاً و4-8 مساءً',
        'جدولة عمليات الكبس الثقيلة لفترة الليل',
        'تركيب مؤقت ذكي (Smart Timer) على خطوط الإنتاج',
        'الاستفادة من تعريفة الكهرباء المنخفضة ليلاً',
      ],
      savingsEGP: 28000,
      benchmark: { current: 2.1, target: 1.8, industry: 1.5, unit: 'kWh/kg' },
    },
    {
      id: '3', category: 'waste', title: 'تحويل 70% من الفاقد إلى منتجات ثانوية',
      description: 'الفاقد الحالي (19 طن/شهر) يشمل 40% غبار بلاستيك و30% ألياف و30% رواسب. يمكن تحويل غبار البلاستيك والألياف إلى منتجات ثانوية.',
      impact: 'تقليل هدر', impactValue: 70, impactUnit: '% من الفاقد',
      priority: 'medium', effort: 'medium',
      steps: [
        'جمع غبار البلاستيك وضغطه كإضافة للخرسانة الخفيفة',
        'بيع الألياف المسترجعة لمصانع الحشو والعزل',
        'معالجة رواسب الغسيل وتجفيفها كوقود بديل (RDF)',
        'إنشاء خط تعبئة للمنتجات الثانوية',
      ],
      savingsEGP: 35000,
      benchmark: { current: 19, target: 5.7, industry: 8, unit: 'طن فاقد/شهر' },
    },
    {
      id: '4', category: 'quality', title: 'رفع درجة نقاء المنتج النهائي إلى Food Grade',
      description: 'المنتج الحالي بدرجة Industrial. الوصول لـ Food Grade يرفع سعر البيع 40%. يتطلب ترقية خط الغسيل وإضافة فلتر دقيق.',
      impact: 'زيادة سعر البيع', impactValue: 40, impactUnit: '%',
      priority: 'medium', effort: 'hard',
      steps: [
        'إضافة مرحلة غسيل بمحلول كاوي ساخن (85°C)',
        'تركيب فلتر ميكروني (< 25μm) بعد الغسيل',
        'فحص مختبري دوري (كل دُفعة) لمعايير FDA',
        'الحصول على شهادة مطابقة للاستخدام الغذائي',
      ],
      savingsEGP: 120000,
      benchmark: { current: 92, target: 99.5, industry: 99, unit: '% نقاء' },
    },
    {
      id: '5', category: 'cost', title: 'التفاوض الجماعي على أسعار المواد الخام',
      description: 'شراء المواد الخام بعقود ربع سنوية بدلاً من الشراء الفوري يوفر 8-12% من تكلفة المواد.',
      impact: 'توفير مباشر', impactValue: 10, impactUnit: '%',
      priority: 'low', effort: 'easy',
      steps: [
        'تحليل أنماط الشراء الشهرية وتحديد الكميات المتوقعة',
        'التواصل مع 3 موردين على الأقل للحصول على عروض أسعار',
        'توقيع عقود توريد ربع سنوية بأسعار مثبتة',
        'إنشاء مخزون احتياطي (Buffer Stock) لمدة أسبوعين',
      ],
      savingsEGP: 18000,
      benchmark: { current: 3200, target: 2900, industry: 2800, unit: 'ج.م/طن' },
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalSavings = insights.reduce((s, i) => s + i.savingsEGP, 0);
  const appliedCount = insights.filter(i => i.applied).length;

  const toggleApply = (id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, applied: !i.applied } : i));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3 justify-end">
            <span className="text-sm font-bold">مُحسّن الإنتاج الذكي</span>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-500">{(totalSavings / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">ج.م وفر متاح/شهر</p>
            </div>
            <div>
              <p className="text-lg font-bold">{insights.length}</p>
              <p className="text-[10px] text-muted-foreground">توصية ذكية</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{appliedCount}</p>
              <p className="text-[10px] text-muted-foreground">مُطبّقة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const cat = categoryConfig[insight.category];
          const CatIcon = cat.icon;
          const pri = priorityConfig[insight.priority];
          const eff = effortConfig[insight.effort];
          const isExpanded = expandedId === insight.id;

          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className={`overflow-hidden ${insight.applied ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                <button className="w-full text-right" onClick={() => setExpandedId(isExpanded ? null : insight.id)}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <Badge className={`${pri.color} ${pri.bg} text-[10px]`}>{pri.label}</Badge>
                        {insight.applied && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                          <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                        </div>
                        <p className="text-xs font-bold">{insight.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">+{insight.savingsEGP.toLocaleString()} ج.م/شهر</span>
                        <span className={eff.color}>جهد: {eff.label}</span>
                      </div>
                      <span className="font-bold">{insight.impact}: {insight.impactValue}{insight.impactUnit}</span>
                    </div>
                  </CardContent>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t">
                      <div className="p-3 space-y-3">
                        <p className="text-xs text-muted-foreground">{insight.description}</p>

                        {/* Benchmark */}
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] font-bold mb-2 text-right">مقارنة بالمعيار الصناعي:</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold w-10">{insight.benchmark.current}</span>
                              <Progress value={(insight.benchmark.current / insight.benchmark.industry) * 100} className="flex-1 h-2" />
                              <span className="text-[10px] text-muted-foreground w-10 text-right">حالي</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-primary w-10">{insight.benchmark.target}</span>
                              <Progress value={(insight.benchmark.target / insight.benchmark.industry) * 100} className="flex-1 h-2" />
                              <span className="text-[10px] text-primary w-10 text-right">هدف</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-500 w-10">{insight.benchmark.industry}</span>
                              <Progress value={100} className="flex-1 h-2" />
                              <span className="text-[10px] text-emerald-500 w-10 text-right">صناعي</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center mt-1">الوحدة: {insight.benchmark.unit}</p>
                        </div>

                        {/* Steps */}
                        <div>
                          <p className="text-xs font-bold mb-2 text-right">خطوات التنفيذ:</p>
                          {insight.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5">
                              <span className="text-xs text-muted-foreground">{step}</span>
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          variant={insight.applied ? 'outline' : 'default'}
                          className="w-full text-xs"
                          onClick={() => toggleApply(insight.id)}
                        >
                          {insight.applied ? '✅ تم التطبيق' : 'تطبيق التوصية'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartProductionOptimizer;

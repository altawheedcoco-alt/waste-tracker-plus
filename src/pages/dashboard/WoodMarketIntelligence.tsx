import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TreePine, TrendingUp, TrendingDown, Minus, AlertTriangle, Bell, Brain,
  BarChart3, Fuel, Ship, Factory, Truck, Recycle, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Target, Zap, Clock, Shield
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/back-button';

interface AnalysisResult {
  scrapWood: {
    currentPricePerTon: number;
    predictedPriceNextWeek: number;
    predictedPriceNextMonth?: number;
    priceChangePercent?: number;
    trend: 'rising' | 'stable' | 'falling';
    demandLevel: string;
    correlatedFactors?: Array<{ factor: string; impact: string; weight?: number; description: string }>;
    seasonalNote?: string;
  };
  palletWood: {
    currentPricePerUnit: number;
    predictedPriceNextWeek: number;
    predictedPriceNextMonth?: number;
    priceChangePercent?: number;
    trend: 'rising' | 'stable' | 'falling';
    demandLevel: string;
    correlatedFactors?: Array<{ factor: string; impact: string; weight?: number; description: string }>;
    seasonalNote?: string;
  };
  marketOverview: {
    overallSentiment: 'bullish' | 'neutral' | 'bearish';
    confidenceLevel: number;
    keyInsight: string;
    riskLevel?: string;
  };
  smartAlerts: Array<{
    targetAudience: string;
    alertType: string;
    title: string;
    message: string;
    urgency: string;
    icon?: string;
  }>;
  recommendations: Array<{
    action: string;
    reason: string;
    expectedImpact?: string;
    priority: string;
    timeframe?: string;
  }>;
  forecast?: Array<{
    period: string;
    scrapPrice: number;
    palletPrice: number;
    confidence: number;
  }>;
  summary: string;
  analyzedAt: string;
}

const WoodMarketIntelligence = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [region, setRegion] = useState('saudi_arabia');

  const t = useCallback((ar: string, en: string) => isAr ? ar : en, [isAr]);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wood-market-intelligence', {
        body: { action: 'analyze', data: { woodType: 'all', region, internalVolume: null, historicalPrices: [] } }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success(t('تم التحليل بنجاح', 'Analysis completed'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('حدث خطأ', 'Error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'falling') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-yellow-500" />;
  };

  const trendColor = (trend: string) => {
    if (trend === 'rising') return 'text-green-600';
    if (trend === 'falling') return 'text-red-600';
    return 'text-yellow-600';
  };

  const demandBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700', very_high: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      low: t('منخفض', 'Low'), medium: t('متوسط', 'Medium'),
      high: t('مرتفع', 'High'), very_high: t('مرتفع جداً', 'Very High')
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[level] || colors.medium}`}>{labels[level] || level}</span>;
  };

  const urgencyColor = (u: string) => {
    if (u === 'critical') return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    if (u === 'high') return 'border-orange-500 bg-orange-50 dark:bg-orange-950/30';
    if (u === 'medium') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
    return 'border-blue-300 bg-blue-50 dark:bg-blue-950/30';
  };

  const audienceIcon = (a: string) => {
    if (a === 'generator') return <Factory className="w-4 h-4" />;
    if (a === 'transporter') return <Truck className="w-4 h-4" />;
    if (a === 'recycler') return <Recycle className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const audienceLabel = (a: string) => {
    const map: Record<string, string> = {
      generator: t('المُولِّد', 'Generator'), transporter: t('الناقل', 'Transporter'),
      recycler: t('المُعيد تدوير', 'Recycler'), all: t('الجميع', 'All')
    };
    return map[a] || a;
  };

  const sentimentBadge = (s: string) => {
    if (s === 'bullish') return <Badge className="bg-green-600 text-white">{t('صاعد 📈', 'Bullish 📈')}</Badge>;
    if (s === 'bearish') return <Badge className="bg-red-600 text-white">{t('هابط 📉', 'Bearish 📉')}</Badge>;
    return <Badge className="bg-yellow-600 text-white">{t('مستقر ➡️', 'Neutral ➡️')}</Badge>;
  };

  const impactBadge = (impact: string) => {
    if (impact === 'positive') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (impact === 'negative') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <BackButton />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <TreePine className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('ذكاء سوق الخشب', 'Wood Market Intelligence')}</h1>
            <p className="text-sm text-muted-foreground">{t('تحليلات وتوقعات سوق الخشب والطبالي بالذكاء الاصطناعي', 'AI-powered wood & pallet market analysis and forecasting')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saudi_arabia">{t('السعودية', 'Saudi Arabia')}</SelectItem>
              <SelectItem value="uae">{t('الإمارات', 'UAE')}</SelectItem>
              <SelectItem value="egypt">{t('مصر', 'Egypt')}</SelectItem>
              <SelectItem value="gulf">{t('الخليج', 'Gulf')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={runAnalysis} disabled={isLoading} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Brain className="w-4 h-4 me-2" />}
            {isLoading ? t('جارٍ التحليل...', 'Analyzing...') : t('تحليل السوق', 'Analyze Market')}
          </Button>
        </div>
      </div>

      {!result && !isLoading && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TreePine className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('ابدأ تحليل سوق الخشب', 'Start Wood Market Analysis')}</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {t('نظام ذكي يحلل سوقي الخشب السكراب والطبالي، يربط الأسعار بعوامل خارجية (الوقود، الموانئ)، ويقدم تنبيهات ذكية لجميع الأطراف',
                'Intelligent system analyzing scrap wood & pallet markets, correlating prices with external factors (fuel, ports), and providing smart alerts for all parties')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Fuel className="w-5 h-5 text-amber-600" />
                <span className="text-sm">{t('ربط بأسعار الوقود', 'Fuel Price Correlation')}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Ship className="w-5 h-5 text-blue-600" />
                <span className="text-sm">{t('حركة الموانئ', 'Port Activity')}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-sm">{t('تنبؤات AI', 'AI Forecasting')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-amber-600" />
            <Brain className="w-6 h-6 text-amber-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-lg font-semibold animate-pulse">{t('جارٍ تحليل الأسواق...', 'Analyzing markets...')}</p>
          <p className="text-sm text-muted-foreground">{t('ربط بيانات الوقود والموانئ والموسمية', 'Correlating fuel, port, and seasonal data')}</p>
        </div>
      )}

      {result && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Market Overview */}
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="py-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-amber-600" />
                  <span className="font-bold text-lg">{t('نظرة عامة على السوق', 'Market Overview')}</span>
                  {sentimentBadge(result.marketOverview.overallSentiment)}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">{t('مستوى الثقة', 'Confidence')}</div>
                    <div className="font-bold text-lg">{result.marketOverview.confidenceLevel}%</div>
                  </div>
                  {result.marketOverview.riskLevel && (
                    <Badge variant={result.marketOverview.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                      <Shield className="w-3 h-3 me-1" />
                      {t('المخاطر:', 'Risk:')} {result.marketOverview.riskLevel}
                    </Badge>
                  )}
                </div>
                <p className="w-full text-sm text-muted-foreground mt-1">{result.marketOverview.keyInsight}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="prices" className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-1">
                <TabsTrigger value="prices" className="gap-1"><BarChart3 className="w-4 h-4" />{t('الأسعار', 'Prices')}</TabsTrigger>
                <TabsTrigger value="factors" className="gap-1"><Zap className="w-4 h-4" />{t('العوامل المؤثرة', 'Factors')}</TabsTrigger>
                <TabsTrigger value="forecast" className="gap-1"><TrendingUp className="w-4 h-4" />{t('التوقعات', 'Forecast')}</TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1"><Bell className="w-4 h-4" />{t('التنبيهات', 'Alerts')}</TabsTrigger>
                <TabsTrigger value="actions" className="gap-1"><Target className="w-4 h-4" />{t('التوصيات', 'Actions')}</TabsTrigger>
              </TabsList>

              {/* Prices Tab */}
              <TabsContent value="prices" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Scrap Wood Card */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-2 border-amber-300 dark:border-amber-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg"><Fuel className="w-5 h-5" /></div>
                            {t('🪵 الخشب السكراب', '🪵 Scrap Wood')}
                          </CardTitle>
                          {trendIcon(result.scrapWood.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground">{t('نشارة ومخلفات تصنيع - مرتبط بأسعار الوقود البديل', 'Sawdust & manufacturing waste - correlated with alternative fuel prices')}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('السعر الحالي', 'Current')}</div>
                            <div className="text-xl font-bold">{result.scrapWood.currentPricePerTon}</div>
                            <div className="text-xs">{t('ر.س/طن', 'SAR/ton')}</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('الأسبوع القادم', 'Next Week')}</div>
                            <div className={`text-xl font-bold ${trendColor(result.scrapWood.trend)}`}>{result.scrapWood.predictedPriceNextWeek}</div>
                            <div className="text-xs">{t('ر.س/طن', 'SAR/ton')}</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('الشهر القادم', 'Next Month')}</div>
                            <div className="text-xl font-bold">{result.scrapWood.predictedPriceNextMonth || '-'}</div>
                            <div className="text-xs">{t('ر.س/طن', 'SAR/ton')}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('مستوى الطلب', 'Demand')}</span>
                          {demandBadge(result.scrapWood.demandLevel)}
                        </div>
                        {result.scrapWood.priceChangePercent !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t('نسبة التغير', 'Change')}</span>
                            <span className={`font-bold ${result.scrapWood.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.scrapWood.priceChangePercent >= 0 ? '+' : ''}{result.scrapWood.priceChangePercent}%
                            </span>
                          </div>
                        )}
                        {result.scrapWood.seasonalNote && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            {result.scrapWood.seasonalNote}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Pallet Wood Card */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card className="border-2 border-green-300 dark:border-green-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><Ship className="w-5 h-5" /></div>
                            {t('📦 الطبالي / البالتات', '📦 Pallets')}
                          </CardTitle>
                          {trendIcon(result.palletWood.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground">{t('خشب سليم قابل لإعادة الاستخدام - مرتبط بالتجارة والموانئ', 'Reusable wood - correlated with trade & port activity')}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('السعر الحالي', 'Current')}</div>
                            <div className="text-xl font-bold">{result.palletWood.currentPricePerUnit}</div>
                            <div className="text-xs">{t('ر.س/وحدة', 'SAR/unit')}</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('الأسبوع القادم', 'Next Week')}</div>
                            <div className={`text-xl font-bold ${trendColor(result.palletWood.trend)}`}>{result.palletWood.predictedPriceNextWeek}</div>
                            <div className="text-xs">{t('ر.س/وحدة', 'SAR/unit')}</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">{t('الشهر القادم', 'Next Month')}</div>
                            <div className="text-xl font-bold">{result.palletWood.predictedPriceNextMonth || '-'}</div>
                            <div className="text-xs">{t('ر.س/وحدة', 'SAR/unit')}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{t('مستوى الطلب', 'Demand')}</span>
                          {demandBadge(result.palletWood.demandLevel)}
                        </div>
                        {result.palletWood.priceChangePercent !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t('نسبة التغير', 'Change')}</span>
                            <span className={`font-bold ${result.palletWood.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.palletWood.priceChangePercent >= 0 ? '+' : ''}{result.palletWood.priceChangePercent}%
                            </span>
                          </div>
                        )}
                        {result.palletWood.seasonalNote && (
                          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-xs text-green-800 dark:text-green-300 flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            {result.palletWood.seasonalNote}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Factors Tab */}
              <TabsContent value="factors" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <Fuel className="w-5 h-5" />{t('عوامل تسعير السكراب', 'Scrap Pricing Factors')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(result.scrapWood.correlatedFactors || []).map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                          {impactBadge(f.impact)}
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{f.factor}</div>
                            <div className="text-xs text-muted-foreground">{f.description}</div>
                          </div>
                          {f.weight && <Progress value={f.weight * 100} className="w-16 mt-1" />}
                        </div>
                      ))}
                      {(!result.scrapWood.correlatedFactors || result.scrapWood.correlatedFactors.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('لا توجد عوامل مُحددة', 'No factors specified')}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Ship className="w-5 h-5" />{t('عوامل تسعير الطبالي', 'Pallet Pricing Factors')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(result.palletWood.correlatedFactors || []).map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                          {impactBadge(f.impact)}
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{f.factor}</div>
                            <div className="text-xs text-muted-foreground">{f.description}</div>
                          </div>
                          {f.weight && <Progress value={f.weight * 100} className="w-16 mt-1" />}
                        </div>
                      ))}
                      {(!result.palletWood.correlatedFactors || result.palletWood.correlatedFactors.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('لا توجد عوامل مُحددة', 'No factors specified')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Forecast Tab */}
              <TabsContent value="forecast" className="space-y-4">
                {result.forecast && result.forecast.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />{t('منحنى التوقعات السعرية', 'Price Forecast Curve')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={result.forecast}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="scrapPrice" name={t('سكراب (ر.س/طن)', 'Scrap (SAR/ton)')} stroke="#d97706" fill="#fbbf24" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="palletPrice" name={t('طبالي (ر.س/وحدة)', 'Pallets (SAR/unit)')} stroke="#16a34a" fill="#4ade80" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="mt-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={result.forecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="confidence" name={t('مستوى الثقة %', 'Confidence %')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">{t('لا توجد بيانات توقعات', 'No forecast data')}</CardContent></Card>
                )}
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-3">
                {result.smartAlerts.map((alert, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className={`border-s-4 ${urgencyColor(alert.urgency)}`}>
                      <CardContent className="py-4 flex items-start gap-3">
                        <div className="mt-0.5">{audienceIcon(alert.targetAudience)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm">{alert.title}</span>
                            <Badge variant="outline" className="text-[10px]">{audienceLabel(alert.targetAudience)}</Badge>
                            <Badge variant={alert.urgency === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {alert.urgency === 'critical' ? '🔴' : alert.urgency === 'high' ? '🟠' : alert.urgency === 'medium' ? '🟡' : '🔵'} {alert.urgency}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {result.smartAlerts.length === 0 && (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">{t('لا توجد تنبيهات', 'No alerts')}</CardContent></Card>
                )}
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="actions" className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                            <Target className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{rec.action}</div>
                            <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                            {rec.expectedImpact && <p className="text-xs text-green-600 dark:text-green-400 mt-1">💡 {rec.expectedImpact}</p>}
                            {rec.timeframe && <p className="text-xs text-muted-foreground mt-1">⏰ {rec.timeframe}</p>}
                          </div>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>{rec.priority}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Summary */}
            <Card className="bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-950/20 dark:to-green-950/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-1">{t('ملخص التحليل', 'Analysis Summary')}</div>
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t('آخر تحليل:', 'Last analyzed:')} {new Date(result.analyzedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default WoodMarketIntelligence;

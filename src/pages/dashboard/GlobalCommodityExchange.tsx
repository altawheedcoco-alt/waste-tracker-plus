import { useState, useCallback, useEffect } from 'react';
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
  TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, BarChart3,
  Recycle, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  Zap, Globe, DollarSign, Package, Flame, Leaf, Droplets, Gem,
  Newspaper, Box, Wrench
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/back-button';

interface CommodityPrice {
  id: string;
  commodity_type: string;
  commodity_subtype: string;
  commodity_name: string;
  commodity_name_ar: string;
  price_per_ton: number;
  currency: string;
  price_source: string;
  price_date: string;
  previous_price: number | null;
  price_change_percent: number | null;
  trend: string;
  region: string;
}

interface MarketAnalysis {
  commodities: Array<{
    type: string;
    name: string;
    name_ar: string;
    subtypes: Array<{
      subtype: string;
      name: string;
      name_ar: string;
      current_price_usd: number;
      previous_price_usd: number;
      change_percent: number;
      trend: 'rising' | 'falling' | 'stable';
      source: string;
      region_prices: Array<{ region: string; price: number }>;
      forecast_7d: number;
      forecast_30d: number;
      supply_demand: 'surplus' | 'balanced' | 'deficit';
      alert?: string;
    }>;
  }>;
  global_sentiment: 'bullish' | 'neutral' | 'bearish';
  key_insights: string[];
  last_updated: string;
}

const COMMODITY_ICONS: Record<string, any> = {
  metals: Gem,
  paper: Newspaper,
  plastics: Package,
  rdf: Flame,
  wood: Box,
  textiles: Wrench,
  glass: Droplets,
  organic: Leaf,
};

const COMMODITY_COLORS: Record<string, string> = {
  metals: '#ef4444',
  paper: '#f59e0b',
  plastics: '#3b82f6',
  rdf: '#f97316',
  wood: '#84cc16',
  textiles: '#8b5cf6',
  glass: '#06b6d4',
  organic: '#22c55e',
};

const GlobalCommodityExchange = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('commodity-market-analysis', {
        body: {
          commodity_type: selectedCommodity === 'all' ? undefined : selectedCommodity,
          region: selectedRegion,
          include_forecast: true,
        }
      });

      if (error) throw error;
      setAnalysis(data);

      // Generate historical chart data from analysis
      if (data?.commodities) {
        const chartData = generateHistoricalChart(data.commodities);
        setHistoricalData(chartData);
      }

      toast.success(isRTL ? 'تم تحديث بيانات السوق' : 'Market data updated');
    } catch (err) {
      console.error('Market analysis error:', err);
      toast.error(isRTL ? 'خطأ في تحليل السوق' : 'Market analysis error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCommodity, selectedRegion, isRTL]);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const generateHistoricalChart = (commodities: MarketAnalysis['commodities']) => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months.map((month, i) => {
      const entry: any = { month };
      commodities.forEach(c => {
        const basePrice = c.subtypes[0]?.current_price_usd || 100;
        // Seasonal price variation based on month index (deterministic)
        const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.08;
        const trendFactor = 1 + (i - 6) * 0.005; // slight upward trend
        entry[c.type] = Math.round(basePrice * seasonalFactor * trendFactor);
      });
      return entry;
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendBadge = (trend: string, change: number) => {
    const colors = {
      rising: 'bg-green-500/10 text-green-600 border-green-500/30',
      falling: 'bg-red-500/10 text-red-600 border-red-500/30',
      stable: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    };
    return (
      <Badge variant="outline" className={`${colors[trend as keyof typeof colors] || colors.stable} gap-1`}>
        {getTrendIcon(trend)}
        {change > 0 ? '+' : ''}{change?.toFixed(1)}%
      </Badge>
    );
  };

  const allSubtypes = analysis?.commodities?.flatMap(c => 
    c.subtypes.map(s => ({ ...s, parentType: c.type, parentName: c.name_ar }))
  ) || [];

  const topMovers = [...allSubtypes].sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent)).slice(0, 6);
  const risers = allSubtypes.filter(s => s.trend === 'rising').length;
  const fallers = allSubtypes.filter(s => s.trend === 'falling').length;

  return (
    <div className={`space-y-6 p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="w-7 h-7 text-primary" />
              {isRTL ? 'بورصة المخلفات العالمية' : 'Global Waste Commodity Exchange'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'أسعار لحظية من LME، RISI، وأسواق المخلفات العالمية' : 'Live prices from LME, RISI & global waste markets'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">{isRTL ? 'عالمي' : 'Global'}</SelectItem>
              <SelectItem value="mena">{isRTL ? 'الشرق الأوسط' : 'MENA'}</SelectItem>
              <SelectItem value="egypt">{isRTL ? 'مصر' : 'Egypt'}</SelectItem>
              <SelectItem value="europe">{isRTL ? 'أوروبا' : 'Europe'}</SelectItem>
              <SelectItem value="asia">{isRTL ? 'آسيا' : 'Asia'}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMarketData} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Market Sentiment Banner */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-2 ${
            analysis.global_sentiment === 'bullish' ? 'border-green-500/30 bg-green-500/5' :
            analysis.global_sentiment === 'bearish' ? 'border-red-500/30 bg-red-500/5' :
            'border-yellow-500/30 bg-yellow-500/5'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    analysis.global_sentiment === 'bullish' ? 'bg-green-500/20' :
                    analysis.global_sentiment === 'bearish' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {analysis.global_sentiment === 'bullish' ? <TrendingUp className="w-6 h-6 text-green-500" /> :
                     analysis.global_sentiment === 'bearish' ? <TrendingDown className="w-6 h-6 text-red-500" /> :
                     <Minus className="w-6 h-6 text-yellow-500" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {isRTL ? 'مزاج السوق العالمي' : 'Global Market Sentiment'}:{' '}
                      <span className={
                        analysis.global_sentiment === 'bullish' ? 'text-green-500' :
                        analysis.global_sentiment === 'bearish' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        {analysis.global_sentiment === 'bullish' ? (isRTL ? 'صعودي 📈' : 'Bullish 📈') :
                         analysis.global_sentiment === 'bearish' ? (isRTL ? 'هبوطي 📉' : 'Bearish 📉') :
                         (isRTL ? 'مستقر ⚖️' : 'Neutral ⚖️')}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? `${risers} صاعد | ${fallers} هابط | آخر تحديث: ${analysis.last_updated}` : 
                       `${risers} rising | ${fallers} falling | Last: ${analysis.last_updated}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {analysis.key_insights?.slice(0, 2).map((insight, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{insight}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isRTL ? 'المعادن' : 'Metals', icon: Gem, color: COMMODITY_COLORS.metals, type: 'metals' },
          { label: isRTL ? 'الورق/الكرتون' : 'Paper/Cardboard', icon: Newspaper, color: COMMODITY_COLORS.paper, type: 'paper' },
          { label: isRTL ? 'البلاستيك' : 'Plastics', icon: Package, color: COMMODITY_COLORS.plastics, type: 'plastics' },
          { label: isRTL ? 'وقود بديل RDF' : 'RDF/Energy', icon: Flame, color: COMMODITY_COLORS.rdf, type: 'rdf' },
        ].map((item, i) => {
          const subtypes = analysis?.commodities?.find(c => c.type === item.type)?.subtypes || [];
          const avgPrice = subtypes.length > 0 ? subtypes.reduce((a, b) => a + b.current_price_usd, 0) / subtypes.length : 0;
          const avgChange = subtypes.length > 0 ? subtypes.reduce((a, b) => a + b.change_percent, 0) / subtypes.length : 0;
          return (
            <motion.div key={item.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedCommodity(item.type); setActiveTab('details'); }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="text-xl font-bold">${avgPrice.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">{isRTL ? 'متوسط/طن' : 'avg/ton'}</div>
                  {subtypes.length > 0 && getTrendBadge(avgChange > 1 ? 'rising' : avgChange < -1 ? 'falling' : 'stable', avgChange)}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="details">{isRTL ? 'تفاصيل' : 'Details'}</TabsTrigger>
          <TabsTrigger value="charts">{isRTL ? 'رسوم بيانية' : 'Charts'}</TabsTrigger>
          <TabsTrigger value="alerts">{isRTL ? 'تنبيهات' : 'Alerts'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Top Movers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {isRTL ? 'أكبر التحركات السعرية' : 'Top Price Movers'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topMovers.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-2">
                        {(() => { const Icon = COMMODITY_ICONS[item.parentType] || Package; return <Icon className="w-4 h-4" style={{ color: COMMODITY_COLORS[item.parentType] }} />; })()}
                        <div>
                          <div className="font-medium text-sm">{item.name_ar || item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.source}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${item.current_price_usd}</div>
                        {getTrendBadge(item.trend, item.change_percent)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Categories Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis?.commodities?.map((category, i) => {
              const Icon = COMMODITY_ICONS[category.type] || Package;
              return (
                <motion.div key={category.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="w-5 h-5" style={{ color: COMMODITY_COLORS[category.type] }} />
                        {category.name_ar || category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.subtypes.map((sub, j) => (
                          <div key={j} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                            <span>{sub.name_ar || sub.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">${sub.current_price_usd}</span>
                              {getTrendBadge(sub.trend, sub.change_percent)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button variant={selectedCommodity === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCommodity('all')}>
              {isRTL ? 'الكل' : 'All'}
            </Button>
            {Object.entries(COMMODITY_ICONS).map(([type, Icon]) => (
              <Button key={type} variant={selectedCommodity === type ? 'default' : 'outline'} size="sm"
                onClick={() => setSelectedCommodity(type)} className="gap-1">
                <Icon className="w-4 h-4" />
                {type}
              </Button>
            ))}
          </div>

          {analysis?.commodities
            ?.filter(c => selectedCommodity === 'all' || c.type === selectedCommodity)
            .map(category => (
              <Card key={category.type}>
                <CardHeader>
                  <CardTitle>{category.name_ar}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">{isRTL ? 'المادة' : 'Material'}</th>
                          <th className="text-right p-2">{isRTL ? 'السعر الحالي' : 'Current'}</th>
                          <th className="text-right p-2">{isRTL ? 'السابق' : 'Previous'}</th>
                          <th className="text-right p-2">{isRTL ? 'التغير' : 'Change'}</th>
                          <th className="text-right p-2">{isRTL ? 'توقع 7 أيام' : '7d Forecast'}</th>
                          <th className="text-right p-2">{isRTL ? 'توقع 30 يوم' : '30d Forecast'}</th>
                          <th className="text-right p-2">{isRTL ? 'العرض/الطلب' : 'Supply/Demand'}</th>
                          <th className="text-right p-2">{isRTL ? 'المصدر' : 'Source'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.subtypes.map((sub, j) => (
                          <tr key={j} className="border-b hover:bg-accent/5">
                            <td className="p-2 font-medium">{sub.name_ar || sub.name}</td>
                            <td className="p-2 font-mono font-bold">${sub.current_price_usd}</td>
                            <td className="p-2 font-mono text-muted-foreground">${sub.previous_price_usd}</td>
                            <td className="p-2">{getTrendBadge(sub.trend, sub.change_percent)}</td>
                            <td className="p-2 font-mono">${sub.forecast_7d}</td>
                            <td className="p-2 font-mono">${sub.forecast_30d}</td>
                            <td className="p-2">
                              <Badge variant={sub.supply_demand === 'deficit' ? 'destructive' : sub.supply_demand === 'surplus' ? 'secondary' : 'outline'}>
                                {sub.supply_demand === 'deficit' ? (isRTL ? 'عجز' : 'Deficit') :
                                 sub.supply_demand === 'surplus' ? (isRTL ? 'فائض' : 'Surplus') : (isRTL ? 'متوازن' : 'Balanced')}
                              </Badge>
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">{sub.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'مؤشر الأسعار السنوي' : 'Annual Price Index'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.entries(COMMODITY_COLORS).map(([type, color]) => (
                    <Area key={type} type="monotone" dataKey={type} stroke={color} fill={color} fillOpacity={0.1} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Price Distribution Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'توزيع القيمة حسب الفئة' : 'Value Distribution by Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysis?.commodities?.map(c => ({
                        name: c.name_ar,
                        value: c.subtypes.reduce((a, b) => a + b.current_price_usd, 0)
                      })) || []}
                      cx="50%" cy="50%" outerRadius={100} dataKey="value" label
                    >
                      {analysis?.commodities?.map((c, i) => (
                        <Cell key={i} fill={COMMODITY_COLORS[c.type] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'مقارنة الأسعار الإقليمية' : 'Regional Price Comparison'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { region: isRTL ? 'مصر' : 'Egypt', metals: 80, paper: 65, plastics: 70, rdf: 55 },
                    { region: isRTL ? 'أوروبا' : 'Europe', metals: 100, paper: 90, plastics: 95, rdf: 85 },
                    { region: isRTL ? 'آسيا' : 'Asia', metals: 90, paper: 75, plastics: 80, rdf: 70 },
                    { region: 'MENA', metals: 85, paper: 60, plastics: 65, rdf: 50 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="region" />
                    <PolarRadiusAxis />
                    <Radar name={isRTL ? 'معادن' : 'Metals'} dataKey="metals" stroke={COMMODITY_COLORS.metals} fill={COMMODITY_COLORS.metals} fillOpacity={0.2} />
                    <Radar name={isRTL ? 'ورق' : 'Paper'} dataKey="paper" stroke={COMMODITY_COLORS.paper} fill={COMMODITY_COLORS.paper} fillOpacity={0.2} />
                    <Radar name={isRTL ? 'بلاستيك' : 'Plastics'} dataKey="plastics" stroke={COMMODITY_COLORS.plastics} fill={COMMODITY_COLORS.plastics} fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                {isRTL ? 'تنبيهات السوق والتوصيات' : 'Market Alerts & Recommendations'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allSubtypes.filter(s => s.alert).map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-orange-500/5 border-orange-500/20">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <div className="font-medium">{item.name_ar} - {item.parentName}</div>
                      <div className="text-sm text-muted-foreground">{item.alert}</div>
                    </div>
                  </motion.div>
                ))}
                {analysis?.key_insights?.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Brain className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">{insight}</div>
                  </div>
                ))}
                {!analysis && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'اضغط "تحديث" لتحليل السوق' : 'Click "Refresh" to analyze market'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalCommodityExchange;

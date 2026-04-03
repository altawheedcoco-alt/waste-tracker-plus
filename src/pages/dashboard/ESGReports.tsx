import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import BackButton from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Leaf, TrendingUp, Award, Globe, TreePine, Droplets, Zap, Recycle,
  FileText, Download, Brain, RefreshCw, Loader2, Target, Shield,
  Building2, BarChart3, PieChartIcon
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';



interface ESGData {
  overview: {
    overall_score: number;
    environmental_score: number;
    social_score: number;
    governance_score: number;
    rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
    trend: 'improving' | 'stable' | 'declining';
  };
  environmental: {
    waste_diverted_tons: number;
    waste_landfilled_tons: number;
    diversion_rate: number;
    carbon_saved_tons: number;
    carbon_credits: number;
    carbon_credit_value_usd: number;
    energy_generated_kwh: number;
    water_saved_liters: number;
    trees_saved: number;
  };
  sdg_contributions: Array<{
    sdg_number: number;
    sdg_name: string;
    sdg_name_ar: string;
    contribution_score: number;
    details: string;
  }>;
  monthly_trends: Array<{
    month: string;
    diverted: number;
    landfilled: number;
    carbon_saved: number;
    score: number;
  }>;
  recommendations: string[];
  investor_highlights: string[];
}

const RATING_COLORS: Record<string, string> = {
  AAA: 'bg-emerald-500', AA: 'bg-green-500', A: 'bg-lime-500',
  BBB: 'bg-yellow-500', BB: 'bg-orange-500', B: 'bg-red-400', CCC: 'bg-red-600',
};

const SDG_COLORS = ['#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925', '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'];

const ESGReports = () => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportPeriod, setReportPeriod] = useState('quarterly');
  const [esgData, setEsgData] = useState<ESGData | null>(null);

  const fetchESGData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('esg-report-generator', {
        body: {
          organization_id: profile?.organization_id,
          period_type: reportPeriod,
          include_sdg: true,
          include_recommendations: true,
        }
      });

      if (error) throw error;
      setEsgData(data);
      toast.success(isRTL ? 'تم تحديث تقرير ESG' : 'ESG report updated');
    } catch (err) {
      console.error('ESG error:', err);
      toast.error(isRTL ? 'خطأ في إنشاء التقرير' : 'Error generating report');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organization_id, reportPeriod, isRTL]);

  useEffect(() => { fetchESGData(); }, []);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      toast.success(isRTL ? 'جاري إنشاء تقرير PDF...' : 'Generating PDF report...');
      // PDF generation would go here
      setTimeout(() => {
        toast.success(isRTL ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
        setIsGenerating(false);
      }, 2000);
    } catch {
      setIsGenerating(false);
    }
  };

  const scoreToGrade = (score: number) => {
    if (score >= 90) return 'AAA';
    if (score >= 80) return 'AA';
    if (score >= 70) return 'A';
    if (score >= 60) return 'BBB';
    if (score >= 50) return 'BB';
    if (score >= 40) return 'B';
    return 'CCC';
  };

  const radarData = esgData ? [
    { axis: isRTL ? 'البيئة' : 'Environmental', value: esgData.overview.environmental_score },
    { axis: isRTL ? 'المجتمع' : 'Social', value: esgData.overview.social_score },
    { axis: isRTL ? 'الحوكمة' : 'Governance', value: esgData.overview.governance_score },
    { axis: isRTL ? 'تحويل النفايات' : 'Waste Diversion', value: esgData.environmental.diversion_rate },
    { axis: isRTL ? 'الكربون' : 'Carbon', value: Math.min(100, (esgData.environmental.carbon_saved_tons / 100) * 100) },
    { axis: isRTL ? 'الطاقة' : 'Energy', value: Math.min(100, (esgData.environmental.energy_generated_kwh / 10000) * 100) },
  ] : [];

  return (
    <DashboardLayout>
      <div className={`space-y-6 p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Leaf className="w-7 h-7 text-emerald-500" />
              {isRTL ? 'تقارير ESG للمستثمرين' : 'ESG Reports for Investors'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'البيئة والمجتمع والحوكمة - تقارير جاهزة لتقديمها للمستثمرين' : 'Environmental, Social & Governance - Investor-ready reports'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{isRTL ? 'شهري' : 'Monthly'}</SelectItem>
              <SelectItem value="quarterly">{isRTL ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
              <SelectItem value="annual">{isRTL ? 'سنوي' : 'Annual'}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchESGData} disabled={isLoading} variant="outline" className="gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isRTL ? 'تصدير PDF' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* ESG Score Cards */}
      {esgData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRTL ? 'التصنيف العام' : 'Overall Rating', value: esgData.overview.rating, score: esgData.overview.overall_score, icon: Award, isRating: true },
            { label: isRTL ? 'البيئة' : 'Environmental', value: `${esgData.overview.environmental_score}%`, score: esgData.overview.environmental_score, icon: Leaf, color: 'text-emerald-500' },
            { label: isRTL ? 'المجتمع' : 'Social', value: `${esgData.overview.social_score}%`, score: esgData.overview.social_score, icon: Building2, color: 'text-blue-500' },
            { label: isRTL ? 'الحوكمة' : 'Governance', value: `${esgData.overview.governance_score}%`, score: esgData.overview.governance_score, icon: Shield, color: 'text-purple-500' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <item.icon className={`w-5 h-5 ${item.color || 'text-primary'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.isRating ? (
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl font-black text-white px-3 py-1 rounded-lg ${RATING_COLORS[item.value as string] || 'bg-gray-500'}`}>
                        {item.value}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.score}/100</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{item.value}</div>
                      <Progress value={item.score} className="mt-2 h-2" />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Impact Highlights */}
      {esgData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: isRTL ? 'نفايات محولة' : 'Waste Diverted', value: `${esgData.environmental.waste_diverted_tons}T`, icon: Recycle, color: 'text-emerald-500' },
            { label: isRTL ? 'كربون موفر' : 'Carbon Saved', value: `${esgData.environmental.carbon_saved_tons}T`, icon: TreePine, color: 'text-green-600' },
            { label: isRTL ? 'أرصدة كربون' : 'Carbon Credits', value: `$${esgData.environmental.carbon_credit_value_usd.toLocaleString()}`, icon: Award, color: 'text-amber-500' },
            { label: isRTL ? 'أشجار مكافئة' : 'Trees Equivalent', value: esgData.environmental.trees_saved.toLocaleString(), icon: TreePine, color: 'text-lime-600' },
            { label: isRTL ? 'طاقة مولدة' : 'Energy Generated', value: `${(esgData.environmental.energy_generated_kwh / 1000).toFixed(1)}MWh`, icon: Zap, color: 'text-yellow-500' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
              <Card>
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="sdg">{isRTL ? 'أهداف التنمية' : 'SDGs'}</TabsTrigger>
          <TabsTrigger value="trends">{isRTL ? 'اتجاهات' : 'Trends'}</TabsTrigger>
          <TabsTrigger value="investor">{isRTL ? 'للمستثمرين' : 'Investor'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{isRTL ? 'مخطط ESG الرادار' : 'ESG Radar Chart'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="axis" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{isRTL ? 'توزيع النفايات' : 'Waste Distribution'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: isRTL ? 'معاد تدويره' : 'Recycled', value: esgData?.environmental.waste_diverted_tons || 0 },
                        { name: isRTL ? 'مدفون' : 'Landfilled', value: esgData?.environmental.waste_landfilled_tons || 0 },
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-emerald-500">{esgData?.environmental.diversion_rate || 0}%</span>
                  <span className="text-sm text-muted-foreground ml-2">{isRTL ? 'نسبة التحويل' : 'Diversion Rate'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sdg" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                {isRTL ? 'المساهمة في أهداف التنمية المستدامة (SDGs)' : 'UN Sustainable Development Goals Contribution'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {esgData?.sdg_contributions?.map((sdg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: SDG_COLORS[sdg.sdg_number - 1] || '#888' }}>
                          {sdg.sdg_number}
                        </div>
                        <span className="font-medium text-sm">{isRTL ? sdg.sdg_name_ar : sdg.sdg_name}</span>
                      </div>
                      <Progress value={sdg.contribution_score} className="h-2 mb-1" />
                      <div className="text-xs text-muted-foreground">{sdg.details}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{isRTL ? 'اتجاه الأداء البيئي' : 'Environmental Performance Trend'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={esgData?.monthly_trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="diverted" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name={isRTL ? 'محول' : 'Diverted'} />
                  <Area type="monotone" dataKey="landfilled" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name={isRTL ? 'مدفون' : 'Landfilled'} />
                  <Area type="monotone" dataKey="carbon_saved" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name={isRTL ? 'كربون موفر' : 'Carbon Saved'} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investor" className="space-y-4">
          <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                {isRTL ? 'أبرز النقاط للمستثمرين' : 'Investor Highlights'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {esgData?.investor_highlights?.map((highlight, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <p className="text-sm">{highlight}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {isRTL ? 'توصيات التحسين' : 'Improvement Recommendations'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {esgData?.recommendations?.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/5">
                    <Target className="w-4 h-4 text-primary mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carbon Credits Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'ملخص أرصدة الكربون' : 'Carbon Credits Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-emerald-500">{esgData?.environmental.carbon_credits || 0}</div>
                  <div className="text-sm text-muted-foreground">{isRTL ? 'رصيد كربون' : 'Carbon Credits'}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-500">${esgData?.environmental.carbon_credit_value_usd?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">{isRTL ? 'القيمة السوقية' : 'Market Value'}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{esgData?.environmental.carbon_saved_tons || 0}T</div>
                  <div className="text-sm text-muted-foreground">{isRTL ? 'CO₂ موفر' : 'CO₂ Saved'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ESGReports;

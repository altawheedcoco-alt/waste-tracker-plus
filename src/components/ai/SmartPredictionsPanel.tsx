import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Loader2, Sparkles,
  Target, AlertTriangle, Zap, Clock, BarChart3,
} from 'lucide-react';
import { useAIInsights, PredictionResult, RiskResult, RecommendationResult } from '@/hooks/useAIInsights';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SmartPredictionsPanel = () => {
  const { profile } = useAuth();
  const { isLoading, generatePredictions, assessRisk, generateRecommendations } = useAIInsights();
  const [predictionType, setPredictionType] = useState('shipment_volume');
  const [timeframe, setTimeframe] = useState('monthly');
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [riskData, setRiskData] = useState<RiskResult | null>(null);
  const [activeView, setActiveView] = useState<'predictions' | 'risks'>('predictions');

  const handleGenerate = async () => {
    if (!profile?.organization_id) return;

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const res = await fetch(
        `${baseUrl}/rest/v1/shipments?or=(generator_id.eq.${profile.organization_id},transporter_id.eq.${profile.organization_id},recycler_id.eq.${profile.organization_id})&limit=100&select=id,status,waste_type,quantity,created_at`,
        { headers }
      );
      const shipments = await res.json();

      const [predResult, riskResult] = await Promise.all([
        generatePredictions(shipments || [], predictionType, timeframe),
        assessRisk([], shipments || [], []),
      ]);

      if (predResult) setPredictions(predResult);
      if (riskResult) setRiskData(riskResult);
    } catch (error) {
      console.error('Error generating predictions:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendLabel = (trend: string) => {
    const labels: Record<string, string> = { increasing: 'تصاعدي', decreasing: 'تنازلي', stable: 'مستقر' };
    return labels[trend] || trend;
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'text-emerald-600';
      case 'high': return 'text-blue-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-red-600';
    }
  };

  const getConfidenceLabel = (level: string) => {
    const labels: Record<string, string> = { very_high: 'عالية جداً', high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
    return labels[level] || level;
  };

  const predictionsChartData = predictions?.predictions?.map(p => ({
    name: p.metric.length > 15 ? p.metric.slice(0, 15) + '...' : p.metric,
    current: p.current_value,
    predicted: p.predicted_value,
    change: p.change_percentage,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-right">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            التوقعات الذكية وتقييم المخاطر
          </CardTitle>
          <CardDescription>
            تنبؤات مدعومة بالذكاء الاصطناعي بناءً على بيانات شحناتك الفعلية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع التنبؤ</label>
              <Select value={predictionType} onValueChange={setPredictionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipment_volume">حجم الشحنات</SelectItem>
                  <SelectItem value="revenue">الإيرادات</SelectItem>
                  <SelectItem value="waste_generation">إنتاج النفايات</SelectItem>
                  <SelectItem value="operational_efficiency">الكفاءة التشغيلية</SelectItem>
                  <SelectItem value="cost_optimization">تحسين التكاليف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الإطار الزمني</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري التحليل...</>
            ) : (
              <><Sparkles className="h-4 w-4 ml-2" />توليد التوقعات</>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {(predictions || riskData) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Toggle View */}
            <div className="flex gap-2">
              <Button
                variant={activeView === 'predictions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('predictions')}
              >
                <TrendingUp className="h-4 w-4 ml-1" />
                التنبؤات
              </Button>
              <Button
                variant={activeView === 'risks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('risks')}
              >
                <AlertTriangle className="h-4 w-4 ml-1" />
                المخاطر
              </Button>
            </div>

            {activeView === 'predictions' && predictions && (
              <>
                {/* Confidence Level */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-medium">مستوى الثقة في التنبؤات</span>
                      </div>
                      <Badge variant="outline" className={cn("text-base px-4 py-1", getConfidenceColor(predictions.confidence_level))}>
                        {getConfidenceLabel(predictions.confidence_level)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Predictions Chart */}
                {predictionsChartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">مقارنة القيم الحالية بالمتوقعة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={predictionsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="current" name="الحالي" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="predicted" name="المتوقع" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="change" name="نسبة التغيير %" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Prediction Details */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {predictions.predictions?.map((pred, i) => (
                    <Card key={i}>
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{pred.metric}</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(pred.trend)}
                            <span className="text-xs">{getTrendLabel(pred.trend)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-muted-foreground">الحالي</p>
                            <p className="text-lg font-bold">{pred.current_value}</p>
                          </div>
                          <div className="text-center">
                            <Badge variant={pred.change_percentage >= 0 ? 'default' : 'destructive'} className="text-xs">
                              {pred.change_percentage >= 0 ? '+' : ''}{pred.change_percentage}%
                            </Badge>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">المتوقع</p>
                            <p className="text-lg font-bold text-primary">{pred.predicted_value}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-left">
                          ثقة: {pred.confidence}%
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Opportunities */}
                {predictions.opportunities && predictions.opportunities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        فرص النمو
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {predictions.opportunities.map((opp, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium text-sm">{opp.opportunity}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>القيمة: {opp.potential_value}</span>
                            <span>الإطار: {opp.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Actionable Insights */}
                {predictions.actionable_insights && predictions.actionable_insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        رؤى قابلة للتنفيذ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {predictions.actionable_insights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">✦</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeView === 'risks' && riskData && (
              <>
                {/* Risk Overview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold",
                        riskData.risk_level === 'critical' ? 'bg-red-600' :
                        riskData.risk_level === 'high' ? 'bg-orange-500' :
                        riskData.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )}>
                        {riskData.overall_risk_score}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">مستوى المخاطر الإجمالي</p>
                        <p className="text-xl font-bold">
                          {riskData.risk_level === 'critical' ? 'حرج' :
                           riskData.risk_level === 'high' ? 'مرتفع' :
                           riskData.risk_level === 'medium' ? 'متوسط' : 'منخفض'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Details */}
                <div className="space-y-3">
                  {riskData.risks?.map((risk, i) => (
                    <Card key={i}>
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{risk.category}</span>
                          <Badge variant={risk.severity === 'critical' || risk.severity === 'high' ? 'destructive' : 'secondary'}>
                            {risk.severity === 'critical' ? 'حرج' : risk.severity === 'high' ? 'مرتفع' : risk.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                        {risk.mitigation && (
                          <p className="text-sm text-primary">💡 {risk.mitigation}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Urgent Actions */}
                {riskData.urgent_actions && riskData.urgent_actions.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        إجراءات عاجلة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {riskData.urgent_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-red-500 mt-0.5">⚠</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartPredictionsPanel;

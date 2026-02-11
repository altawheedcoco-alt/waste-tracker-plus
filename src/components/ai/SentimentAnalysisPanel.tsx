import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Heart, Loader2, Plus, X, Smile, Frown, Meh, AlertCircle,
  ThumbsUp, ThumbsDown, Zap, Shield, MessageSquareText, Sparkles
} from 'lucide-react';
import { useAIInsights, SentimentResult } from '@/hooks/useAIInsights';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SENTIMENT_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  mixed: '#F59E0B',
};

const PIE_COLORS = ['#10B981', '#EF4444', '#6B7280'];

const SentimentAnalysisPanel = () => {
  const { isLoading, analyzeSentiment } = useAIInsights();
  const [texts, setTexts] = useState<string[]>(['']);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);

  const addTextField = () => setTexts(prev => [...prev, '']);
  const removeTextField = (index: number) => setTexts(prev => prev.filter((_, i) => i !== index));
  const updateText = (index: number, value: string) => {
    setTexts(prev => prev.map((t, i) => i === index ? value : t));
  };

  const handleAnalyze = async () => {
    const validTexts = texts.filter(t => t.trim());
    if (validTexts.length === 0) return;
    const res = await analyzeSentiment(validTexts, context || undefined);
    if (res) setResult(res);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-6 w-6 text-emerald-500" />;
      case 'negative': return <Frown className="h-6 w-6 text-red-500" />;
      case 'mixed': return <AlertCircle className="h-6 w-6 text-amber-500" />;
      default: return <Meh className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = {
      positive: 'إيجابي',
      negative: 'سلبي',
      neutral: 'محايد',
      mixed: 'مختلط',
    };
    return labels[sentiment] || sentiment;
  };

  const breakdownData = result?.sentiment_breakdown ? [
    { name: 'إيجابي', value: result.sentiment_breakdown.positive_percentage },
    { name: 'سلبي', value: result.sentiment_breakdown.negative_percentage },
    { name: 'محايد', value: result.sentiment_breakdown.neutral_percentage },
  ] : [];

  const emotionalData = result?.emotional_indicators ? [
    { metric: 'الرضا', value: Math.round((result.emotional_indicators.satisfaction || 0) * 100) },
    { metric: 'الإحباط', value: Math.round((result.emotional_indicators.frustration || 0) * 100) },
    { metric: 'الإلحاح', value: Math.round((result.emotional_indicators.urgency || 0) * 100) },
    { metric: 'الثقة', value: Math.round((result.emotional_indicators.trust || 0) * 100) },
  ] : [];

  const concernsData = result?.concerns?.map(c => ({
    name: c.issue.length > 20 ? c.issue.slice(0, 20) + '...' : c.issue,
    value: c.severity === 'high' ? 90 : c.severity === 'medium' ? 60 : 30,
    severity: c.severity,
  })) || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-primary" />
            تحليل المشاعر بالذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            أدخل نصوصاً لتحليل المشاعر السائدة واستخراج المواضيع والتوصيات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {texts.map((text, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                value={text}
                onChange={e => updateText(i, e.target.value)}
                placeholder={`النص ${i + 1}: مثال - "الخدمة ممتازة والتسليم سريع"`}
                className="min-h-[80px]"
              />
              {texts.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeTextField(i)} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addTextField}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة نص
            </Button>
          </div>

          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="السياق (اختياري): مثال - تعليقات العملاء على خدمة النقل"
            className="min-h-[60px]"
          />

          <Button onClick={handleAnalyze} disabled={isLoading || texts.every(t => !t.trim())} className="w-full">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري التحليل...</>
            ) : (
              <><Sparkles className="h-4 w-4 ml-2" />تحليل المشاعر</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Overall Sentiment */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center",
                      result.overall_sentiment === 'positive' ? 'bg-emerald-100' :
                      result.overall_sentiment === 'negative' ? 'bg-red-100' :
                      result.overall_sentiment === 'mixed' ? 'bg-amber-100' : 'bg-muted'
                    )}>
                      {getSentimentIcon(result.overall_sentiment)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المشاعر السائدة</p>
                      <p className="text-2xl font-bold">{getSentimentLabel(result.overall_sentiment)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">درجة الثقة</p>
                    <p className="text-3xl font-bold" style={{ color: SENTIMENT_COLORS[result.overall_sentiment] }}>
                      {result.confidence}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Sentiment Breakdown Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    توزيع المشاعر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85}
                        paddingAngle={4} dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {breakdownData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emotional Indicators Radar */}
              {emotionalData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      المؤشرات العاطفية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={emotionalData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Key Themes */}
            {result.key_themes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المواضيع الرئيسية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.key_themes.map((theme, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Concerns */}
            {result.concerns && result.concerns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    نقاط القلق
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.concerns.map((concern, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">{concern.issue}</span>
                      <Badge variant={concern.severity === 'high' ? 'destructive' : concern.severity === 'medium' ? 'default' : 'secondary'}>
                        {concern.severity === 'high' ? 'مرتفع' : concern.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    التوصيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">✦</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SentimentAnalysisPanel;

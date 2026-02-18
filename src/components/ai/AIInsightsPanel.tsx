import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Target,
  Shield,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { useAIInsights, SentimentResult, PredictionResult, RiskResult, RecommendationResult } from '@/hooks/useAIInsights';

interface AIInsightsPanelProps {
  organizationType?: string;
  organizationId?: string;
}

const SentimentDisplay: React.FC<{ result: SentimentResult }> = ({ result }) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'negative': return <ThumbsDown className="h-5 w-5 text-red-500" />;
      case 'neutral': return <Minus className="h-5 w-5 text-gray-500" />;
      default: return <Brain className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'إيجابي';
      case 'negative': return 'سلبي';
      case 'neutral': return 'محايد';
      case 'mixed': return 'مختلط';
      default: return sentiment;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        {getSentimentIcon(result.overall_sentiment)}
        <div>
          <p className="font-medium">{getSentimentLabel(result.overall_sentiment)}</p>
          <p className="text-sm text-muted-foreground">الثقة: {result.confidence}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>إيجابي</span>
          <span>{result.sentiment_breakdown.positive_percentage}%</span>
        </div>
        <Progress value={result.sentiment_breakdown.positive_percentage} className="h-2 bg-red-100" />
        
        <div className="flex justify-between text-sm">
          <span>سلبي</span>
          <span>{result.sentiment_breakdown.negative_percentage}%</span>
        </div>
        <Progress value={result.sentiment_breakdown.negative_percentage} className="h-2" />
        
        <div className="flex justify-between text-sm">
          <span>محايد</span>
          <span>{result.sentiment_breakdown.neutral_percentage}%</span>
        </div>
        <Progress value={result.sentiment_breakdown.neutral_percentage} className="h-2" />
      </div>

      {result.key_themes.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">المواضيع الرئيسية</h4>
          <div className="flex flex-wrap gap-2">
            {result.key_themes.map((theme, i) => (
              <Badge key={i} variant="secondary">{theme}</Badge>
            ))}
          </div>
        </div>
      )}

      {result.concerns && result.concerns.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">نقاط القلق</h4>
          <div className="space-y-2">
            {result.concerns.map((concern, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                <AlertTriangle className={`h-4 w-4 ${
                  concern.severity === 'high' ? 'text-red-500' : 
                  concern.severity === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                }`} />
                <span className="text-sm">{concern.issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">التوصيات</h4>
          <ul className="space-y-1 text-sm">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const PredictionDisplay: React.FC<{ result: PredictionResult }> = ({ result }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'bg-green-500';
      case 'high': return 'bg-green-400';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className={getConfidenceColor(result.confidence_level)}>
          مستوى الثقة: {result.confidence_level === 'very_high' ? 'عالي جداً' : 
            result.confidence_level === 'high' ? 'عالي' : 
            result.confidence_level === 'medium' ? 'متوسط' : 'منخفض'}
        </Badge>
      </div>

      <div className="space-y-3">
        {result.predictions.map((pred, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTrendIcon(pred.trend)}
                <span className="font-medium">{pred.metric}</span>
              </div>
              <Badge variant={pred.change_percentage >= 0 ? 'default' : 'destructive'}>
                {pred.change_percentage >= 0 ? '+' : ''}{pred.change_percentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>الحالي: {pred.current_value}</span>
              <span>المتوقع: {pred.predicted_value}</span>
            </div>
            <Progress value={pred.confidence} className="h-1 mt-2" />
          </Card>
        ))}
      </div>

      {result.opportunities && result.opportunities.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            الفرص
          </h4>
          <div className="space-y-2">
            {result.opportunities.map((opp, i) => (
              <div key={i} className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                <p className="font-medium">{opp.opportunity}</p>
                <p className="text-muted-foreground">القيمة: {opp.potential_value} • {opp.timeframe}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.actionable_insights && result.actionable_insights.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">رؤى قابلة للتنفيذ</h4>
          <ul className="space-y-1 text-sm">
            {result.actionable_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RiskDisplay: React.FC<{ result: RiskResult }> = ({ result }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-950';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-950';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      default: return 'text-green-600 bg-green-100 dark:bg-green-950';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getRiskColor(result.risk_level)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">مستوى المخاطر: {getRiskLabel(result.risk_level)}</span>
          </div>
          <span className="text-2xl font-bold">{result.overall_risk_score}</span>
        </div>
      </div>

      {result.risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">المخاطر المحددة</h4>
          {result.risks.map((risk, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{risk.category}</Badge>
                <Badge className={getRiskColor(risk.severity)}>
                  {getRiskLabel(risk.severity)}
                </Badge>
              </div>
              <p className="text-sm">{risk.description}</p>
              <p className="text-sm text-muted-foreground mt-1">الأثر: {risk.impact}</p>
              <p className="text-sm text-green-600 mt-1">التخفيف: {risk.mitigation}</p>
            </Card>
          ))}
        </div>
      )}

      {result.urgent_actions && result.urgent_actions.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-red-600">إجراءات عاجلة</h4>
          <ul className="space-y-1 text-sm">
            {result.urgent_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RecommendationDisplay: React.FC<{ result: RecommendationResult }> = ({ result }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  return (
    <div className="space-y-4">
      {result.quick_wins.length > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            مكاسب سريعة
          </h4>
          <ul className="space-y-1 text-sm">
            {result.quick_wins.map((win, i) => (
              <li key={i}>• {win}</li>
            ))}
          </ul>
        </div>
      )}

      {result.priority_actions.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">الإجراءات ذات الأولوية</h4>
          <div className="space-y-2">
            {result.priority_actions.map((action, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getPriorityColor(action.priority)}>
                    {getPriorityLabel(action.priority)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{action.timeline}</span>
                </div>
                <p className="font-medium">{action.action}</p>
                <p className="text-sm text-muted-foreground mt-1">الأثر المتوقع: {action.expected_impact}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {result.growth_opportunities && result.growth_opportunities.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">فرص النمو</h4>
          <div className="space-y-2">
            {result.growth_opportunities.map((opp, i) => (
              <div key={i} className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                <p className="font-medium">{opp.opportunity}</p>
                <p className="text-muted-foreground">{opp.description}</p>
                <div className="flex justify-between mt-1 text-xs">
                  <span>الاستثمار: {opp.investment_required}</span>
                  <span>العائد المتوقع: {opp.roi_estimate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  organizationType = 'generator',
  organizationId 
}) => {
  const { isLoading, analyzeSentiment, generatePredictions, assessRisk, generateRecommendations } = useAIInsights();
  
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  const [activeTab, setActiveTab] = useState('sentiment');

  const handleAnalyzeSentiment = async () => {
    // Demo texts - in production, fetch from support tickets or partner notes
    const demoTexts = [
      "الخدمة ممتازة والتعامل احترافي جداً",
      "نحتاج تحسين في سرعة التوصيل",
      "راضين عن الجودة لكن الأسعار مرتفعة قليلاً",
      "فريق العمل متعاون ومحترف",
      "التأخير في بعض الشحنات أثر على عملياتنا"
    ];
    const result = await analyzeSentiment(demoTexts, "تقييم رضا العملاء والجهات المرتبطة");
    if (result) setSentimentResult(result);
  };

  const handleGeneratePredictions = async () => {
    // Demo historical data
    const demoData = [
      { month: 'يناير', shipments: 45, revenue: 125000 },
      { month: 'فبراير', shipments: 52, revenue: 145000 },
      { month: 'مارس', shipments: 48, revenue: 138000 },
      { month: 'أبريل', shipments: 61, revenue: 172000 },
      { month: 'مايو', shipments: 58, revenue: 165000 },
      { month: 'يونيو', shipments: 67, revenue: 189000 }
    ];
    const result = await generatePredictions(demoData, 'shipment_volume', 'الربع القادم');
    if (result) setPredictionResult(result);
  };

  const handleAssessRisk = async () => {
    // Demo data
    const demoContracts = [
      { title: 'عقد نقل نفايات صناعية', end_date: '2026-03-15', value: 150000 },
      { title: 'عقد تدوير بلاستيك', end_date: '2026-02-20', value: 80000 }
    ];
    const demoShipments = [
      { status: 'in_transit', delay_days: 2 },
      { status: 'confirmed', delay_days: 0 },
      { status: 'in_transit', delay_days: 1 }
    ];
    const result = await assessRisk(demoContracts, demoShipments, []);
    if (result) setRiskResult(result);
  };

  const handleGenerateRecommendations = async () => {
    const demoMetrics = {
      monthly_shipments: 58,
      average_processing_time: 2.5,
      customer_satisfaction: 85,
      revenue_growth: 12,
      recycling_rate: 78
    };
    const result = await generateRecommendations(
      organizationType === 'generator' ? 'مولد نفايات' : 
      organizationType === 'transporter' ? 'ناقل' : 'مُعيد تدوير',
      demoMetrics,
      ['زيادة الكفاءة', 'تحسين رضا العملاء', 'تقليل التكاليف']
    );
    if (result) setRecommendationResult(result);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          رؤى الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="sentiment" className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="hidden sm:inline">المشاعر</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">التنبؤات</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">المخاطر</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">التوصيات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment" className="space-y-4">
            <Button onClick={handleAnalyzeSentiment} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              تحليل المشاعر
            </Button>
            {sentimentResult && <SentimentDisplay result={sentimentResult} />}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <Button onClick={handleGeneratePredictions} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              توليد التنبؤات
            </Button>
            {predictionResult && <PredictionDisplay result={predictionResult} />}
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Button onClick={handleAssessRisk} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              تقييم المخاطر
            </Button>
            {riskResult && <RiskDisplay result={riskResult} />}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Button onClick={handleGenerateRecommendations} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              توليد التوصيات
            </Button>
            {recommendationResult && <RecommendationDisplay result={recommendationResult} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

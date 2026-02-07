import { useState } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Lightbulb, 
  Loader2, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIInsights, RiskResult, RecommendationResult, PredictionResult } from '@/hooks/useAIInsights';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AIInsightsDashboard = () => {
  const { profile } = useAuth();
  const { isLoading, assessRisk, generateRecommendations, generatePredictions } = useAIInsights();
  
  const [riskData, setRiskData] = useState<RiskResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    risks: true,
    recommendations: true,
    predictions: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const loadInsights = async () => {
    if (!profile?.organization_id) return;

    try {
      // Use raw fetch to avoid TypeScript depth issues with Supabase client
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      // Fetch data in parallel
      const [shipmentsRes, contractsRes, orgRes] = await Promise.all([
        fetch(`${baseUrl}/rest/v1/shipments?organization_id=eq.${profile.organization_id}&limit=50&select=id,status,created_at,waste_type,quantity`, { headers }),
        fetch(`${baseUrl}/rest/v1/contracts?organization_id=eq.${profile.organization_id}&limit=20&select=id,status,value,start_date,end_date`, { headers }),
        fetch(`${baseUrl}/rest/v1/organizations?id=eq.${profile.organization_id}&select=organization_type&limit=1`, { headers })
      ]);

      const shipments = await shipmentsRes.json();
      const contracts = await contractsRes.json();
      const orgs = await orgRes.json();

      const organizationType = orgs?.[0]?.organization_type || 'generator';

      // Generate AI insights
      const riskResult = await assessRisk(contracts || [], shipments || [], []);
      setRiskData(riskResult);

      const recsResult = await generateRecommendations(
        organizationType,
        {
          total_shipments: (shipments || []).length,
          active_contracts: (contracts || []).filter((c: any) => c.status === 'active').length
        }
      );
      setRecommendations(recsResult);

      const predResult = await generatePredictions(shipments || [], 'shipment_volume', 'monthly');
      setPredictions(predResult);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-primary';
    }
  };

  const getPriorityVariant = (priority: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-eco flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">رؤى الذكاء الاصطناعي</h2>
            <p className="text-sm text-muted-foreground">تحليلات وتوصيات ذكية لتحسين أعمالك</p>
          </div>
        </div>
        <Button onClick={loadInsights} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 ml-2" />
          )}
          تحديث التحليلات
        </Button>
      </div>

      {/* Risk Assessment */}
      <Collapsible open={expandedSections.risks}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('risks')}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  تقييم المخاطر
                </CardTitle>
                {expandedSections.risks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {riskData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${getRiskColor(riskData.risk_level)}`} />
                    <span className="font-medium">مستوى المخاطر: {riskData.risk_level}</span>
                    <Progress value={riskData.overall_risk_score} className="flex-1" />
                    <span className="text-sm text-muted-foreground">{riskData.overall_risk_score}%</span>
                  </div>
                  
                  {riskData.risks?.slice(0, 3).map((risk, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{risk.category}</span>
                        <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                      {risk.mitigation && (
                        <p className="text-sm text-primary mt-2">
                          💡 {risk.mitigation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  انقر "تحديث التحليلات" لعرض تقييم المخاطر
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recommendations */}
      <Collapsible open={expandedSections.recommendations}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('recommendations')}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  توصيات ذكية
                </CardTitle>
                {expandedSections.recommendations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {recommendations ? (
                <div className="space-y-4">
                  {/* Quick Wins */}
                  {recommendations.quick_wins?.length > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-medium mb-2 text-primary">
                        ⚡ إجراءات سريعة
                      </h4>
                      <ul className="space-y-1">
                        {recommendations.quick_wins.map((win, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Priority Actions */}
                  {recommendations.priority_actions?.map((action, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{action.action}</span>
                        <Badge variant={getPriorityVariant(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>التأثير: {action.expected_impact}</span>
                        <span>الجهد: {action.effort}</span>
                        <span>المدة: {action.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  انقر "تحديث التحليلات" لعرض التوصيات
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Predictions */}
      <Collapsible open={expandedSections.predictions}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('predictions')}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  التنبؤات
                </CardTitle>
                {expandedSections.predictions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {predictions ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">مستوى الثقة:</span>
                    <Badge variant="outline">{predictions.confidence_level}</Badge>
                  </div>

                  {predictions.predictions?.map((pred, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{pred.metric}</span>
                        <Badge variant={pred.trend === 'increasing' ? 'default' : pred.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                          {pred.trend === 'increasing' ? '↑' : pred.trend === 'decreasing' ? '↓' : '→'} {pred.change_percentage}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>الحالي: {pred.current_value}</span>
                        <span>المتوقع: {pred.predicted_value}</span>
                        <span className="text-muted-foreground">ثقة: {pred.confidence}%</span>
                      </div>
                    </div>
                  ))}

                  {predictions.actionable_insights && predictions.actionable_insights.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <h4 className="font-medium mb-2 text-primary">
                        💡 رؤى قابلة للتنفيذ
                      </h4>
                      <ul className="space-y-1">
                        {predictions.actionable_insights.map((insight, i) => (
                          <li key={i} className="text-sm">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  انقر "تحديث التحليلات" لعرض التنبؤات
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default AIInsightsDashboard;

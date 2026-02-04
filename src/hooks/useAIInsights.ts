import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SentimentResult {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  sentiment_breakdown: {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
  };
  key_themes: string[];
  concerns?: Array<{ issue: string; severity: 'low' | 'medium' | 'high' }>;
  recommendations?: string[];
  emotional_indicators?: {
    satisfaction: number;
    frustration: number;
    urgency: number;
    trust: number;
  };
}

export interface PredictionResult {
  predictions: Array<{
    metric: string;
    current_value: number;
    predicted_value: number;
    change_percentage: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  risk_factors?: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
  }>;
  opportunities?: Array<{
    opportunity: string;
    potential_value: string;
    timeframe: string;
  }>;
  actionable_insights?: string[];
  confidence_level: 'low' | 'medium' | 'high' | 'very_high';
}

export interface RiskResult {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risks: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: string;
    mitigation: string;
  }>;
  urgent_actions?: string[];
  monitoring_suggestions?: string[];
}

export interface RecommendationResult {
  priority_actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    expected_impact: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
  efficiency_improvements?: Array<{
    area: string;
    current_state: string;
    recommended_state: string;
    potential_savings: string;
  }>;
  growth_opportunities?: Array<{
    opportunity: string;
    description: string;
    investment_required: string;
    roi_estimate: string;
  }>;
  quick_wins: string[];
}

export const useAIInsights = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = useCallback(async (
    texts: string[],
    context?: string
  ): Promise<SentimentResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'sentiment',
          data: { texts },
          context
        }
      });

      if (funcError) throw funcError;
      if (!data.success) throw new Error(data.error);

      return data.result as SentimentResult;
    } catch (err: any) {
      const message = err.message || 'فشل تحليل المشاعر';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePredictions = useCallback(async (
    historicalData: any[],
    predictionType: string,
    timeframe: string
  ): Promise<PredictionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'prediction',
          data: { historicalData, predictionType, timeframe }
        }
      });

      if (funcError) throw funcError;
      if (!data.success) throw new Error(data.error);

      return data.result as PredictionResult;
    } catch (err: any) {
      const message = err.message || 'فشل توليد التنبؤات';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assessRisk = useCallback(async (
    contracts?: any[],
    shipments?: any[],
    partners?: any[]
  ): Promise<RiskResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'risk_assessment',
          data: { contracts, shipments, partners }
        }
      });

      if (funcError) throw funcError;
      if (!data.success) throw new Error(data.error);

      return data.result as RiskResult;
    } catch (err: any) {
      const message = err.message || 'فشل تقييم المخاطر';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateRecommendations = useCallback(async (
    organizationType: string,
    currentMetrics: any,
    goals?: string[]
  ): Promise<RecommendationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-insights', {
        body: {
          type: 'recommendation',
          data: { organizationType, currentMetrics, goals }
        }
      });

      if (funcError) throw funcError;
      if (!data.success) throw new Error(data.error);

      return data.result as RecommendationResult;
    } catch (err: any) {
      const message = err.message || 'فشل توليد التوصيات';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    analyzeSentiment,
    generatePredictions,
    assessRisk,
    generateRecommendations
  };
};

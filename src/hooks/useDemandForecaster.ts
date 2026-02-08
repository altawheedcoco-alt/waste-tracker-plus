import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Forecast {
  period: string;
  predictedShipments: number;
  predictedWeight?: number;
  predictedRevenue?: number;
  confidence: number;
  isPeakPeriod?: boolean;
}

interface Trends {
  overallTrend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number;
  seasonalPatterns?: Array<{
    pattern: string;
    impact: string;
  }>;
}

interface PeakAnalysis {
  peakDays?: string[];
  peakHours?: string[];
  lowActivityPeriods?: string[];
}

interface ResourceRecommendation {
  resource: string;
  currentCapacity?: string;
  recommendedCapacity?: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

interface ForecastResult {
  success: boolean;
  forecasts: Forecast[];
  trends: Trends;
  peakAnalysis?: PeakAnalysis;
  resourceRecommendations: ResourceRecommendation[];
  summary: string;
  forecastedAt: string;
}

interface HistoricalData {
  date: string;
  shipmentCount: number;
  totalWeight?: number;
  totalRevenue?: number;
  wasteTypes?: Record<string, number>;
}

export function useDemandForecaster() {
  const [isForecasting, setIsForecasting] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const forecastDemand = useCallback(async (
    historicalData: HistoricalData[],
    forecastPeriod: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ) => {
    setIsForecasting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-demand-forecaster', {
        body: { historicalData, forecastPeriod }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('تم إنشاء التنبؤات بنجاح');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء التنبؤ';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsForecasting(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isForecasting,
    result,
    error,
    forecastDemand,
    clearResults
  };
}

export default useDemandForecaster;

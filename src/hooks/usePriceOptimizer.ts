import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OptimizedPrice {
  itemId?: string;
  itemName: string;
  currentPrice: number;
  suggestedPrice: number;
  minPrice?: number;
  maxPrice?: number;
  changePercent: number;
  profitMargin?: number;
  competitivePosition?: 'below_market' | 'at_market' | 'above_market';
  rationale: string;
}

interface MarketAnalysis {
  averageMarketPrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  competitiveIndex?: number;
  marketPosition?: string;
}

interface RevenueImpact {
  estimatedRevenueChange?: number;
  estimatedProfitChange?: number;
  breakEvenVolume?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface Strategy {
  strategy: string;
  description: string;
  expectedImpact?: string;
  implementation?: string;
  priority: 'low' | 'medium' | 'high';
}

interface PriceOptimizationResult {
  success: boolean;
  optimizedPrices: OptimizedPrice[];
  marketAnalysis?: MarketAnalysis;
  revenueImpact: RevenueImpact;
  strategies: Strategy[];
  summary: string;
  optimizedAt: string;
}

interface PricingData {
  wasteType: string;
  currentPrice: number;
  averageCost?: number;
  competitorPrices?: number[];
  demand?: 'low' | 'medium' | 'high';
  volume?: number;
  customerSegment?: string;
}

interface MarketConditions {
  competitionLevel?: 'low' | 'medium' | 'high';
  seasonalFactor?: number;
  economicTrend?: 'growth' | 'stable' | 'recession';
}

export function usePriceOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<PriceOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizePrices = useCallback(async (
    pricingData: PricingData[],
    optimizationGoal: 'balanced' | 'profit_maximize' | 'market_share' | 'customer_retention' = 'balanced',
    marketConditions?: MarketConditions
  ) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-price-optimizer', {
        body: { pricingData, marketConditions, optimizationGoal }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('تم تحسين الأسعار بنجاح');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء تحسين الأسعار';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isOptimizing,
    result,
    error,
    optimizePrices,
    clearResults
  };
}

export default usePriceOptimizer;

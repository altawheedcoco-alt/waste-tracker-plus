import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Anomaly {
  shipmentId: string;
  anomalyType: 'weight_discrepancy' | 'route_anomaly' | 'price_anomaly' | 'suspicious_pattern' | 'data_tampering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  recommendation: string;
}

interface AnomalySummary {
  totalAnalyzed: number;
  totalAnomalies: number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  riskScore: number;
  overallAssessment: string;
}

interface AnomalyResult {
  success: boolean;
  anomalies: Anomaly[];
  summary: AnomalySummary;
  recommendations: string[];
  analyzedAt: string;
}

interface ShipmentData {
  id: string;
  weight: number;
  expectedWeight?: number;
  origin: string;
  destination: string;
  driverId?: string;
  timestamp: string;
  price?: number;
  distance?: number;
}

export function useAnomalyDetector() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnomalyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeShipments = useCallback(async (
    shipments: ShipmentData[],
    analysisType: 'comprehensive' | 'weight' | 'route' | 'price' = 'comprehensive'
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-anomaly-detector', {
        body: { shipments, analysisType }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      if (data.summary?.criticalCount > 0) {
        toast.error(`تم اكتشاف ${data.summary.criticalCount} شذوذ حرج يتطلب إجراء فوري!`);
      } else if (data.summary?.highCount > 0) {
        toast.warning(`تم اكتشاف ${data.summary.highCount} شذوذ عالي الخطورة`);
      } else if (data.anomalies?.length > 0) {
        toast.info(`تم اكتشاف ${data.anomalies.length} شذوذ للمراجعة`);
      } else {
        toast.success('لم يتم اكتشاف أي شذوذ');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء التحليل';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    result,
    error,
    analyzeShipments,
    clearResults
  };
}

export default useAnomalyDetector;

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenancePrediction {
  vehicleId: string;
  vehiclePlate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedIssues: Array<{
    component: string;
    probability: number;
    estimatedDaysUntilFailure: number;
    recommendedAction: string;
  }>;
  nextMaintenanceDate: string;
  estimatedCost: number;
  recommendations: string[];
}

interface PredictionSummary {
  totalVehicles: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

export const useMaintenancePredictor = () => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const { organization } = useAuth();
  const { toast } = useToast();

  const generatePredictions = useCallback(async (
    vehicleIds?: string[]
  ): Promise<MaintenancePrediction[] | null> => {
    if (!organization?.id) {
      toast({
        title: 'خطأ',
        description: 'لا توجد منظمة محددة',
        variant: 'destructive'
      });
      return null;
    }

    setIsPredicting(true);
    setPredictions([]);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-maintenance-predictor', {
        body: {
          organizationId: organization.id,
          vehicleIds
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'خطأ في التنبؤ',
          description: data.error,
          variant: 'destructive'
        });
        return null;
      }

      setPredictions(data.predictions || []);
      setSummary(data.summary || null);
      
      const criticalCount = data.predictions?.filter((p: MaintenancePrediction) => p.riskLevel === 'critical').length || 0;
      
      toast({
        title: 'تم التنبؤ بالصيانة',
        description: criticalCount > 0 
          ? `تحذير: ${criticalCount} مركبة تحتاج صيانة عاجلة`
          : `تم تحليل ${data.predictions?.length || 0} مركبة`,
        variant: criticalCount > 0 ? 'destructive' : 'default'
      });

      return data.predictions;
    } catch (err) {
      console.error('Maintenance prediction error:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في التنبؤ بالصيانة',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsPredicting(false);
    }
  }, [organization?.id, toast]);

  return {
    isPredicting,
    predictions,
    summary,
    generatePredictions,
    clearPredictions: () => {
      setPredictions([]);
      setSummary(null);
    }
  };
};

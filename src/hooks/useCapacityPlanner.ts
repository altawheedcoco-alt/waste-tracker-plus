import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CapacityAnalysis {
  vehicleUtilization: number;
  driverWorkload?: number;
  storageUtilization?: number;
  overallCapacityScore: number;
  bottlenecks?: string[];
  status: 'under_capacity' | 'optimal' | 'near_capacity' | 'over_capacity';
}

interface FutureRequirement {
  resource: string;
  currentCount: number;
  requiredCount: number;
  gap?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeline?: string;
  estimatedCost?: string;
}

interface WorkloadDistribution {
  peakDays?: string[];
  optimalShifts?: Array<{
    shift: string;
    driversNeeded: number;
    vehiclesNeeded: number;
  }>;
  loadBalancingRecommendations?: string[];
}

interface ActionPlanItem {
  action: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeline: string;
  expectedImpact?: string;
  estimatedCost?: string;
  responsible?: string;
}

interface ContingencyPlan {
  peakLoadStrategy?: string;
  emergencyContacts?: string[];
  backupResources?: Array<{
    resource: string;
    availability: string;
  }>;
}

interface CapacityPlanResult {
  success: boolean;
  currentCapacityAnalysis: CapacityAnalysis;
  futureRequirements: FutureRequirement[];
  workloadDistribution?: WorkloadDistribution;
  actionPlan: ActionPlanItem[];
  contingencyPlan?: ContingencyPlan;
  summary: string;
  plannedAt: string;
}

interface ResourceData {
  vehicles: {
    total: number;
    available: number;
    inMaintenance: number;
    utilization: number;
  };
  drivers: {
    total: number;
    available: number;
    avgWorkload: number;
  };
  storage: {
    totalCapacity: number;
    usedCapacity: number;
    utilizationRate: number;
  };
  demandForecast?: {
    expectedShipments: number;
    expectedWeight: number;
    peakLoad: number;
  };
}

export function useCapacityPlanner() {
  const [isPlanning, setIsPlanning] = useState(false);
  const [result, setResult] = useState<CapacityPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planCapacity = useCallback(async (
    resourceData: ResourceData,
    planningHorizon: '7days' | '30days' | '90days' | '1year' = '30days'
  ) => {
    setIsPlanning(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-capacity-planner', {
        body: { resourceData, planningHorizon }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      const status = data.currentCapacityAnalysis?.status;
      if (status === 'over_capacity') {
        toast.error('تحذير: السعة الحالية متجاوزة!');
      } else if (status === 'near_capacity') {
        toast.warning('تنبيه: السعة قريبة من الحد الأقصى');
      } else {
        toast.success('تم إنشاء خطة السعة بنجاح');
      }
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء تخطيط السعة';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsPlanning(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isPlanning,
    result,
    error,
    planCapacity,
    clearResults
  };
}

export default useCapacityPlanner;

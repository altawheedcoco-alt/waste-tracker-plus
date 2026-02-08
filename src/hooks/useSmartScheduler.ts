import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleAssignment {
  driverId: string;
  driverName: string;
  shipments: any[];
  estimatedDuration: number;
  estimatedDistance: number;
  loadUtilization: number;
  route: Array<{ lat: number; lng: number; name: string; type: string }>;
}

interface SchedulingResult {
  assignments: ScheduleAssignment[];
  unassignedShipments: any[];
  totalShipments: number;
  assignedCount: number;
  efficiency: number;
  recommendations: string[];
}

export const useSmartScheduler = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<SchedulingResult | null>(null);
  const { organization } = useAuth();
  const { toast } = useToast();

  const generateSchedule = useCallback(async (
    date?: string,
    maxShipmentsPerDriver?: number,
    prioritizeUrgent?: boolean
  ): Promise<SchedulingResult | null> => {
    if (!organization?.id) {
      toast({
        title: 'خطأ',
        description: 'لا توجد منظمة محددة',
        variant: 'destructive'
      });
      return null;
    }

    setIsScheduling(true);
    setScheduleResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-scheduler', {
        body: {
          organizationId: organization.id,
          date,
          maxShipmentsPerDriver,
          prioritizeUrgent
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'خطأ في الجدولة',
          description: data.error,
          variant: 'destructive'
        });
        return null;
      }

      setScheduleResult(data);
      toast({
        title: 'تمت الجدولة الذكية',
        description: `تم توزيع ${data.assignedCount} شحنة على السائقين بكفاءة ${data.efficiency}%`,
      });

      return data;
    } catch (err) {
      console.error('Smart scheduling error:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في الجدولة الذكية',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsScheduling(false);
    }
  }, [organization?.id, toast]);

  return {
    isScheduling,
    scheduleResult,
    generateSchedule,
    clearSchedule: () => setScheduleResult(null)
  };
};

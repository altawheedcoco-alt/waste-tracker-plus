import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
  name: string;
  type: 'pickup' | 'delivery';
  shipmentId?: string;
  priority?: number;
}

interface OptimizedRoute {
  orderedStops: Location[];
  totalDistance: number;
  totalDuration: number;
  fuelEstimate: number;
  co2Savings: number;
  recommendations: string[];
}

export const useRouteOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const { toast } = useToast();

  const optimizeRoute = useCallback(async (
    driverId: string,
    currentLocation: { lat: number; lng: number },
    destinations: Location[]
  ): Promise<OptimizedRoute | null> => {
    setIsOptimizing(true);
    setOptimizedRoute(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-route-optimizer', {
        body: {
          driverId,
          currentLocation,
          destinations,
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'خطأ في تحسين المسار',
          description: data.error,
          variant: 'destructive'
        });
        return null;
      }

      setOptimizedRoute(data);
      toast({
        title: 'تم تحسين المسار',
        description: `تم توفير ${data.fuelEstimate}% من الوقود والمسافة`,
      });

      return data;
    } catch (err) {
      console.error('Route optimization error:', err);
      toast({
        title: 'خطأ',
        description: 'فشل في تحسين المسار',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  return {
    isOptimizing,
    optimizedRoute,
    optimizeRoute,
    clearRoute: () => setOptimizedRoute(null)
  };
};

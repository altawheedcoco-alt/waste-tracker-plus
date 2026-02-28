import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface GeofenceAlert {
  id: string;
  shipment_id: string | null;
  driver_id: string | null;
  organization_id: string | null;
  alert_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  message: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export const useGeofencing = (organizationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['geofence-alerts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('geofence_alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as GeofenceAlert[];
    },
    enabled: !!organizationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel(`geofence-alerts-${organizationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'geofence_alerts',
        filter: `organization_id=eq.${organizationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['geofence-alerts', organizationId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId, queryClient]);

  const checkDriverLocation = useMutation({
    mutationFn: async (params: { driverId: string; latitude: number; longitude: number; shipmentId?: string; speed?: number }) => {
      const { data, error } = await supabase.functions.invoke('geofencing-alerts', {
        body: { action: 'check-location', ...params, driver_id: params.driverId, shipment_id: params.shipmentId },
      });
      if (error) throw error;

      // Log alerts to database
      if (data?.alerts?.length > 0) {
        for (const alert of data.alerts) {
          await supabase.from('geofence_alerts').insert({
            shipment_id: alert.shipment_id || null,
            driver_id: params.driverId,
            organization_id: organizationId,
            alert_type: alert.type === 'entered_pickup_zone' ? 'entered_pickup' : 
                       alert.type === 'entered_delivery_zone' ? 'entered_delivery' : 
                       alert.type,
            severity: alert.type.includes('unauthorized') ? 'critical' : 'info',
            latitude: params.latitude,
            longitude: params.longitude,
            message: alert.message,
          });
        }
      }
      return data;
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (params: { alertId: string; notes?: string }) => {
      const { error } = await supabase
        .from('geofence_alerts')
        .update({
          resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: params.notes || null,
        })
        .eq('id', params.alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['geofence-alerts', organizationId] }),
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  return {
    alerts,
    isLoading,
    checkDriverLocation,
    resolveAlert,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    unresolvedCount: alerts.length,
  };
};

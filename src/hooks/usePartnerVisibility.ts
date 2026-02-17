import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PartnerVisibilitySetting {
  id: string;
  organization_id: string;
  partner_organization_id: string;
  can_view_maps: boolean;
  can_view_tracking: boolean;
  can_view_routes: boolean;
  can_view_driver_location: boolean;
  can_view_shipment_details: boolean;
  can_view_driver_info: boolean;
  can_view_vehicle_info: boolean;
  can_view_estimated_arrival: boolean;
  can_receive_notifications: boolean;
  can_view_reports: boolean;
  can_view_recycler_info: boolean;
  can_view_generator_info: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  partner?: {
    id: string;
    name: string;
    organization_type: string;
    logo_url: string | null;
  };
}

export interface UpdateVisibilityInput {
  partner_organization_id: string;
  can_view_maps?: boolean;
  can_view_tracking?: boolean;
  can_view_routes?: boolean;
  can_view_driver_location?: boolean;
  can_view_shipment_details?: boolean;
  can_view_driver_info?: boolean;
  can_view_vehicle_info?: boolean;
  can_view_estimated_arrival?: boolean;
  can_receive_notifications?: boolean;
  can_view_reports?: boolean;
  can_view_recycler_info?: boolean;
  can_view_generator_info?: boolean;
}

export const usePartnerVisibility = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch visibility settings for the current organization
  const { data: settings = [], isLoading, refetch } = useQuery({
    queryKey: ['partner-visibility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('partner_visibility_settings')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;
      return data as PartnerVisibilitySetting[];
    },
    enabled: !!organization?.id,
  });

  // Fetch partners with their visibility settings
  const { data: partnersWithSettings = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners-with-visibility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get unique partners from shipments
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('generator_id, recycler_id')
        .eq('transporter_id', organization.id);

      if (shipmentsError) throw shipmentsError;

      // Get unique partner IDs
      const partnerIds = new Set<string>();
      shipments?.forEach(s => {
        if (s.generator_id) partnerIds.add(s.generator_id);
        if (s.recycler_id) partnerIds.add(s.recycler_id);
      });

      if (partnerIds.size === 0) return [];

      // Fetch partner organizations
      const { data: partners, error: partnersError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, logo_url')
        .in('id', Array.from(partnerIds));

      if (partnersError) throw partnersError;

      // Fetch existing visibility settings
      const { data: existingSettings, error: settingsError } = await supabase
        .from('partner_visibility_settings')
        .select('*')
        .eq('organization_id', organization.id);

      if (settingsError) throw settingsError;

      // Merge partners with their settings
      return partners?.map(partner => {
        const existingSetting = existingSettings?.find(
          s => s.partner_organization_id === partner.id
        );
        return {
          ...partner,
          visibility: existingSetting || {
            can_view_maps: true,
            can_view_tracking: true,
            can_view_routes: true,
            can_view_driver_location: true,
            can_view_shipment_details: true,
            can_view_driver_info: true,
            can_view_vehicle_info: true,
            can_view_estimated_arrival: true,
            can_receive_notifications: true,
            can_view_reports: true,
            can_view_recycler_info: true,
            can_view_generator_info: true,
          },
          hasCustomSettings: !!existingSetting,
        };
      }) || [];
    },
    enabled: !!organization?.id,
  });

  // Update or create visibility setting
  const updateVisibilityMutation = useMutation({
    mutationFn: async (input: UpdateVisibilityInput) => {
      if (!organization?.id || !profile?.id) throw new Error('غير مصرح');

      // Check if setting exists
      const { data: existing } = await supabase
        .from('partner_visibility_settings')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('partner_organization_id', input.partner_organization_id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('partner_visibility_settings')
          .update({
            can_view_maps: input.can_view_maps,
            can_view_tracking: input.can_view_tracking,
            can_view_routes: input.can_view_routes,
            can_view_driver_location: input.can_view_driver_location,
            can_view_shipment_details: input.can_view_shipment_details,
            can_view_driver_info: input.can_view_driver_info,
            can_view_vehicle_info: input.can_view_vehicle_info,
            can_view_estimated_arrival: input.can_view_estimated_arrival,
            can_receive_notifications: input.can_receive_notifications,
            can_view_reports: input.can_view_reports,
            can_view_recycler_info: input.can_view_recycler_info,
            can_view_generator_info: input.can_view_generator_info,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('partner_visibility_settings')
          .insert({
            organization_id: organization.id,
            partner_organization_id: input.partner_organization_id,
            can_view_maps: input.can_view_maps ?? true,
            can_view_tracking: input.can_view_tracking ?? true,
            can_view_routes: input.can_view_routes ?? true,
            can_view_driver_location: input.can_view_driver_location ?? true,
            can_view_shipment_details: input.can_view_shipment_details ?? true,
            can_view_driver_info: input.can_view_driver_info ?? true,
            can_view_vehicle_info: input.can_view_vehicle_info ?? true,
            can_view_estimated_arrival: input.can_view_estimated_arrival ?? true,
            can_receive_notifications: input.can_receive_notifications ?? true,
            can_view_reports: input.can_view_reports ?? true,
            can_view_recycler_info: input.can_view_recycler_info ?? true,
            can_view_generator_info: input.can_view_generator_info ?? true,
            created_by: profile.id,
          } as any);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-visibility'] });
      queryClient.invalidateQueries({ queryKey: ['partners-with-visibility'] });
      toast.success('تم تحديث إعدادات الرؤية');
    },
    onError: (error) => {
      console.error('Error updating visibility:', error);
      toast.error('فشل تحديث الإعدادات');
    },
  });

  // Check if a partner can view specific features
  const checkPartnerVisibility = async (
    transporterId: string,
    partnerOrgId: string
  ): Promise<PartnerVisibilitySetting | null> => {
    const { data, error } = await supabase
      .from('partner_visibility_settings')
      .select('*')
      .eq('organization_id', transporterId)
      .eq('partner_organization_id', partnerOrgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking visibility:', error);
    }

    return data || null;
  };

  return {
    settings,
    partnersWithSettings,
    isLoading: isLoading || loadingPartners,
    updateVisibility: updateVisibilityMutation.mutate,
    isUpdating: updateVisibilityMutation.isPending,
    checkPartnerVisibility,
    refetch,
  };
};

// Hook to check if current user can view maps/tracking for a shipment
export const useCanViewShipmentFeatures = (shipmentId: string | undefined) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['can-view-features', shipmentId, organization?.id],
    queryFn: async () => {
      if (!shipmentId || !organization?.id) {
        return { canViewMaps: true, canViewTracking: true, canViewRoutes: true, canViewDriverLocation: true };
      }

      // Get shipment details
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('transporter_id, generator_id, recycler_id')
        .eq('id', shipmentId)
        .single();

      if (shipmentError || !shipment) {
        return { canViewMaps: true, canViewTracking: true, canViewRoutes: true, canViewDriverLocation: true };
      }

      // If current user is the transporter, they can see everything
      if (shipment.transporter_id === organization.id) {
        return { canViewMaps: true, canViewTracking: true, canViewRoutes: true, canViewDriverLocation: true };
      }

      // Check visibility settings from transporter
      const { data: settings } = await supabase
        .from('partner_visibility_settings')
        .select('*')
        .eq('organization_id', shipment.transporter_id)
        .eq('partner_organization_id', organization.id)
        .single();

      // If no settings exist, default to allowing everything
      if (!settings) {
        return { canViewMaps: true, canViewTracking: true, canViewRoutes: true, canViewDriverLocation: true };
      }

      return {
        canViewMaps: settings.can_view_maps,
        canViewTracking: settings.can_view_tracking,
        canViewRoutes: settings.can_view_routes,
        canViewDriverLocation: settings.can_view_driver_location,
      };
    },
    enabled: !!shipmentId && !!organization?.id,
  });
};

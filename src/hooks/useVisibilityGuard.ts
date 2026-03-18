import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerRestrictions } from '@/hooks/usePartnerRestrictions';

/**
 * نظام صلاحيات الرؤية المركزي
 * يتحقق من صلاحيات الجهات المرتبطة لرؤية الميزات المختلفة
 * 
 * القاعدة الأساسية:
 * - الناقل (المالك): يرى كل شيء
 * - المولد/المدور (الشريك): يرى حسب الإعدادات التي حددها الناقل
 * - المسؤول: يرى كل شيء
 */

export interface VisibilityPermissions {
  canViewMaps: boolean;
  canViewTracking: boolean;
  canViewRoutes: boolean;
  canViewDriverLocation: boolean;
  canViewShipmentDetails: boolean;
  canViewDriverInfo: boolean;
  canViewVehicleInfo: boolean;
  canViewEstimatedArrival: boolean;
  canReceiveNotifications: boolean;
  canViewReports: boolean;
  canViewRecyclerInfo: boolean;
  canViewGeneratorInfo: boolean;
  isLoading: boolean;
  isOwner: boolean;
}

const DEFAULT_PERMISSIONS: Omit<VisibilityPermissions, 'isLoading' | 'isOwner'> = {
  canViewMaps: true,
  canViewTracking: true,
  canViewRoutes: true,
  canViewDriverLocation: true,
  canViewShipmentDetails: true,
  canViewDriverInfo: true,
  canViewVehicleInfo: true,
  canViewEstimatedArrival: true,
  canReceiveNotifications: true,
  canViewReports: true,
  canViewRecyclerInfo: true,
  canViewGeneratorInfo: true,
};

const BLOCKED_PERMISSIONS: Omit<VisibilityPermissions, 'isLoading' | 'isOwner'> = {
  canViewMaps: false,
  canViewTracking: false,
  canViewRoutes: false,
  canViewDriverLocation: false,
  canViewShipmentDetails: false,
  canViewDriverInfo: false,
  canViewVehicleInfo: false,
  canViewEstimatedArrival: false,
  canReceiveNotifications: false,
  canViewReports: false,
  canViewRecyclerInfo: false,
  canViewGeneratorInfo: false,
};

/**
 * Hook للتحقق من صلاحيات الرؤية لشحنة معينة
 */
export function useShipmentVisibility(shipmentId: string | undefined): VisibilityPermissions {
  const { organization, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { isRestricted } = usePartnerRestrictions();

  const { data, isLoading } = useQuery({
    queryKey: ['shipment-visibility', shipmentId, organization?.id],
    queryFn: async (): Promise<{ permissions: Omit<VisibilityPermissions, 'isLoading' | 'isOwner'>; isOwner: boolean }> => {
      if (!shipmentId || !organization?.id) {
        return { permissions: DEFAULT_PERMISSIONS, isOwner: false };
      }

      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('transporter_id, generator_id, recycler_id, hide_recycler_from_generator, hide_generator_from_recycler')
        .eq('id', shipmentId)
        .single();

      if (shipmentError || !shipment) {
        console.error('Error fetching shipment:', shipmentError);
        return { permissions: DEFAULT_PERMISSIONS, isOwner: false };
      }

      if (shipment.transporter_id === organization.id) {
        return { permissions: DEFAULT_PERMISSIONS, isOwner: true };
      }

      // Check if the transporter has block_visibility or block_all restriction on us
      const transporterBlocksUs = await checkRestrictionInDb(shipment.transporter_id, organization.id);
      if (transporterBlocksUs) {
        return { permissions: BLOCKED_PERMISSIONS, isOwner: false };
      }

      const isParty = 
        shipment.generator_id === organization.id || 
        shipment.recycler_id === organization.id;
      
      if (!isParty) {
        return { permissions: BLOCKED_PERMISSIONS, isOwner: false };
      }

      const { data: settings, error: settingsError } = await supabase
        .from('partner_visibility_settings')
        .select('*')
        .eq('organization_id', shipment.transporter_id)
        .eq('partner_organization_id', organization.id)
        .maybeSingle();

      // Determine recycler visibility: per-shipment flag overrides global setting
      const isGenerator = shipment.generator_id === organization.id;
      const isRecycler = shipment.recycler_id === organization.id;
      const perShipmentRecyclerHidden = isGenerator && (shipment as any).hide_recycler_from_generator === true;
      const globalRecyclerHidden = settings ? !(settings.can_view_recycler_info ?? true) : false;
      const canViewRecycler = isGenerator ? (!perShipmentRecyclerHidden && !globalRecyclerHidden) : true;

      // Determine generator visibility: per-shipment flag overrides global setting
      const perShipmentGeneratorHidden = isRecycler && (shipment as any).hide_generator_from_recycler === true;
      const globalGeneratorHidden = settings ? !((settings as any).can_view_generator_info ?? true) : false;
      const canViewGenerator = isRecycler ? (!perShipmentGeneratorHidden && !globalGeneratorHidden) : true;

      if (settingsError || !settings) {
        return {
          permissions: {
            ...DEFAULT_PERMISSIONS,
            canViewRecyclerInfo: isGenerator ? !perShipmentRecyclerHidden : true,
            canViewGeneratorInfo: isRecycler ? !perShipmentGeneratorHidden : true,
          },
          isOwner: false,
        };
      }

      return {
        permissions: {
          canViewMaps: settings.can_view_maps ?? true,
          canViewTracking: settings.can_view_tracking ?? true,
          canViewRoutes: settings.can_view_routes ?? true,
          canViewDriverLocation: settings.can_view_driver_location ?? true,
          canViewShipmentDetails: settings.can_view_shipment_details ?? true,
          canViewDriverInfo: settings.can_view_driver_info ?? true,
          canViewVehicleInfo: settings.can_view_vehicle_info ?? true,
          canViewEstimatedArrival: settings.can_view_estimated_arrival ?? true,
          canReceiveNotifications: settings.can_receive_notifications ?? true,
          canViewReports: settings.can_view_reports ?? true,
          canViewRecyclerInfo: canViewRecycler,
          canViewGeneratorInfo: canViewGenerator,
        },
        isOwner: false,
      };
    },
    enabled: !!shipmentId && !!organization?.id && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  if (isAdmin) {
    return {
      ...DEFAULT_PERMISSIONS,
      isLoading: false,
      isOwner: true,
    };
  }

  return {
    ...(data?.permissions ?? DEFAULT_PERMISSIONS),
    isLoading,
    isOwner: data?.isOwner ?? false,
  };
}

/**
 * Hook للتحقق من صلاحيات الرؤية لناقل معين
 */
export function useTransporterVisibility(transporterId: string | undefined): VisibilityPermissions {
  const { organization, roles } = useAuth();
  const isAdmin = roles.includes('admin');

  const { data, isLoading } = useQuery({
    queryKey: ['transporter-visibility', transporterId, organization?.id],
    queryFn: async (): Promise<{ permissions: Omit<VisibilityPermissions, 'isLoading' | 'isOwner'>; isOwner: boolean }> => {
      if (!transporterId || !organization?.id) {
        return { permissions: DEFAULT_PERMISSIONS, isOwner: false };
      }

      if (transporterId === organization.id) {
        return { permissions: DEFAULT_PERMISSIONS, isOwner: true };
      }

      const { data: settings, error } = await supabase
        .from('partner_visibility_settings')
        .select('*')
        .eq('organization_id', transporterId)
        .eq('partner_organization_id', organization.id)
        .maybeSingle();

      if (error || !settings) {
        return { permissions: DEFAULT_PERMISSIONS, isOwner: false };
      }

      return {
        permissions: {
          canViewMaps: settings.can_view_maps ?? true,
          canViewTracking: settings.can_view_tracking ?? true,
          canViewRoutes: settings.can_view_routes ?? true,
          canViewDriverLocation: settings.can_view_driver_location ?? true,
          canViewShipmentDetails: settings.can_view_shipment_details ?? true,
          canViewDriverInfo: settings.can_view_driver_info ?? true,
          canViewVehicleInfo: settings.can_view_vehicle_info ?? true,
          canViewEstimatedArrival: settings.can_view_estimated_arrival ?? true,
          canReceiveNotifications: settings.can_receive_notifications ?? true,
          canViewReports: settings.can_view_reports ?? true,
          canViewRecyclerInfo: settings.can_view_recycler_info ?? true,
          canViewGeneratorInfo: (settings as any).can_view_generator_info ?? true,
        },
        isOwner: false,
      };
    },
    enabled: !!transporterId && !!organization?.id && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  if (isAdmin) {
    return {
      ...DEFAULT_PERMISSIONS,
      isLoading: false,
      isOwner: true,
    };
  }

  return {
    ...(data?.permissions ?? DEFAULT_PERMISSIONS),
    isLoading,
    isOwner: data?.isOwner ?? false,
  };
}

/**
 * Hook بسيط للتحقق من صلاحية واحدة
 */
export function useCanView(
  shipmentId: string | undefined,
  permission: keyof Omit<VisibilityPermissions, 'isLoading' | 'isOwner'>
): { canView: boolean; isLoading: boolean } {
  const permissions = useShipmentVisibility(shipmentId);
  return {
    canView: permissions[permission],
    isLoading: permissions.isLoading,
  };
}

/**
 * دالة مساعدة للتحقق من الصلاحيات في الكود
 */
export async function checkVisibility(
  organizationId: string,
  transporterId: string
): Promise<Omit<VisibilityPermissions, 'isLoading' | 'isOwner'>> {
  if (organizationId === transporterId) {
    return DEFAULT_PERMISSIONS;
  }

  const { data: settings, error } = await supabase
    .from('partner_visibility_settings')
    .select('*')
    .eq('organization_id', transporterId)
    .eq('partner_organization_id', organizationId)
    .maybeSingle();

  if (error || !settings) {
    return DEFAULT_PERMISSIONS;
  }

  return {
    canViewMaps: settings.can_view_maps ?? true,
    canViewTracking: settings.can_view_tracking ?? true,
    canViewRoutes: settings.can_view_routes ?? true,
    canViewDriverLocation: settings.can_view_driver_location ?? true,
    canViewShipmentDetails: settings.can_view_shipment_details ?? true,
    canViewDriverInfo: settings.can_view_driver_info ?? true,
    canViewVehicleInfo: settings.can_view_vehicle_info ?? true,
    canViewEstimatedArrival: settings.can_view_estimated_arrival ?? true,
    canReceiveNotifications: settings.can_receive_notifications ?? true,
    canViewReports: settings.can_view_reports ?? true,
    canViewRecyclerInfo: settings.can_view_recycler_info ?? true,
    canViewGeneratorInfo: (settings as any).can_view_generator_info ?? true,
  };
}

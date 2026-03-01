import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface WMISEvent {
  id: string;
  organization_id: string;
  shipment_id: string | null;
  event_source: string;
  event_type: string;
  event_severity: string;
  event_title: string;
  event_description: string | null;
  event_data: Record<string, any>;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  device_id: string | null;
  device_type: string | null;
  device_name: string | null;
  actor_id: string | null;
  actor_name: string | null;
  acknowledged: boolean;
  resolved: boolean;
  notify_generator: boolean;
  notify_transporter: boolean;
  notify_recycler: boolean;
  evidence_urls: string[];
  created_at: string;
}

export interface LicenseCheckResult {
  result: 'pass' | 'fail' | 'warning';
  reason?: string;
  requested?: string;
  licensed?: string[];
  org_name?: string;
  expiry_date?: string;
}

export interface ConsultantGate {
  id: string;
  organization_id: string;
  gate_type: string;
  is_mandatory: boolean;
  auto_approve_below_kg: number | null;
  requires_site_visit: boolean;
  max_approval_hours: number;
  default_consultant_id: string | null;
  is_active: boolean;
}

// ═══════════════════════════════════════════════
// License Compliance Check
// ═══════════════════════════════════════════════

export const useCheckLicenseCompliance = () => {
  return useMutation({
    mutationFn: async (params: {
      organizationId: string;
      wasteType: string;
      shipmentId?: string;
    }): Promise<LicenseCheckResult> => {
      const { data, error } = await supabase.rpc('check_waste_license_compliance', {
        p_organization_id: params.organizationId,
        p_waste_type: params.wasteType,
        p_shipment_id: params.shipmentId || null,
      });
      if (error) throw error;
      return data as unknown as LicenseCheckResult;
    },
    onSuccess: (result) => {
      if (result.result === 'fail') {
        const messages: Record<string, string> = {
          waste_type_not_licensed: `⚠️ نوع المخلف "${result.requested}" غير مشمول في ترخيص ${result.org_name}. الأنواع المرخصة: ${result.licensed?.join('، ')}`,
          not_hazardous_certified: `🚫 ${result.org_name} غير معتمدة للتعامل مع المخلفات الخطرة`,
          license_expired: `❌ ترخيص ${result.org_name} منتهي الصلاحية (${result.expiry_date})`,
          organization_inactive: `🔒 ${result.org_name} غير نشطة أو موقوفة`,
          organization_not_found: 'الجهة غير موجودة',
        };
        toast.error(messages[result.reason || ''] || 'فشل التحقق من الترخيص');
      }
    },
  });
};

/**
 * Validate all parties in a shipment before creation
 */
export const useValidateShipmentParties = () => {
  const checkLicense = useCheckLicenseCompliance();

  return useMutation({
    mutationFn: async (params: {
      wasteType: string;
      generatorId?: string;
      transporterId?: string;
      recyclerId?: string;
      shipmentId?: string;
    }) => {
      const results: { party: string; result: LicenseCheckResult }[] = [];

      const checks = [
        { party: 'الناقل', id: params.transporterId },
        { party: 'المدوّر', id: params.recyclerId },
        { party: 'المولد', id: params.generatorId },
      ].filter(c => c.id);

      for (const check of checks) {
        const result = await checkLicense.mutateAsync({
          organizationId: check.id!,
          wasteType: params.wasteType,
          shipmentId: params.shipmentId,
        });
        results.push({ party: check.party, result });
      }

      const failures = results.filter(r => r.result.result === 'fail');
      return {
        isCompliant: failures.length === 0,
        results,
        failures,
      };
    },
  });
};

// ═══════════════════════════════════════════════
// WMIS Events (IoT/AI/Sensor)
// ═══════════════════════════════════════════════

export const useWMISEvents = (filters?: {
  shipmentId?: string;
  severity?: string;
  resolved?: boolean;
  limit?: number;
}) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['wmis-events', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from('wmis_events')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (filters?.shipmentId) query = query.eq('shipment_id', filters.shipmentId);
      if (filters?.severity) query = query.eq('event_severity', filters.severity);
      if (filters?.resolved !== undefined) query = query.eq('resolved', filters.resolved);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WMISEvent[];
    },
    enabled: !!organization?.id,
  });
};

export const useCreateWMISEvent = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      shipmentId?: string;
      eventSource: string;
      eventType: string;
      eventSeverity: string;
      eventTitle: string;
      eventDescription?: string;
      eventData?: Record<string, any>;
      locationLat?: number;
      locationLng?: number;
      locationName?: string;
      deviceId?: string;
      deviceType?: string;
      deviceName?: string;
      notifyGenerator?: boolean;
      notifyTransporter?: boolean;
      notifyRecycler?: boolean;
      notifyConsultant?: boolean;
      evidenceUrls?: string[];
    }) => {
      if (!organization?.id) throw new Error('No organization');
      const { data, error } = await supabase.from('wmis_events').insert({
        organization_id: organization.id,
        shipment_id: params.shipmentId || null,
        event_source: params.eventSource,
        event_type: params.eventType,
        event_severity: params.eventSeverity,
        event_title: params.eventTitle,
        event_description: params.eventDescription || null,
        event_data: params.eventData || {},
        location_lat: params.locationLat,
        location_lng: params.locationLng,
        location_name: params.locationName,
        device_id: params.deviceId,
        device_type: params.deviceType,
        device_name: params.deviceName,
        actor_id: user?.id,
        actor_name: null,
        notify_generator: params.notifyGenerator || false,
        notify_transporter: params.notifyTransporter || false,
        notify_recycler: params.notifyRecycler || false,
        notify_consultant: params.notifyConsultant || false,
        evidence_urls: params.evidenceUrls || [],
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wmis-events'] });
      toast.success('تم تسجيل الحدث بنجاح');
    },
  });
};

export const useAcknowledgeWMISEvent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('wmis_events')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wmis-events'] });
    },
  });
};

export const useResolveWMISEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { eventId: string; resolutionNotes: string }) => {
      const { error } = await supabase
        .from('wmis_events')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: params.resolutionNotes,
        })
        .eq('id', params.eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wmis-events'] });
      toast.success('تم حل الحدث');
    },
  });
};

// ═══════════════════════════════════════════════
// Consultant Gates
// ═══════════════════════════════════════════════

export const useConsultantGates = () => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['wmis-consultant-gates', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('wmis_consultant_gates')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as ConsultantGate[];
    },
    enabled: !!organization?.id,
  });
};

/**
 * Check if a shipment requires consultant approval before proceeding
 */
export const useCheckConsultantGate = () => {
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      gateType: string;
      shipmentId: string;
      weightKg?: number;
    }) => {
      if (!organization?.id) return { required: false };

      const { data: gates } = await supabase
        .from('wmis_consultant_gates')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('gate_type', params.gateType)
        .eq('is_active', true)
        .single();

      if (!gates) return { required: false };

      const gate = gates as ConsultantGate;

      // Check auto-approve threshold
      if (gate.auto_approve_below_kg && params.weightKg && params.weightKg < gate.auto_approve_below_kg) {
        return { required: false, autoApproved: true, reason: 'الوزن أقل من حد الموافقة التلقائية' };
      }

      // Check if shipment already has consultant approval
      const { data: shipment } = await supabase
        .from('shipments')
        .select('consultant_technical_approval')
        .eq('id', params.shipmentId)
        .single();

      if (shipment?.consultant_technical_approval === 'approved') {
        return { required: false, alreadyApproved: true };
      }

      return {
        required: true,
        gate,
        mandatory: gate.is_mandatory,
        requiresSiteVisit: gate.requires_site_visit,
        maxHours: gate.max_approval_hours,
        consultantId: gate.default_consultant_id,
      };
    },
  });
};

// ═══════════════════════════════════════════════
// Licensed Waste Types Management
// ═══════════════════════════════════════════════

export const useUpdateLicensedWasteTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      organizationId: string;
      licensedWasteTypes: string[];
      licensedWasteCategories?: string[];
      licenseScopeNotes?: string;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          licensed_waste_types: params.licensedWasteTypes,
          licensed_waste_categories: params.licensedWasteCategories || [],
          license_scope_notes: params.licenseScopeNotes || null,
        } as any)
        .eq('id', params.organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('تم تحديث أنواع المخلفات المرخصة');
    },
  });
};

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

export const WMIS_EVENT_SOURCES = [
  { value: 'iot_sensor', label: 'مستشعر IoT', icon: '📡' },
  { value: 'ai_vision', label: 'رؤية AI', icon: '🤖' },
  { value: 'gps_tracker', label: 'تتبع GPS', icon: '📍' },
  { value: 'weighbridge', label: 'ميزان', icon: '⚖️' },
  { value: 'manual', label: 'يدوي', icon: '✋' },
  { value: 'system', label: 'نظام', icon: '⚙️' },
];

export const WMIS_EVENT_TYPES = [
  { value: 'temperature_alert', label: 'تنبيه حرارة', category: 'sensor' },
  { value: 'weight_mismatch', label: 'تفاوت وزن', category: 'weighbridge' },
  { value: 'route_deviation', label: 'انحراف مسار', category: 'gps' },
  { value: 'spill_detected', label: 'انسكاب مكتشف', category: 'sensor' },
  { value: 'unauthorized_dump', label: 'تفريغ غير مصرح', category: 'gps' },
  { value: 'container_opened', label: 'فتح حاوية', category: 'sensor' },
  { value: 'geofence_breach', label: 'خرق جيوفنس', category: 'gps' },
  { value: 'speed_violation', label: 'تجاوز سرعة', category: 'gps' },
  { value: 'idle_alert', label: 'توقف مطول', category: 'gps' },
  { value: 'compliance_check', label: 'فحص امتثال', category: 'system' },
  { value: 'license_warning', label: 'تحذير ترخيص', category: 'system' },
  { value: 'document_missing', label: 'مستند ناقص', category: 'system' },
  { value: 'photo_verification', label: 'تحقق مرئي', category: 'ai' },
  { value: 'waste_classification', label: 'تصنيف مخلف', category: 'ai' },
  { value: 'custom', label: 'مخصص', category: 'manual' },
];

export const WMIS_SEVERITY_CONFIG = {
  info: { label: 'معلومة', color: 'bg-blue-100 text-blue-800', icon: 'ℹ️' },
  warning: { label: 'تحذير', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
  critical: { label: 'حرج', color: 'bg-orange-100 text-orange-800', icon: '🔶' },
  emergency: { label: 'طوارئ', color: 'bg-red-100 text-red-800', icon: '🚨' },
};

export const CONSULTANT_GATE_TYPES = [
  { value: 'shipment_completion', label: 'إتمام الشحنة' },
  { value: 'hazardous_transport', label: 'نقل مخلفات خطرة' },
  { value: 'disposal_certificate', label: 'شهادة التخلص' },
  { value: 'weight_discrepancy', label: 'تفاوت الأوزان' },
  { value: 'cross_border', label: 'نقل عابر للحدود' },
];

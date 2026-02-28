import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LifecycleGate {
  id: string;
  shipment_id: string;
  organization_id: string;
  gate_type: string;
  gate_status: string;
  gate_order: number;
  checked_by: string | null;
  checked_at: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const GATE_DEFINITIONS = [
  { gate_type: 'consultant_classification', gate_order: 1, label: 'تصنيف الاستشاري', labelEn: 'Consultant Classification' },
  { gate_type: 'consultant_approval', gate_order: 2, label: 'اعتماد الاستشاري', labelEn: 'Consultant Approval' },
  { gate_type: 'weight_verification', gate_order: 3, label: 'التحقق من الوزن', labelEn: 'Weight Verification' },
  { gate_type: 'geofence_verification', gate_order: 4, label: 'التحقق الجغرافي', labelEn: 'Geofence Verification' },
  { gate_type: 'safety_check', gate_order: 5, label: 'فحص السلامة', labelEn: 'Safety Check' },
  { gate_type: 'document_completion', gate_order: 6, label: 'اكتمال المستندات', labelEn: 'Document Completion' },
];

export const getGateLabel = (gateType: string) => {
  return GATE_DEFINITIONS.find(g => g.gate_type === gateType)?.label || gateType;
};

export const useJobLifecycle = (shipmentId?: string) => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: gates = [], isLoading } = useQuery({
    queryKey: ['job-lifecycle-gates', shipmentId],
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await supabase
        .from('job_lifecycle_gates')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('gate_order', { ascending: true });
      if (error) throw error;
      return (data || []) as LifecycleGate[];
    },
    enabled: !!shipmentId,
  });

  const initializeGates = useMutation({
    mutationFn: async (params: { shipmentId: string; organizationId: string; gateTypes?: string[] }) => {
      const types = params.gateTypes || GATE_DEFINITIONS.map(g => g.gate_type);
      const inserts = types.map(gt => {
        const def = GATE_DEFINITIONS.find(d => d.gate_type === gt);
        return {
          shipment_id: params.shipmentId,
          organization_id: params.organizationId,
          gate_type: gt,
          gate_order: def?.gate_order || 99,
        };
      });

      const { error } = await supabase
        .from('job_lifecycle_gates')
        .upsert(inserts, { onConflict: 'shipment_id,gate_type' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-lifecycle-gates', shipmentId] }),
  });

  const updateGate = useMutation({
    mutationFn: async (params: { gateId: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('job_lifecycle_gates')
        .update({
          gate_status: params.status,
          checked_by: user?.id,
          checked_at: new Date().toISOString(),
          notes: params.notes || null,
        })
        .eq('id', params.gateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-lifecycle-gates', shipmentId] });
      toast.success('تم تحديث البوابة بنجاح');
    },
  });

  const passedCount = gates.filter(g => g.gate_status === 'passed').length;
  const totalCount = gates.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;
  const nextPendingGate = gates.find(g => g.gate_status === 'pending');
  const progress = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return {
    gates,
    isLoading,
    initializeGates,
    updateGate,
    passedCount,
    totalCount,
    allPassed,
    nextPendingGate,
    progress,
    GATE_DEFINITIONS,
    getGateLabel,
  };
};

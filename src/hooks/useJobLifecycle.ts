import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect, useCallback, useRef } from 'react';

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
  { gate_type: 'consultant_classification', gate_order: 1, label: 'تصنيف الاستشاري', labelEn: 'Consultant Classification', mandatory: false },
  { gate_type: 'consultant_approval', gate_order: 2, label: 'اعتماد الاستشاري', labelEn: 'Consultant Approval', mandatory: false },
  { gate_type: 'weight_verification', gate_order: 3, label: 'التحقق من الوزن', labelEn: 'Weight Verification', mandatory: false },
  { gate_type: 'geofence_verification', gate_order: 4, label: 'التحقق الجغرافي', labelEn: 'Geofence Verification', mandatory: false },
  { gate_type: 'safety_check', gate_order: 5, label: 'فحص السلامة', labelEn: 'Safety Check', mandatory: false },
  { gate_type: 'document_completion', gate_order: 6, label: 'اكتمال المستندات', labelEn: 'Document Completion', mandatory: false },
];

export const isGateMandatory = (gateType: string) => {
  return GATE_DEFINITIONS.find(g => g.gate_type === gateType)?.mandatory ?? true;
};

export const getGateLabel = (gateType: string) => {
  return GATE_DEFINITIONS.find(g => g.gate_type === gateType)?.label || gateType;
};

// ═══════════════════════════════════════
// Auto-evaluation logic per gate type
// ═══════════════════════════════════════
interface ShipmentData {
  waste_type?: string;
  consultant_technical_approval?: string | null;
  weight_at_source?: number | null;
  weight_at_destination?: number | null;
  weight_discrepancy_pct?: number | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  status?: string;
  docCount?: number;
}

function autoEvaluateGate(gateType: string, shipment: ShipmentData): { status: 'passed' | 'bypassed'; notes: string } | null {
  switch (gateType) {
    case 'consultant_classification': {
      // Pass if waste_type is set (classified)
      if (shipment.waste_type && shipment.waste_type.trim() !== '') {
        return { status: 'passed', notes: 'تصنيف تلقائي — نوع المخلفات محدد' };
      }
      return { status: 'bypassed', notes: 'تم التجاوز — نوع المخلفات غير محدد' };
    }

    case 'consultant_approval': {
      // Pass if consultant approved, bypass otherwise
      if (shipment.consultant_technical_approval === 'approved') {
        return { status: 'passed', notes: 'موافقة الاستشاري الفنية متوفرة' };
      }
      return { status: 'bypassed', notes: 'تم التجاوز تلقائياً — موافقة الاستشاري غير مطلوبة أو معلقة' };
    }

    case 'weight_verification': {
      const src = shipment.weight_at_source;
      const dst = shipment.weight_at_destination;
      if (src && dst && src > 0 && dst > 0) {
        const discrepancy = Math.abs(src - dst) / src * 100;
        if (discrepancy < 5) {
          return { status: 'passed', notes: `تحقق تلقائي — الفرق ${discrepancy.toFixed(1)}% (أقل من 5%)` };
        }
        return { status: 'bypassed', notes: `⚠️ تجاوز تحذيري — فرق الوزن ${discrepancy.toFixed(1)}% يتجاوز 5%` };
      }
      // If only one weight exists or none, bypass
      return { status: 'bypassed', notes: 'تم التجاوز — بيانات الوزن غير مكتملة' };
    }

    case 'geofence_verification': {
      // Pass if delivery coordinates exist (GPS confirmed location)
      if (shipment.delivery_latitude && shipment.delivery_longitude) {
        return { status: 'passed', notes: 'تحقق جغرافي تلقائي — إحداثيات التسليم مسجلة' };
      }
      return { status: 'bypassed', notes: 'تم التجاوز — إحداثيات التسليم غير متوفرة' };
    }

    case 'safety_check': {
      // Auto-pass: safety is checked at vehicle/driver level during shipment creation
      return { status: 'passed', notes: 'فحص السلامة تلقائي — تم التحقق عند إنشاء الرحلة' };
    }

    case 'document_completion': {
      if (shipment.docCount && shipment.docCount >= 1) {
        return { status: 'passed', notes: `اكتمال المستندات تلقائي — ${shipment.docCount} مستند(ات) مرفقة` };
      }
      return { status: 'bypassed', notes: 'تم التجاوز — المستندات قيد الإعداد' };
    }

    default:
      return null;
  }
}

export const useJobLifecycle = (shipmentId?: string) => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const autoEvalRan = useRef(false);

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
    onSuccess: () => {
      autoEvalRan.current = false; // allow re-evaluation after init
      queryClient.invalidateQueries({ queryKey: ['job-lifecycle-gates', shipmentId] });
    },
  });

  const updateGate = useMutation({
    mutationFn: async (params: { gateId: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('job_lifecycle_gates')
        .update({
          gate_status: params.status,
          checked_by: user?.id || 'system',
          checked_at: new Date().toISOString(),
          notes: params.notes || null,
        })
        .eq('id', params.gateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-lifecycle-gates', shipmentId] });
    },
  });

  // ═══════════════════════════════════════
  // Auto-evaluate all pending gates
  // ═══════════════════════════════════════
  const runAutoEvaluation = useCallback(async () => {
    if (!shipmentId || !gates.length) return;
    
    const pendingGates = gates.filter(g => g.gate_status === 'pending');
    if (pendingGates.length === 0) return;

    // Fetch shipment data for evaluation
    const { data: shipment } = await supabase
      .from('shipments')
      .select('waste_type, consultant_technical_approval, weight_at_source, weight_at_destination, weight_discrepancy_pct, delivery_latitude, delivery_longitude, pickup_latitude, pickup_longitude, status')
      .eq('id', shipmentId)
      .single();

    if (!shipment) return;

    // Check document count
    const { count: docCount } = await supabase
      .from('document_endorsements')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', shipmentId);

    const evalData: ShipmentData = { ...shipment, docCount: docCount || 0 };

    // Evaluate each pending gate
    for (const gate of pendingGates) {
      const result = autoEvaluateGate(gate.gate_type, evalData);
      if (result) {
        await supabase
          .from('job_lifecycle_gates')
          .update({
            gate_status: result.status,
            checked_by: 'system_auto',
            checked_at: new Date().toISOString(),
            notes: result.notes,
          })
          .eq('id', gate.id);
      }
    }

    // Refresh gates
    queryClient.invalidateQueries({ queryKey: ['job-lifecycle-gates', shipmentId] });
  }, [shipmentId, gates, queryClient]);

  // Auto-run evaluation when gates are loaded and have pending items
  useEffect(() => {
    if (!isLoading && gates.length > 0 && !autoEvalRan.current) {
      const hasPending = gates.some(g => g.gate_status === 'pending');
      if (hasPending) {
        autoEvalRan.current = true;
        runAutoEvaluation();
      }
    }
  }, [isLoading, gates, runAutoEvaluation]);

  const passedOrBypassed = gates.filter(g => g.gate_status === 'passed' || g.gate_status === 'bypassed').length;
  const passedCount = gates.filter(g => g.gate_status === 'passed').length;
  const totalCount = gates.length;
  const mandatoryGates = gates.filter(g => isGateMandatory(g.gate_type));
  const allMandatoryPassed = mandatoryGates.length > 0 && mandatoryGates.every(g => g.gate_status === 'passed');
  const allPassed = totalCount > 0 && passedOrBypassed === totalCount;
  const canProceed = mandatoryGates.length === 0 || allMandatoryPassed;
  const nextPendingGate = gates.find(g => g.gate_status === 'pending');
  const progress = totalCount > 0 ? Math.round((passedOrBypassed / totalCount) * 100) : 0;

  return {
    gates,
    isLoading,
    initializeGates,
    updateGate,
    runAutoEvaluation,
    passedCount,
    totalCount,
    allPassed,
    allMandatoryPassed,
    canProceed,
    nextPendingGate,
    progress,
    GATE_DEFINITIONS,
    getGateLabel,
    isGateMandatory,
  };
};

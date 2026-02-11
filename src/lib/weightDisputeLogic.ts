import { supabase } from '@/integrations/supabase/client';

const WEIGHT_DISPUTE_THRESHOLD = 5; // 5% difference

export interface WeightDisputeResult {
  hasDispute: boolean;
  differencePercentage: number;
  generatorWeight: number;
  recyclerWeight: number;
}

export function checkWeightDispute(
  generatorWeight: number,
  recyclerWeight: number,
  thresholdPercent: number = WEIGHT_DISPUTE_THRESHOLD
): WeightDisputeResult {
  if (!generatorWeight || !recyclerWeight || generatorWeight <= 0 || recyclerWeight <= 0) {
    return { hasDispute: false, differencePercentage: 0, generatorWeight, recyclerWeight };
  }

  const diff = Math.abs(generatorWeight - recyclerWeight);
  const differencePercentage = (diff / generatorWeight) * 100;

  return {
    hasDispute: differencePercentage > thresholdPercent,
    differencePercentage: Math.round(differencePercentage * 100) / 100,
    generatorWeight,
    recyclerWeight,
  };
}

export async function createWeightDispute(
  shipmentId: string,
  organizationId: string,
  generatorWeight: number,
  recyclerWeight: number,
  differencePercentage: number
) {
  // Create dispute record
  const { error: disputeError } = await supabase
    .from('weight_disputes')
    .insert({
      shipment_id: shipmentId,
      organization_id: organizationId,
      generator_weight: generatorWeight,
      recycler_weight: recyclerWeight,
      difference_percentage: differencePercentage,
      threshold_percentage: WEIGHT_DISPUTE_THRESHOLD,
      status: 'pending',
    });

  if (disputeError) {
    console.error('Error creating dispute:', disputeError);
    throw disputeError;
  }

  // Update shipment with dispute info
  const { error: shipmentError } = await supabase
    .from('shipments')
    .update({
      weight_dispute_status: 'pending',
      weight_dispute_percentage: differencePercentage,
      weight_dispute_created_at: new Date().toISOString(),
      generator_declared_weight: generatorWeight,
      recycler_received_weight: recyclerWeight,
    } as any)
    .eq('id', shipmentId);

  if (shipmentError) {
    console.error('Error updating shipment:', shipmentError);
    throw shipmentError;
  }

  // Send notification to admins
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      title: 'تنبيه: نزاع وزن في شحنة',
      message: `فرق الوزن ${differencePercentage}% في الشحنة - وزن المولد: ${generatorWeight} كجم، وزن المدور: ${recyclerWeight} كجم. تم تعليق العملية للمراجعة.`,
      type: 'weight_dispute',
      reference_id: shipmentId,
      reference_type: 'shipment',
    }));

    await supabase.from('notifications').insert(notifications);
  }

  return true;
}

export async function resolveWeightDispute(
  disputeId: string,
  shipmentId: string,
  resolvedBy: string,
  adminNotes: string,
  action: 'approve' | 'reject'
) {
  const now = new Date().toISOString();

  const { error: disputeError } = await supabase
    .from('weight_disputes')
    .update({
      status: action === 'approve' ? 'resolved_approved' : 'resolved_rejected',
      admin_notes: adminNotes,
      resolved_by: resolvedBy,
      resolved_at: now,
      updated_at: now,
    })
    .eq('id', disputeId);

  if (disputeError) throw disputeError;

  const { error: shipmentError } = await supabase
    .from('shipments')
    .update({
      weight_dispute_status: action === 'approve' ? 'resolved_approved' : 'resolved_rejected',
      weight_dispute_resolved_at: now,
      weight_dispute_resolved_by: resolvedBy,
    } as any)
    .eq('id', shipmentId);

  if (shipmentError) throw shipmentError;

  return true;
}

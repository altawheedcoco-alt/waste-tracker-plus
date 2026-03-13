import { supabase } from '@/integrations/supabase/client';
import { withTagline } from '@/utils/platformTaglines';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { isAutoActionEnabled } from '@/utils/autoActionChecker';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
import { resolveDocVisibilityForAllParties } from '@/utils/documentVisibilityResolver';

/**
 * Auto-creates a shipment receipt when a transporter delivers/receives a shipment.
 * Skips if a receipt already exists for this shipment or if auto-action is disabled.
 */
export async function autoCreateReceipt(
  shipmentId: string,
  transporterId: string,
  userId?: string
): Promise<void> {
  // Check if auto-action is enabled for this organization
  if (!(await isAutoActionEnabled(transporterId, 'auto_receipt_generation'))) return;

  // Check if receipt already exists
  const { data: existing } = await supabase
    .from('shipment_receipts')
    .select('id')
    .eq('shipment_id', shipmentId)
    .maybeSingle();

  if (existing) return;

  // Fetch shipment details
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('id, shipment_number, waste_type, quantity, unit, generator_id, transporter_id')
    .eq('id', shipmentId)
    .single();

  if (shipmentError || !shipment) {
    console.error('Failed to fetch shipment for auto-receipt:', shipmentError);
    return;
  }

  const generatorId = shipment.generator_id;

  // Resolve visibility for all parties
  const visibleTo = await resolveDocVisibilityForAllParties(transporterId, 'receipts');

  // Generate receipt number
  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

  // Generate mandatory verification identity
  const identity = generateDocumentIdentity('shipment_receipt', receiptNumber, {
    shipmentNumber: shipment.shipment_number,
  });

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    receipt_number: receiptNumber,
    transporter_id: transporterId,
    generator_id: generatorId,
    waste_type: shipment.waste_type || 'other',
    declared_weight: shipment.quantity || 0,
    actual_weight: shipment.quantity || 0,
    unit: shipment.unit || 'ton',
    pickup_date: new Date().toISOString(),
    status: 'pending',
    notes: 'تم الإنشاء تلقائياً عند استلام الشحنة',
    created_by: userId || null,
    visible_to: visibleTo,
    ...identity,
  };

  const { data: receiptData, error } = await supabase
    .from('shipment_receipts')
    .insert(insertData as any)
    .select('id, receipt_number')
    .single();

  if (error) {
    console.error('Auto receipt creation error:', error);
    throw error;
  }

  // Only notify generator if transporter docs are visible to them
  if (generatorId && visibleTo.generator !== false) {
    try {
      const { data: generatorUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', generatorId)
        .limit(10);

      if (generatorUsers && generatorUsers.length > 0) {
        await sendBulkDualNotification({
          user_ids: generatorUsers.map((u: any) => u.user_id),
          title: '🧾 شهادة استلام جديدة',
          message: withTagline(`تم إصدار شهادة استلام ${receiptData?.receipt_number || receiptNumber} للشحنة ${shipment.shipment_number}`),
          type: 'receipt_issued',
          reference_id: shipmentId,
          reference_type: 'shipment',
        });
      }
    } catch (notifError) {
      console.error('Failed to send receipt notification:', notifError);
    }
  }

}

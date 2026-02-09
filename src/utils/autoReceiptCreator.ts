import { supabase } from '@/integrations/supabase/client';

/**
 * Auto-creates a shipment receipt when a transporter delivers/receives a shipment.
 * Skips if a receipt already exists for this shipment.
 */
export async function autoCreateReceipt(
  shipmentId: string,
  transporterId: string,
  userId?: string
): Promise<void> {
  // Check if receipt already exists
  const { data: existing } = await supabase
    .from('shipment_receipts')
    .select('id')
    .eq('shipment_id', shipmentId)
    .maybeSingle();

  if (existing) {
    console.log('Receipt already exists for shipment:', shipmentId);
    return;
  }

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

  // Generate receipt number
  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    receipt_number: receiptNumber,
    transporter_id: transporterId,
    generator_id: generatorId,
    waste_type: shipment.waste_type || 'other',
    declared_weight: shipment.quantity || 0,
    unit: shipment.unit || 'ton',
    pickup_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: 'تم الإنشاء تلقائياً عند استلام الشحنة',
  };

  const { error } = await supabase
    .from('shipment_receipts')
    .insert(insertData as any);

  if (error) {
    console.error('Auto receipt creation error:', error);
    throw error;
  }

  console.log('Auto receipt created for shipment:', shipmentId);
}

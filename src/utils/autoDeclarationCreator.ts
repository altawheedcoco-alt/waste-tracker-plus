import { supabase } from '@/integrations/supabase/client';

const GENERATOR_AUTO_DECLARATION_TEXT = `إقرار تسليم تلقائي من المولّد
تم إنشاء هذا الإقرار تلقائياً بمجرد تسليم الشحنة لجهة النقل.
يُقر المولّد بأنه قد سلّم المخلفات المذكورة للناقل وفقاً للبيانات المسجلة في النظام.
يحق للمولّد إلغاء هذا الإقرار مع ذكر الأسباب خلال الفترة المسموحة.`;

const RECYCLER_AUTO_DECLARATION_TEXT = `إقرار استلام تلقائي من المدوّر/جهة التخلص
تم إنشاء هذا الإقرار تلقائياً بمجرد تأكيد استلام الشحنة من الناقل/السائق.
يُقر المدوّر بأنه قد استلم المخلفات المذكورة وفقاً للبيانات المسجلة في النظام.
يحق للمدوّر إلغاء هذا الإقرار مع ذكر الأسباب خلال الفترة المسموحة.`;

/**
 * Auto-creates a generator handover declaration when shipment goes to transporter (in_transit).
 */
export async function autoCreateGeneratorDeclaration(
  shipmentId: string,
  generatorOrgId: string,
  userId: string
): Promise<void> {
  // Check if already exists
  const { data: existing } = await (supabase
    .from('delivery_declarations') as any)
    .select('id')
    .eq('shipment_id', shipmentId)
    .eq('declaration_type', 'generator_handover')
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return;

  // Fetch shipment details
  const { data: shipment } = await supabase
    .from('shipments')
    .select('shipment_number, waste_type, quantity, unit, generator_id, transporter_id, recycler_id')
    .eq('id', shipmentId)
    .single();

  if (!shipment) return;

  // Fetch org names
  const orgIds = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(Boolean);
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);

  const getOrgName = (id?: string | null) => orgs?.find(o => o.id === id)?.name || '';

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: generatorOrgId,
    declaration_type: 'generator_handover',
    declaration_text: GENERATOR_AUTO_DECLARATION_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    generator_name: getOrgName(shipment.generator_id),
    transporter_name: getOrgName(shipment.transporter_id),
    recycler_name: getOrgName(shipment.recycler_id),
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto generator declaration error:', error);
  } else {
    console.log('Auto generator declaration created for shipment:', shipmentId);
  }
}

/**
 * Auto-creates a recycler receipt declaration when shipment is delivered.
 */
export async function autoCreateRecyclerDeclaration(
  shipmentId: string,
  recyclerOrgId: string,
  userId: string
): Promise<void> {
  // Check if already exists
  const { data: existing } = await (supabase
    .from('delivery_declarations') as any)
    .select('id')
    .eq('shipment_id', shipmentId)
    .eq('declaration_type', 'recycler_receipt')
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return;

  const { data: shipment } = await supabase
    .from('shipments')
    .select('shipment_number, waste_type, quantity, unit, generator_id, transporter_id, recycler_id')
    .eq('id', shipmentId)
    .single();

  if (!shipment) return;

  const orgIds = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(Boolean);
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);

  const getOrgName = (id?: string | null) => orgs?.find(o => o.id === id)?.name || '';

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: recyclerOrgId,
    declaration_type: 'recycler_receipt',
    declaration_text: RECYCLER_AUTO_DECLARATION_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    generator_name: getOrgName(shipment.generator_id),
    transporter_name: getOrgName(shipment.transporter_id),
    recycler_name: getOrgName(shipment.recycler_id),
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto recycler declaration error:', error);
  } else {
    console.log('Auto recycler declaration created for shipment:', shipmentId);
  }
}

/**
 * Reject/cancel a declaration with a reason.
 */
export async function rejectDeclaration(
  declarationId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  const { error } = await (supabase
    .from('delivery_declarations') as any)
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: rejectedBy,
      rejection_reason: reason,
    })
    .eq('id', declarationId);

  if (error) {
    console.error('Declaration rejection error:', error);
    throw error;
  }
}

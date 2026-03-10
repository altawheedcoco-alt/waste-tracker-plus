import { supabase } from '@/integrations/supabase/client';
import { withTagline } from '@/utils/platformTaglines';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';

const GENERATOR_AUTO_DECLARATION_TEXT = `إقرار تسليم مخلفات — صادر تلقائياً من المولّد

أولاً — إثبات التسليم:
يُقر المولّد بأنه قد سلّم المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها إلى ممثل جهة النقل المعتمدة، وأن البيانات المسجلة في النظام (النوع، الكمية، التصنيف، درجة الخطورة) صحيحة ودقيقة وتمثل الواقع الفعلي لحظة التسليم.

ثانياً — المسؤولية عن صحة البيانات:
يتحمل المولّد المسؤولية المدنية والجنائية الكاملة عن صحة بيانات المخلفات المُسلّمة، بما في ذلك التصنيف وفقاً لقائمة بازل الدولية والتشريعات المصرية النافذة. وأي بيانات مغلوطة أو مضللة تُعد مخالفة تستوجب المساءلة القانونية والجزائية وفقاً لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية.

ثالثاً — الالتزام بالاشتراطات البيئية والصحية:
يُقر المولّد بأن المخلفات قد تم فرزها وتجهيزها وتعبئتها وفقاً للاشتراطات البيئية والصحية المعتمدة من جهاز تنظيم إدارة المخلفات (WMRA) وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل.

رابعاً — سلسلة الحيازة:
يمثل هذا التسليم بداية سلسلة الحيازة القانونية (Chain of Custody) للشحنة. أي تلاعب أو تغيير بعد لحظة التسليم لا يقع تحت مسؤولية المولّد.

خامساً — الالتزام بشروط وسياسات المنصة:
يخضع هذا الإقرار لشروط وأحكام وسياسات منصة iRecycle المنشورة والمعتمدة، والمخالف يتحمل كافة التبعات القانونية المدنية والجنائية المترتبة على ذلك.

سادساً — المرجعية القانونية:
يخضع هذا الإقرار لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020، وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل، وقانون حماية المستهلك رقم 181 لسنة 2018، واتفاقية بازل بشأن التحكم في نقل النفايات الخطرة والتخلص منها عبر الحدود.

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية SHA-256 ولا يجوز تعديله أو التلاعب به. يحق لأي طرف إلغاء هذا الإقرار مع ذكر الأسباب، ويظل محفوظاً في سجل الشحنة حتى بعد الإلغاء.`;

const RECYCLER_AUTO_DECLARATION_TEXT = `إقرار استلام مخلفات — صادر تلقائياً من المدوّر/جهة التخلص

أولاً — إثبات الاستلام:
يُقر المدوّر/جهة التخلص بأنه قد استلم المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها من ممثل جهة النقل المعتمدة، وأن البيانات المسجلة في النظام مطابقة للواقع الفعلي عند الاستلام.

ثانياً — المسؤولية عن المعالجة:
يتحمل المدوّر/جهة التخلص المسؤولية المدنية والجنائية الكاملة عن المعالجة الآمنة والسليمة بيئياً للمخلفات المستلمة وفقاً للتراخيص الممنوحة والمعايير البيئية المعتمدة. وأي إخلال بمعايير المعالجة أو التخلص يستوجب المساءلة القانونية والجزائية.

ثالثاً — الالتزام البيئي:
يلتزم المدوّر بمعالجة المخلفات وفقاً لاشتراطات جهاز تنظيم إدارة المخلفات (WMRA) وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل، والمعايير الدولية المعتمدة (ISO 14001).

رابعاً — سلسلة الحيازة:
يمثل هذا الاستلام نقل المسؤولية القانونية عن الشحنة بالكامل إلى المدوّر/جهة التخلص ضمن سلسلة الحيازة (Chain of Custody).

خامساً — الالتزام بشروط وسياسات المنصة:
يخضع هذا الإقرار لشروط وأحكام وسياسات منصة iRecycle المنشورة والمعتمدة، والمخالف يتحمل كافة التبعات القانونية المدنية والجنائية المترتبة على ذلك.

سادساً — المرجعية القانونية:
يخضع هذا الإقرار لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020، وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل، واتفاقية بازل بشأن التحكم في نقل النفايات الخطرة والتخلص منها عبر الحدود.

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية SHA-256 ولا يجوز تعديله أو التلاعب به. يحق لأي طرف إلغاء هذا الإقرار مع ذكر الأسباب، ويظل محفوظاً في سجل الشحنة حتى بعد الإلغاء.`;

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
    // declaration created successfully
    
    // Send notification to transporter about generator declaration
    try {
      const transporterId = shipment.transporter_id;
      if (transporterId) {
        const { data: transporterUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', transporterId)
          .limit(10);

        if (transporterUsers && transporterUsers.length > 0) {
          await sendBulkDualNotification({
            user_ids: transporterUsers.map((u: any) => u.user_id),
            title: '📝 إقرار تسليم جديد من المولّد',
            message: withTagline(`أصدر المولّد "${getOrgName(shipment.generator_id)}" إقرار تسليم للشحنة ${shipment.shipment_number}. يرجى مراجعة المستند والتأكيد.`),
            type: 'document_issued',
            reference_id: shipmentId,
            reference_type: 'shipment',
          });
        }
      }
    } catch (notifErr) {
      console.error('Generator declaration notification failed:', notifErr);
    }
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
    
    // Send notification to generator & transporter about recycler receipt
    try {
      const notifyOrgIds = [shipment.generator_id, shipment.transporter_id].filter(Boolean);
      if (notifyOrgIds.length > 0) {
        const { data: usersToNotify } = await supabase
          .from('profiles')
          .select('user_id')
          .in('organization_id', notifyOrgIds)
          .limit(20);

        if (usersToNotify && usersToNotify.length > 0) {
          await sendBulkDualNotification({
            user_ids: usersToNotify.map((u: any) => u.user_id),
            title: '📥 إقرار استلام من المدوّر/جهة التخلص',
            message: withTagline(`أصدر المدوّر "${getOrgName(shipment.recycler_id)}" إقرار استلام للشحنة ${shipment.shipment_number}. تم توثيق سلسلة الحيازة بنجاح.`),
            type: 'document_issued',
            reference_id: shipmentId,
            reference_type: 'shipment',
          });
        }
      }
    } catch (notifErr) {
      console.error('Recycler declaration notification failed:', notifErr);
    }
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

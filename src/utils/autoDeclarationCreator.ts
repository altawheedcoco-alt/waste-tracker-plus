import { supabase } from '@/integrations/supabase/client';
import { withTagline } from '@/utils/platformTaglines';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { isAutoActionEnabled } from '@/utils/autoActionChecker';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
import { resolveDocVisibilityForAllParties, getDocCategory, type DocumentVisibleTo } from '@/utils/documentVisibilityResolver';

// ─── Declaration Texts ───

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

const TRANSPORTER_AUTO_DECLARATION_TEXT = `إقرار نقل مخلفات — صادر تلقائياً من الناقل

أولاً — إثبات الاستلام والنقل:
يُقر الناقل بأنه قد استلم المخلفات المذكورة أعلاه من المولّد وبدأ عملية النقل وفقاً للمسار المعتمد والتراخيص السارية.

ثانياً — المسؤولية عن النقل الآمن:
يتحمل الناقل المسؤولية الكاملة عن سلامة المخلفات أثناء النقل، والالتزام بمعايير السلامة والأمان والاشتراطات البيئية طوال مسار الرحلة.

ثالثاً — الالتزام بالتراخيص والمركبات:
يُقر الناقل بأن المركبة المستخدمة مرخصة ومجهزة لنقل هذا النوع من المخلفات، وأن السائق يحمل التراخيص والشهادات المطلوبة.

رابعاً — سلسلة الحيازة:
يُعد هذا الإقرار جزءاً من سلسلة الحيازة القانونية (Chain of Custody). الناقل مسؤول عن الشحنة منذ لحظة الاستلام حتى التسليم الرسمي للجهة المستقبلة.

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية ولا يجوز تعديله أو التلاعب به.`;

const RECYCLER_AUTO_DECLARATION_TEXT = `إقرار استلام مخلفات — صادر تلقائياً من المدوّر/جهة التخلص

أولاً — إثبات الاستلام:
يُقر المدوّر/جهة التخلص بأنه قد استلم المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها من ممثل جهة النقل المعتمدة، وأن البيانات المسجلة في النظام مطابقة للواقع الفعلي عند الاستلام.

ثانياً — المسؤولية عن المعالجة:
يتحمل المدوّر/جهة التخلص المسؤولية المدنية والجنائية الكاملة عن المعالجة الآمنة والسليمة بيئياً للمخلفات المستلمة وفقاً للتراخيص الممنوحة والمعايير البيئية المعتمدة.

ثالثاً — الالتزام البيئي:
يلتزم المدوّر بمعالجة المخلفات وفقاً لاشتراطات جهاز تنظيم إدارة المخلفات (WMRA) وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل.

رابعاً — سلسلة الحيازة:
يمثل هذا الاستلام نقل المسؤولية القانونية عن الشحنة بالكامل إلى المدوّر/جهة التخلص ضمن سلسلة الحيازة (Chain of Custody).

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية ولا يجوز تعديله أو التلاعب به.`;

const RECYCLER_RECYCLING_CERTIFICATE_TEXT = `شهادة تدوير مخلفات — صادرة تلقائياً من المدوّر

أولاً — إثبات التدوير:
يُقر المدوّر بأنه قد أتمّ عملية تدوير ومعالجة المخلفات المذكورة أعلاه بالكامل وفقاً للمعايير البيئية المعتمدة والتراخيص السارية.

ثانياً — مخرجات التدوير:
تم تحويل المخلفات إلى مواد قابلة لإعادة الاستخدام وفقاً لمعايير الجودة المعتمدة من جهاز تنظيم إدارة المخلفات (WMRA).

ثالثاً — التوثيق البيئي:
تم توثيق كافة مراحل عملية التدوير بما يتوافق مع اشتراطات قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل.

رابعاً — سلسلة الحيازة:
تُعد هذه الشهادة إثباتاً لإتمام عملية التدوير ضمن سلسلة الحيازة القانونية (Chain of Custody) للشحنة.

⚠️ تنبيه: هذه الشهادة مسجلة إلكترونياً ومحمية ببصمة رقمية ولا يجوز تعديلها أو التلاعب بها.`;

const DISPOSAL_RECEIPT_DECLARATION_TEXT = `إقرار استلام مخلفات — صادر تلقائياً من جهة التخلص

أولاً — إثبات الاستلام:
تُقر جهة التخلص بأنها قد استلمت المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها من ممثل جهة النقل المعتمدة، وأن البيانات المسجلة في النظام مطابقة للواقع الفعلي عند الاستلام.

ثانياً — المسؤولية عن المخلفات:
تتحمل جهة التخلص المسؤولية الكاملة عن المخلفات المستلمة من لحظة الاستلام، بما في ذلك التخزين المؤقت والمعالجة والتخلص النهائي.

ثالثاً — الالتزام البيئي:
تلتزم جهة التخلص بمعالجة المخلفات وفقاً لاشتراطات WMRA والتراخيص الممنوحة.

رابعاً — سلسلة الحيازة:
يمثل هذا الاستلام نقل المسؤولية القانونية عن الشحنة بالكامل إلى جهة التخلص ضمن سلسلة الحيازة (Chain of Custody).

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية ولا يجوز تعديله أو التلاعب به.`;

const DISPOSAL_CERTIFICATE_TEXT = `شهادة تخلص نهائي من مخلفات — صادرة تلقائياً من جهة التخلص

أولاً — إثبات التخلص:
تُقر جهة التخلص بأنها قد باشرت وأتمّت عمليات التخلص النهائي من المخلفات المذكورة أعلاه وفقاً للطريقة المعتمدة (دفن صحي / حرق آمن / معالجة كيميائية) والتراخيص السارية.

ثانياً — المسؤولية البيئية:
تتحمل جهة التخلص المسؤولية الكاملة عن ضمان عدم تسرب أو تلوث أي مكونات من المخلفات إلى البيئة المحيطة أثناء وبعد عملية التخلص.

ثالثاً — التوثيق والرقابة:
تم توثيق عملية التخلص بالكامل وفقاً لمتطلبات WMRA والجهات الرقابية المختصة.

رابعاً — سلسلة الحيازة:
تُعد هذه الشهادة نهاية سلسلة الحيازة القانونية (Chain of Custody) للشحنة.

⚠️ تنبيه: هذه الشهادة مسجلة إلكترونياً ومحمية ببصمة رقمية ولا يجوز تعديلها أو التلاعب بها.`;

const DRIVER_AUTO_CONFIRMATION_TEXT = `إقرار سائق — استلام شحنة — صادر تلقائياً

أولاً — إثبات الاستلام الميداني:
يُقر السائق بأنه قد استلم الشحنة ميدانياً من الجهة المولدة وتحقق من مطابقتها للبيانات المسجلة في النظام.

ثانياً — حالة المركبة:
يُقر السائق بأن المركبة المستخدمة في حالة سليمة ومطابقة لاشتراطات النقل.

ثالثاً — الالتزام بالمسار:
يلتزم السائق بالمسار المحدد في النظام وعدم الانحراف عنه دون إذن مسبق.

رابعاً — سلسلة الحيازة:
يُعد هذا الإقرار جزءاً من سلسلة الحيازة القانونية (Chain of Custody). السائق مسؤول عن الشحنة منذ لحظة الاستلام حتى التسليم.

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومرتبط بموقع GPS السائق لحظة التأكيد.`;

const TRANSPORTER_DELIVERY_DECLARATION_TEXT = `إقرار تسليم مخلفات — صادر تلقائياً من الناقل

أولاً — إثبات التسليم:
يُقر الناقل بأنه قد سلّم المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها إلى جهة التدوير / جهة التخلص النهائي المعتمدة، وأن البيانات المسجلة في النظام مطابقة للواقع الفعلي لحظة التسليم.

ثانياً — نقل المسؤولية:
بموجب هذا الإقرار، تنتقل المسؤولية الكاملة عن المخلفات من الناقل إلى الجهة المستقبلة (المدوّر أو جهة التخلص) ضمن سلسلة الحيازة القانونية.

ثالثاً — التوثيق:
تم توثيق عملية التسليم بما يتوافق مع اشتراطات قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020.

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومحمي ببصمة رقمية ولا يجوز تعديله أو التلاعب به.`;

const DRIVER_DELIVERY_DECLARATION_TEXT = `إقرار سائق — تسليم شحنة — صادر تلقائياً

أولاً — إثبات التسليم:
يُقر السائق بأنه قد سلّم الشحنة بكامل محتوياتها ومواصفاتها إلى جهة التدوير / جهة التخلص النهائي المعتمدة ميدانياً.

ثانياً — مطابقة البيانات:
يُقر السائق بأن الكمية والنوع المسلّمين مطابقان للبيانات المسجلة في النظام عند الاستلام.

ثالثاً — سلسلة الحيازة:
يُعد هذا الإقرار إنهاءً لمسؤولية السائق عن الشحنة ضمن سلسلة الحيازة القانونية (Chain of Custody).

⚠️ تنبيه: هذا الإقرار مسجل إلكترونياً ومرتبط بموقع GPS السائق لحظة التسليم.`;

// ─── Visibility Masking Helper ───

interface ShipmentParties {
  generator_id?: string | null;
  transporter_id?: string | null;
  recycler_id?: string | null;
  hide_recycler_from_generator?: boolean;
  hide_generator_from_recycler?: boolean;
}

/**
 * Apply visibility masking to org names based on shipment settings.
 * - If hide_recycler_from_generator: generator's copy shows "جهة مخفية" for recycler
 * - If hide_generator_from_recycler: recycler's copy shows "جهة مخفية" for generator
 */
function applyVisibilityMasking(
  orgNames: { generator: string; transporter: string; recycler: string },
  shipment: ShipmentParties,
  declaringOrgId: string,
): { generator_name: string; transporter_name: string; recycler_name: string } {
  const masked = { ...orgNames };
  const HIDDEN = 'جهة مخفية';

  // If the declaring org is the generator and recycler should be hidden from them
  if (declaringOrgId === shipment.generator_id && shipment.hide_recycler_from_generator) {
    masked.recycler = HIDDEN;
  }
  // If the declaring org is the recycler and generator should be hidden from them
  if (declaringOrgId === shipment.recycler_id && shipment.hide_generator_from_recycler) {
    masked.generator = HIDDEN;
  }

  return {
    generator_name: masked.generator,
    transporter_name: masked.transporter,
    recycler_name: masked.recycler,
  };
}

// ─── Visibility Resolver (uses granular JSONB settings) ───

/**
 * @deprecated Use resolveDocVisibilityForAllParties from documentVisibilityResolver instead.
 */
export async function isTransporterDocsVisibleToGenerator(transporterOrgId: string): Promise<boolean> {
  const vis = await resolveDocVisibilityForAllParties(transporterOrgId, 'declarations');
  return vis.generator !== false;
}

/**
 * Resolves visibility for a document and builds the visible_to JSONB + notification targets.
 */
async function resolveAndNotify(
  transporterOrgId: string | null | undefined,
  declarationType: string,
  shipment: { generator_id?: string | null; transporter_id?: string | null; recycler_id?: string | null; hide_recycler_from_generator?: boolean; hide_generator_from_recycler?: boolean },
  creatorOrgId: string,
): Promise<{ visibleTo: DocumentVisibleTo; notifyOrgIds: (string | null | undefined)[] }> {
  const category = getDocCategory(declarationType);

  if (!transporterOrgId) {
    return {
      visibleTo: { generator: true, recycler: true, disposal: true },
      notifyOrgIds: [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(id => id && id !== creatorOrgId),
    };
  }

  const visibleTo = await resolveDocVisibilityForAllParties(transporterOrgId, category);

  const notifyOrgIds: (string | null | undefined)[] = [];

  // Transporter always gets notified (unless they're the creator)
  if (shipment.transporter_id && shipment.transporter_id !== creatorOrgId) {
    notifyOrgIds.push(shipment.transporter_id);
  }

  // Generator — check visibility + bidirectional masking
  if (shipment.generator_id && shipment.generator_id !== creatorOrgId && visibleTo.generator !== false) {
    if (!shipment.hide_generator_from_recycler || creatorOrgId !== shipment.recycler_id) {
      notifyOrgIds.push(shipment.generator_id);
    }
  }

  // Recycler — check visibility + bidirectional masking
  if (shipment.recycler_id && shipment.recycler_id !== creatorOrgId && visibleTo.recycler !== false) {
    if (!shipment.hide_recycler_from_generator || creatorOrgId !== shipment.generator_id) {
      notifyOrgIds.push(shipment.recycler_id);
    }
  }

  return { visibleTo, notifyOrgIds };
}


// ─── Shared Helpers ───

async function fetchShipmentWithParties(shipmentId: string) {
  const { data: shipment } = await supabase
    .from('shipments')
    .select('shipment_number, waste_type, quantity, unit, generator_id, transporter_id, recycler_id, hide_recycler_from_generator, hide_generator_from_recycler')
    .eq('id', shipmentId)
    .single();
  return shipment;
}

async function fetchOrgNames(ids: (string | null | undefined)[]) {
  const validIds = ids.filter(Boolean) as string[];
  if (validIds.length === 0) return () => '';
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', validIds);
  return (id?: string | null) => orgs?.find(o => o.id === id)?.name || '';
}

async function notifyOrgUsers(orgIds: (string | null | undefined)[], title: string, message: string, shipmentId: string) {
  const validIds = orgIds.filter(Boolean) as string[];
  if (validIds.length === 0) return;
  try {
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id')
      .in('organization_id', validIds)
      .limit(20);
    if (users && users.length > 0) {
      await sendBulkDualNotification({
        user_ids: users.map((u: any) => u.user_id),
        title,
        message: withTagline(message),
        type: 'document_issued',
        reference_id: shipmentId,
        reference_type: 'shipment',
      });
    }
  } catch (e) {
    console.error('Document notification failed:', e);
  }
}

// ─── Auto-Create Functions ───

/**
 * Generator handover declaration — triggered at: approved/registered
 */
export async function autoCreateGeneratorDeclaration(
  shipmentId: string,
  generatorOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(generatorOrgId, 'auto_delivery_certificate'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'generator_handover').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const declarationNumber = `DCL-GEN-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('generator_handover', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(shipment.generator_id),
  });

  const maskedNames = applyVisibilityMasking(
    { generator: getOrgName(shipment.generator_id), transporter: getOrgName(shipment.transporter_id), recycler: getOrgName(shipment.recycler_id) },
    shipment, generatorOrgId,
  );

  // Resolve visibility via transporter's settings
  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    shipment.transporter_id, 'generator_handover', shipment, generatorOrgId,
  );

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
    ...maskedNames,
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto generator declaration error:', error);
    return;
  }

  await notifyOrgUsers(
    notifyOrgIds,
    '📝 إقرار تسليم جديد من المولّد',
    `أصدر المولّد "${getOrgName(shipment.generator_id)}" إقرار تسليم للشحنة ${shipment.shipment_number}. يرجى مراجعة المستند والتأكيد.`,
    shipmentId,
  );
}

/**
 * Transporter transport declaration — triggered at: in_transit
 */
export async function autoCreateTransporterDeclaration(
  shipmentId: string,
  transporterOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(transporterOrgId, 'auto_manifest_generation'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'transporter_transport').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    transporterOrgId, 'transporter_transport', shipment, transporterOrgId,
  );

  const declarationNumber = `DCL-TRN-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('transporter_transport', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(shipment.transporter_id),
  });

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: transporterOrgId,
    declaration_type: 'transporter_transport',
    declaration_text: TRANSPORTER_AUTO_DECLARATION_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    generator_name: getOrgName(shipment.generator_id),
    transporter_name: getOrgName(shipment.transporter_id),
    recycler_name: getOrgName(shipment.recycler_id),
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto transporter declaration error:', error);
    return;
  }

  if (notifyOrgIds.length > 0) {
    await notifyOrgUsers(
      notifyOrgIds,
      '🚛 إقرار نقل — الناقل بدأ الرحلة',
      `أصدر الناقل "${getOrgName(shipment.transporter_id)}" إقرار نقل للشحنة ${shipment.shipment_number}.`,
      shipmentId,
    );
  }
}

/**
 * Recycler receipt declaration — triggered at: delivered/confirmed
 */
export async function autoCreateRecyclerDeclaration(
  shipmentId: string,
  recyclerOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(recyclerOrgId, 'auto_delivery_certificate'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'recycler_receipt').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const declarationNumber = `DCL-RCY-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('recycler_receipt', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(shipment.recycler_id),
  });

  const maskedNames = applyVisibilityMasking(
    { generator: getOrgName(shipment.generator_id), transporter: getOrgName(shipment.transporter_id), recycler: getOrgName(shipment.recycler_id) },
    shipment, recyclerOrgId,
  );

  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    shipment.transporter_id, 'recycler_receipt', shipment, recyclerOrgId,
  );

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
    ...maskedNames,
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto recycler declaration error:', error);
    return;
  }

  await notifyOrgUsers(
    notifyOrgIds,
    '📥 إقرار استلام من المدوّر',
    `أصدر المدوّر "${getOrgName(shipment.recycler_id)}" إقرار استلام للشحنة ${shipment.shipment_number}. تم توثيق سلسلة الحيازة بنجاح.`,
    shipmentId,
  );
}

/**
 * Recycler recycling certificate — triggered at: recycling_complete/processing_complete
 */
export async function autoCreateRecyclingCertificate(
  shipmentId: string,
  recyclerOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(recyclerOrgId, 'auto_delivery_certificate'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'recycling_certificate').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const declarationNumber = `CRT-RCY-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('recycling_certificate', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(shipment.recycler_id),
  });

  const maskedNames = applyVisibilityMasking(
    { generator: getOrgName(shipment.generator_id), transporter: getOrgName(shipment.transporter_id), recycler: getOrgName(shipment.recycler_id) },
    shipment, recyclerOrgId,
  );

  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    shipment.transporter_id, 'recycling_certificate', shipment, recyclerOrgId,
  );

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: recyclerOrgId,
    declaration_type: 'recycling_certificate',
    declaration_text: RECYCLER_RECYCLING_CERTIFICATE_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    ...maskedNames,
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto recycling certificate error:', error);
    return;
  }

  await notifyOrgUsers(
    notifyOrgIds,
    '♻️ شهادة تدوير — تم إتمام التدوير',
    `أصدر المدوّر "${getOrgName(shipment.recycler_id)}" شهادة تدوير للشحنة ${shipment.shipment_number}.`,
    shipmentId,
  );
}

/**
 * Disposal reception declaration — triggered at: delivered to disposal facility
 */
export async function autoCreateDisposalReceptionDeclaration(
  shipmentId: string,
  disposalOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(disposalOrgId, 'auto_delivery_certificate'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'disposal_receipt').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const declarationNumber = `DCL-DSR-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('disposal_receipt', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(disposalOrgId),
  });

  const maskedNames = applyVisibilityMasking(
    { generator: getOrgName(shipment.generator_id), transporter: getOrgName(shipment.transporter_id), recycler: getOrgName(shipment.recycler_id) },
    shipment, disposalOrgId,
  );

  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    shipment.transporter_id, 'disposal_receipt', shipment, disposalOrgId,
  );

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: disposalOrgId,
    declaration_type: 'disposal_receipt',
    declaration_text: DISPOSAL_RECEIPT_DECLARATION_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    ...maskedNames,
    disposal_name: getOrgName(disposalOrgId),
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto disposal reception declaration error:', error);
    return;
  }

  await notifyOrgUsers(
    notifyOrgIds,
    '📥 إقرار استلام من جهة التخلص',
    `أصدرت جهة التخلص إقرار استلام للشحنة ${shipment.shipment_number}.`,
    shipmentId,
  );
}

/**
 * Disposal certificate — triggered at: disposal_treatment/disposal_final/disposal_completed
 */
export async function autoCreateDisposalCertificate(
  shipmentId: string,
  disposalOrgId: string,
  userId: string
): Promise<void> {
  if (!(await isAutoActionEnabled(disposalOrgId, 'auto_delivery_certificate'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'disposal_certificate').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  const declarationNumber = `CRT-DSP-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('disposal_certificate', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(disposalOrgId),
  });

  const maskedNames = applyVisibilityMasking(
    { generator: getOrgName(shipment.generator_id), transporter: getOrgName(shipment.transporter_id), recycler: getOrgName(shipment.recycler_id) },
    shipment, disposalOrgId,
  );

  const { visibleTo, notifyOrgIds } = await resolveAndNotify(
    shipment.transporter_id, 'disposal_certificate', shipment, disposalOrgId,
  );

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: disposalOrgId,
    declaration_type: 'disposal_certificate',
    declaration_text: DISPOSAL_CERTIFICATE_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    ...maskedNames,
    disposal_name: getOrgName(disposalOrgId),
    visible_to: visibleTo,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto disposal certificate error:', error);
    return;
  }

  await notifyOrgUsers(
    notifyOrgIds,
    '🏭 شهادة تخلص نهائي',
    `أصدرت جهة التخلص شهادة تخلص نهائي للشحنة ${shipment.shipment_number}.`,
    shipmentId,
  );
}

/**
 * Checks if driver declaration should be visible to generator.
 * Priority: per-driver setting > org-level setting > default (true)
 */
async function isDriverDeclarationVisibleToGenerator(
  transporterOrgId: string,
  driverProfileId?: string
): Promise<boolean> {
  // 1. Check per-driver override first
  if (driverProfileId) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('declaration_visible_to_generator')
      .eq('profile_id', driverProfileId)
      .eq('organization_id', transporterOrgId)
      .maybeSingle();
    
    if (driver?.declaration_visible_to_generator !== null && driver?.declaration_visible_to_generator !== undefined) {
      return driver.declaration_visible_to_generator;
    }
  }

  // 2. Fall back to org-level setting
  const { data: orgSettings } = await supabase
    .from('organization_auto_actions')
    .select('driver_declaration_visible_to_generator')
    .eq('organization_id', transporterOrgId)
    .maybeSingle();

  return orgSettings?.driver_declaration_visible_to_generator ?? true;
}

/**
 * Driver pickup confirmation — triggered at: picked_up/loading
 * Visibility to generator depends on org/driver settings.
 */
export async function autoCreateDriverConfirmation(
  shipmentId: string,
  transporterOrgId: string,
  userId: string,
  driverName?: string
): Promise<void> {
  if (!(await isAutoActionEnabled(transporterOrgId, 'auto_tracking_form'))) return;

  const { data: existing } = await (supabase.from('delivery_declarations') as any)
    .select('id').eq('shipment_id', shipmentId)
    .eq('declaration_type', 'driver_confirmation').eq('status', 'active').maybeSingle();
  if (existing) return;

  const shipment = await fetchShipmentWithParties(shipmentId);
  if (!shipment) return;

  const getOrgName = await fetchOrgNames([shipment.generator_id, shipment.transporter_id, shipment.recycler_id]);

  // Check visibility setting for this driver
  const visibleToGenerator = await isDriverDeclarationVisibleToGenerator(transporterOrgId, userId);

  const declarationNumber = `DCL-DRV-${Date.now().toString(36).toUpperCase()}`;
  const identity = generateDocumentIdentity('driver_confirmation', declarationNumber, {
    shipmentNumber: shipment.shipment_number,
    organizationName: getOrgName(shipment.transporter_id),
  });

  const insertData: Record<string, any> = {
    shipment_id: shipmentId,
    declared_by_user_id: userId,
    declared_by_organization_id: transporterOrgId,
    declaration_type: 'driver_confirmation',
    declaration_text: DRIVER_AUTO_CONFIRMATION_TEXT,
    auto_generated: true,
    status: 'active',
    shipment_number: shipment.shipment_number,
    waste_type: shipment.waste_type,
    quantity: shipment.quantity,
    unit: shipment.unit,
    generator_name: getOrgName(shipment.generator_id),
    transporter_name: getOrgName(shipment.transporter_id),
    recycler_name: getOrgName(shipment.recycler_id),
    driver_name: driverName || null,
    visible_to_generator: visibleToGenerator,
    ...identity,
  };

  const { error } = await (supabase.from('delivery_declarations') as any).insert(insertData);
  if (error) {
    console.error('Auto driver confirmation error:', error);
    return;
  }

  // Only notify generator if declaration is visible to them
  const notifyIds: (string | null | undefined)[] = [shipment.transporter_id];
  if (visibleToGenerator) {
    notifyIds.push(shipment.generator_id);
  }

  await notifyOrgUsers(
    notifyIds,
    '🚗 تأكيد السائق — تم استلام الشحنة ميدانياً',
    `أكد السائق ${driverName || ''} استلام الشحنة ${shipment.shipment_number} ميدانياً.`,
    shipmentId,
  );
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

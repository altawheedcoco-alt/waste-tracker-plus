/**
 * Rich Notification Builder for Shipment Status Changes
 * 
 * القاعدة: كل إشعار يتضمن:
 * 1. جميع بيانات الشحنة الأساسية
 * 2. رابط مباشر للشحنة
 * 3. أزرار تفاعلية للإقرارات/الموافقات حسب نوع الجهة
 */
import { supabase } from '@/integrations/supabase/client';

export interface RichShipmentData {
  shipment_id: string;
  shipment_number: string;
  status: string;
  status_label: string;
  waste_type?: string;
  quantity?: number;
  unit?: string;
  pickup_location?: string;
  delivery_location?: string;
  generator_name?: string;
  transporter_name?: string;
  recycler_name?: string;
  driver_name?: string;
  driver_phone?: string;
  pickup_date?: string;
  delivery_date?: string;
  notes?: string;
  direct_link: string;
}

export interface WhatsAppButton {
  id: string;
  title: string;
}

/**
 * Fetch full shipment data for rich notifications
 */
export async function fetchRichShipmentData(
  shipmentId: string,
  statusLabel: string,
  newStatus: string
): Promise<RichShipmentData | null> {
  try {
    const { data } = await supabase
      .from('shipments')
      .select(`
        id, shipment_number, status, waste_type, quantity, unit,
        pickup_location, delivery_location, pickup_date, delivery_date,
        notes, driver_name, driver_phone,
        generator_organization_id, transporter_organization_id, recycler_organization_id
      `)
      .eq('id', shipmentId)
      .single();

    if (!data) return null;
    const s = data as any;

    // Fetch org names in parallel
    const orgIds = [s.generator_organization_id, s.transporter_organization_id, s.recycler_organization_id].filter(Boolean);
    const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
    const orgMap = Object.fromEntries((orgs || []).map((o: any) => [o.id, o.name]));

    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://irecycle21.lovable.app';

    return {
      shipment_id: s.id,
      shipment_number: s.shipment_number || '',
      status: newStatus,
      status_label: statusLabel,
      waste_type: s.waste_type || undefined,
      quantity: s.quantity || undefined,
      unit: s.unit || undefined,
      pickup_location: s.pickup_location || undefined,
      delivery_location: s.delivery_location || undefined,
      generator_name: orgMap[s.generator_organization_id] || undefined,
      transporter_name: orgMap[s.transporter_organization_id] || undefined,
      recycler_name: orgMap[s.recycler_organization_id] || undefined,
      driver_name: s.driver_name || undefined,
      driver_phone: s.driver_phone || undefined,
      pickup_date: s.pickup_date || undefined,
      delivery_date: s.delivery_date || undefined,
      notes: s.notes || undefined,
      direct_link: `${baseUrl}/dashboard/s/${s.shipment_number || s.id}`,
    };
  } catch (err) {
    console.error('[RichNotif] Failed to fetch shipment data:', err);
    return null;
  }
}

/**
 * Build rich WhatsApp message text with all shipment data + link
 */
export function buildRichWhatsAppMessage(data: RichShipmentData): string {
  const lines: string[] = [];

  // Header
  lines.push(`📦 *تحديث شحنة #${data.shipment_number}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔄 الحالة: *${data.status_label}*`);
  lines.push('');

  // Shipment details
  if (data.waste_type) lines.push(`🗑️ نوع النفايات: ${data.waste_type}`);
  if (data.quantity) lines.push(`⚖️ الكمية: ${data.quantity} ${data.unit || 'كجم'}`);
  if (data.pickup_location) lines.push(`📍 من: ${data.pickup_location}`);
  if (data.delivery_location) lines.push(`📍 إلى: ${data.delivery_location}`);
  
  lines.push('');

  // Parties
  if (data.generator_name) lines.push(`🏭 المولّد: ${data.generator_name}`);
  if (data.transporter_name) lines.push(`🚛 الناقل: ${data.transporter_name}`);
  if (data.recycler_name) lines.push(`♻️ المدوّر: ${data.recycler_name}`);
  if (data.driver_name) lines.push(`👤 السائق: ${data.driver_name}`);

  // Dates
  if (data.pickup_date || data.delivery_date) {
    lines.push('');
    if (data.pickup_date) lines.push(`📅 تاريخ الاستلام: ${new Date(data.pickup_date).toLocaleDateString('ar-EG')}`);
    if (data.delivery_date) lines.push(`📅 تاريخ التسليم: ${new Date(data.delivery_date).toLocaleDateString('ar-EG')}`);
  }

  // Notes
  if (data.notes) {
    lines.push('');
    lines.push(`📝 ملاحظات: ${data.notes}`);
  }

  // Direct link
  lines.push('');
  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔗 عرض الشحنة: ${data.direct_link}`);

  // Timestamp
  lines.push('');
  lines.push(`🕐 ${new Date().toLocaleString('ar-EG')}`);

  return lines.join('\n');
}

/**
 * Build rich in-app notification message
 */
export function buildRichInAppMessage(data: RichShipmentData): string {
  const parts: string[] = [];
  parts.push(`تم تغيير حالة الشحنة إلى "${data.status_label}"`);
  if (data.waste_type) parts.push(`نوع النفايات: ${data.waste_type}`);
  if (data.quantity) parts.push(`الكمية: ${data.quantity} ${data.unit || 'كجم'}`);
  if (data.pickup_location) parts.push(`من: ${data.pickup_location}`);
  if (data.delivery_location) parts.push(`إلى: ${data.delivery_location}`);
  return parts.join(' | ');
}

/**
 * Determine interactive buttons based on new status and target org type
 */
export function getStatusButtons(
  newStatus: string,
  shipmentId: string,
  targetOrgType?: 'generator' | 'transporter' | 'recycler'
): WhatsAppButton[] {
  const buttons: WhatsAppButton[] = [];

  switch (newStatus) {
    case 'pending':
    case 'new':
      // Generator/admin can approve
      if (targetOrgType === 'generator' || !targetOrgType) {
        buttons.push({ id: `approve_${shipmentId}`, title: '✅ موافقة' });
      }
      break;

    case 'approved':
      // Transporter can start transit
      if (targetOrgType === 'transporter') {
        buttons.push({ id: `start_transit_${shipmentId}`, title: '🚛 بدء النقل' });
      }
      break;

    case 'in_transit':
      // Transporter can confirm delivery
      if (targetOrgType === 'transporter') {
        buttons.push({ id: `confirm_delivery_${shipmentId}`, title: '📍 تأكيد التسليم' });
      }
      break;

    case 'delivered':
      // Recycler can confirm receipt
      if (targetOrgType === 'recycler') {
        buttons.push({ id: `confirm_receipt_${shipmentId}`, title: '✅ تأكيد الاستلام' });
      }
      break;
  }

  // Always add view button
  buttons.push({ id: `view_${shipmentId}`, title: '👁️ عرض التفاصيل' });

  // WaPilot reply buttons limited to 3
  return buttons.slice(0, 3);
}

/**
 * Map org ID to org type from shipment context
 */
export function resolveOrgType(
  orgId: string,
  generatorId?: string | null,
  transporterId?: string | null,
  recyclerId?: string | null
): 'generator' | 'transporter' | 'recycler' | undefined {
  if (orgId === generatorId) return 'generator';
  if (orgId === transporterId) return 'transporter';
  if (orgId === recyclerId) return 'recycler';
  return undefined;
}

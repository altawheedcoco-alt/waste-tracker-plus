import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WAPILOT_BASE = "https://api.wapilot.net/api/v2";
const INSTANCE_ID = "instance3373";

interface EventPayload {
  event_type: string;
  organization_id?: string;
  shipment_id?: string;
  shipment_number?: string;
  status?: string;
  old_status?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount?: number;
  collection_request_id?: string;
  customer_name?: string;
  customer_phone?: string;
  deposit_id?: string;
  depositor_name?: string;
  approval_id?: string;
  request_title?: string;
  waste_type?: string;
  driver_name?: string;
  generator_name?: string;
  transporter_name?: string;
  recycler_name?: string;
  // OTP fields
  otp_code?: string;
  phone?: string;
  user_name?: string;
  // Document fields
  document_type?: string;
  document_title?: string;
  document_url?: string;
  extra?: Record<string, any>;
}

// Build message text for each event type
function buildMessage(event: EventPayload): { text: string; targets: string[] } {
  const targets: string[] = [];
  const platformName = "آي ريسايكل 🌿";

  switch (event.event_type) {
    // ===== SHIPMENT EVENTS =====
    case 'shipment_created':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📦 *شحنة جديدة* #${event.shipment_number || ''}\n\n🏭 المولّد: ${event.generator_name || '-'}\n🚛 الناقل: ${event.transporter_name || '-'}\n♻️ المدوّر: ${event.recycler_name || '-'}\n📋 نوع المخلفات: ${event.waste_type || '-'}\n\n✅ الحالة: تم الإنشاء\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_approved':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ *تمت الموافقة على الشحنة* #${event.shipment_number || ''}\n\nيمكنك بدء عملية الجمع الآن\n🚛 الناقل: ${event.transporter_name || '-'}\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_collecting':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🚛 *بدأ جمع الشحنة* #${event.shipment_number || ''}\n\n${event.driver_name ? `👤 السائق: ${event.driver_name}` : ''}\n🏭 من: ${event.generator_name || '-'}\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_in_transit':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🛣️ *الشحنة في الطريق* #${event.shipment_number || ''}\n\n🏭 من: ${event.generator_name || '-'}\n♻️ إلى: ${event.recycler_name || '-'}\n${event.driver_name ? `👤 السائق: ${event.driver_name}` : ''}\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_delivered':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📬 *تم تسليم الشحنة* #${event.shipment_number || ''}\n\n⏳ بانتظار التأكيد من الجهة المستقبلة\n♻️ المستقبل: ${event.recycler_name || '-'}\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_confirmed':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ *تم تأكيد استلام الشحنة* #${event.shipment_number || ''}\n\n🎉 تمت العملية بنجاح\n\n_${platformName}_`,
        targets,
      };

    case 'shipment_cancelled':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `❌ *تم إلغاء الشحنة* #${event.shipment_number || ''}\n\n_${platformName}_`,
        targets,
      };

    // ===== INVOICE EVENTS =====
    case 'invoice_created':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🧾 *فاتورة جديدة* #${event.invoice_number || ''}\n\n💰 المبلغ: ${event.amount?.toLocaleString() || '0'} ج.م\n\n_${platformName}_`,
        targets,
      };

    case 'invoice_paid':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `💰 *تم سداد الفاتورة* #${event.invoice_number || ''}\n\n✅ المبلغ: ${event.amount?.toLocaleString() || '0'} ج.م\n\n_${platformName}_`,
        targets,
      };

    case 'invoice_overdue':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `⚠️ *فاتورة متأخرة* #${event.invoice_number || ''}\n\n💸 المبلغ المستحق: ${event.amount?.toLocaleString() || '0'} ج.م\nيرجى السداد في أقرب وقت\n\n_${platformName}_`,
        targets,
      };

    // ===== DEPOSIT EVENTS =====
    case 'deposit_received':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🏦 *تم استلام إيداع مالي*\n\n💰 المبلغ: ${event.amount?.toLocaleString() || '0'} ج.م\n👤 من: ${event.depositor_name || '-'}\n\n_${platformName}_`,
        targets,
      };

    // ===== COLLECTION REQUEST EVENTS =====
    case 'collection_request_new':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🆕 *طلب جمع جديد*\n\n👤 العميل: ${event.customer_name || '-'}\n📋 نوع المخلفات: ${event.waste_type || '-'}\n\n_${platformName}_`,
        targets,
      };

    case 'collection_request_assigned':
      return {
        text: `🚛 *تم تعيين سائق لطلب الجمع*\n\n${event.driver_name ? `👤 السائق: ${event.driver_name}` : ''}\n\n_${platformName}_`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    case 'collection_request_picked_up':
      return {
        text: `📦 *تم استلام المخلفات من موقعك*\n\n✅ شكراً لاستخدام خدمات الجمع\n\n_${platformName}_`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    case 'collection_request_completed':
      return {
        text: `✅ *تم إكمال طلب الجمع بنجاح*\n\n🎉 نشكرك على ثقتك في خدماتنا\n\n_${platformName}_`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    case 'collection_request_cancelled':
      return {
        text: `❌ *تم إلغاء طلب الجمع*\n\n${event.extra?.reason ? `السبب: ${event.extra.reason}` : ''}\n\n_${platformName}_`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    // ===== APPROVAL EVENTS =====
    case 'approval_approved':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ *تمت الموافقة على طلبك*\n\n📋 ${event.request_title || '-'}\n\n_${platformName}_`,
        targets,
      };

    case 'approval_rejected':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `❌ *تم رفض طلبك*\n\n📋 ${event.request_title || ''}\n${event.extra?.reason ? `السبب: ${event.extra.reason}` : ''}\n\n_${platformName}_`,
        targets,
      };

    // ===== CONTRACT/LICENSE EVENTS =====
    case 'license_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `⚠️ *تنبيه: رخصتك تنتهي قريباً*\n\nيرجى تجديدها لتجنب تعليق الخدمة\n\n_${platformName}_`,
        targets,
      };

    case 'contract_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📋 *تنبيه: عقدك ينتهي قريباً*\n\nتواصل معنا للتجديد\n\n_${platformName}_`,
        targets,
      };

    // ===== SUBSCRIPTION EVENTS =====
    case 'subscription_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `💳 *اشتراكك ينتهي قريباً*\n\nجدد الآن لتجنب انقطاع الخدمة\n\n_${platformName}_`,
        targets,
      };

    case 'subscription_expired':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🔴 *انتهى اشتراكك*\n\nجدد الآن لاستعادة الوصول الكامل\n\n_${platformName}_`,
        targets,
      };

    // ===== OTP EVENTS =====
    case 'otp_verification':
      return {
        text: `🔐 *رمز التحقق الخاص بك*\n\n🔑 الرمز: *${event.otp_code}*\n\n⏳ صالح لمدة 5 دقائق\n⚠️ لا تشارك هذا الرمز مع أي شخص\n\n_${platformName}_`,
        targets: [],
      };

    // ===== DOCUMENT EVENTS =====
    case 'document_shared':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📄 *مستند جديد*\n\n📋 النوع: ${event.document_type || '-'}\n📝 العنوان: ${event.document_title || '-'}\n${event.document_url ? `🔗 الرابط: ${event.document_url}` : ''}\n\n_${platformName}_`,
        targets,
      };

    case 'document_signed':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✍️ *تم توقيع المستند*\n\n📋 ${event.document_title || '-'}\n✅ تم التوقيع بنجاح\n\n_${platformName}_`,
        targets,
      };

    case 'document_requires_signature':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🖊️ *مستند يتطلب توقيعك*\n\n📋 ${event.document_title || '-'}\n${event.document_url ? `🔗 الرابط: ${event.document_url}` : ''}\n\nيرجى مراجعة وتوقيع المستند\n\n_${platformName}_`,
        targets,
      };

    default:
      return {
        text: event.extra?.message || `📢 *إشعار جديد من ${platformName}*`,
        targets: event.organization_id ? [event.organization_id] : [],
      };
  }
}

// Map event_type to config column
function getConfigColumn(eventType: string): string | null {
  if (eventType === 'otp_verification') return 'auto_send_otp';
  if (eventType.startsWith('shipment_') || eventType.startsWith('collection_')) return 'auto_send_notifications';
  if (eventType.startsWith('invoice_') || eventType.startsWith('deposit_')) return 'auto_send_notifications';
  if (eventType.startsWith('subscription_')) return 'auto_send_subscription_reminders';
  if (eventType.startsWith('document_')) return 'auto_send_notifications';
  if (eventType.startsWith('approval_') || eventType.startsWith('license_') || eventType.startsWith('contract_')) return 'auto_send_notifications';
  return 'auto_send_notifications';
}

// Send message via WaPilot API
async function sendViaWaPilot(token: string, phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Format phone: ensure it starts with country code, no + sign
    let formattedPhone = phone.replace(/[\s+\-()]/g, "");
    // If starts with 0, assume Egypt (+20)
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "2" + formattedPhone;
    }
    // Ensure it doesn't start with +
    formattedPhone = formattedPhone.replace(/^\+/, "");

    const chatId = `${formattedPhone}@c.us`;

    const response = await fetch(`${WAPILOT_BASE}/${INSTANCE_ID}/send-message`, {
      method: "POST",
      headers: {
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result?.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const WAPILOT_TOKEN = Deno.env.get("WAPILOT_API_TOKEN");

    const event: EventPayload = await req.json();
    console.log(`[whatsapp-event] Processing via WaPilot: ${event.event_type}`, JSON.stringify(event));

    if (!WAPILOT_TOKEN) {
      console.log("[whatsapp-event] WAPILOT_API_TOKEN not configured, logging event only");

      await supabase.from("whatsapp_messages").insert({
        organization_id: event.organization_id || null,
        direction: "outbound",
        message_type: "event",
        content: `[${event.event_type}] ${buildMessage(event).text.slice(0, 200)}`,
        status: "pending",
        error_message: "WAPILOT_API_TOKEN not configured",
        metadata: { event_type: event.event_type, ...event.extra },
      });

      return new Response(
        JSON.stringify({ success: false, reason: "not_configured", event_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== OTP: Send directly to phone =====
    if (event.event_type === 'otp_verification' && event.phone) {
      const { text } = buildMessage(event);
      const result = await sendViaWaPilot(WAPILOT_TOKEN, event.phone, text);

      await supabase.from("whatsapp_messages").insert({
        organization_id: event.organization_id || null,
        direction: "outbound",
        to_phone: event.phone,
        message_type: "otp",
        content: text.slice(0, 500),
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        metadata: { event_type: event.event_type },
      });

      return new Response(
        JSON.stringify({ success: result.success, event_type: event.event_type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, targets } = buildMessage(event);
    const configColumn = getConfigColumn(event.event_type);
    const results: any[] = [];

    // For each target org, check if WhatsApp is enabled and send to subscribed users
    for (const orgId of targets) {
      const { data: orgConfig } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!orgConfig?.is_active) {
        console.log(`[whatsapp-event] WhatsApp disabled for org ${orgId}`);
        continue;
      }

      if (configColumn && !(orgConfig as any)[configColumn]) {
        console.log(`[whatsapp-event] ${configColumn} disabled for org ${orgId}`);
        continue;
      }

      // Get users with WhatsApp notifications enabled
      const { data: channels } = await supabase
        .from("notification_channels")
        .select("user_id, phone_number")
        .eq("organization_id", orgId)
        .eq("channel_type", "whatsapp")
        .eq("is_enabled", true)
        .eq("notify_shipment_updates", true);

      if (!channels || channels.length === 0) {
        // Fallback: try to send to org phone from profiles
        const { data: orgData } = await supabase
          .from("organizations")
          .select("phone, secondary_phone")
          .eq("id", orgId)
          .maybeSingle();

        if (orgData?.phone) {
          const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, orgData.phone, text);

          await supabase.from("whatsapp_messages").insert({
            organization_id: orgId,
            direction: "outbound",
            to_phone: orgData.phone,
            message_type: "event",
            content: text.slice(0, 500),
            status: sendResult.success ? "sent" : "failed",
            error_message: sendResult.error || null,
            metadata: { event_type: event.event_type, fallback: true },
          });

          results.push({ org: orgId, phone: orgData.phone, success: sendResult.success, fallback: true });
        } else {
          console.log(`[whatsapp-event] No channels or phone for org ${orgId}`);
        }
        continue;
      }

      // Send to each subscribed user
      for (const ch of channels) {
        if (!ch.phone_number) continue;

        const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, ch.phone_number, text);

        await supabase.from("whatsapp_messages").insert({
          organization_id: orgId,
          direction: "outbound",
          to_phone: ch.phone_number,
          user_id: ch.user_id,
          message_type: "event",
          content: text.slice(0, 500),
          status: sendResult.success ? "sent" : "failed",
          error_message: sendResult.error || null,
          metadata: { event_type: event.event_type },
        });

        results.push({ org: orgId, phone: ch.phone_number, success: sendResult.success });
      }
    }

    // Also send directly to customer_phone if provided (for collection requests)
    if (event.customer_phone) {
      const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, event.customer_phone, text);
      results.push({ phone: event.customer_phone, success: sendResult.success, direct: true });
    }

    console.log(`[whatsapp-event] Completed via WaPilot: ${results.length} sends`);

    return new Response(
      JSON.stringify({ success: true, event_type: event.event_type, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[whatsapp-event] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

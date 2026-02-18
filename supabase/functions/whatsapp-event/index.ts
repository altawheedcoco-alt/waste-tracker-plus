import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

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
  extra?: Record<string, any>;
}

// Message templates for each event type
function buildMessage(event: EventPayload): { text: string; targets: string[] } {
  const targets: string[] = []; // org IDs to notify

  switch (event.event_type) {
    // ===== SHIPMENT EVENTS =====
    case 'shipment_created':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📦 شحنة جديدة #${event.shipment_number || ''}\nنوع المخلفات: ${event.waste_type || '-'}\nالحالة: تم الإنشاء`,
        targets,
      };

    case 'shipment_approved':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ تمت الموافقة على الشحنة #${event.shipment_number || ''}\nيمكنك بدء عملية الجمع الآن`,
        targets,
      };

    case 'shipment_collecting':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🚛 بدأ جمع الشحنة #${event.shipment_number || ''}\n${event.driver_name ? `السائق: ${event.driver_name}` : ''}`,
        targets,
      };

    case 'shipment_in_transit':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🛣️ الشحنة #${event.shipment_number || ''} في الطريق\nمن: ${event.generator_name || '-'}\nإلى: ${event.recycler_name || '-'}`,
        targets,
      };

    case 'shipment_delivered':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📬 تم تسليم الشحنة #${event.shipment_number || ''}\nبانتظار التأكيد من الجهة المستقبلة`,
        targets,
      };

    case 'shipment_confirmed':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ تم تأكيد استلام الشحنة #${event.shipment_number || ''}\nتمت العملية بنجاح`,
        targets,
      };

    case 'shipment_cancelled':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `❌ تم إلغاء الشحنة #${event.shipment_number || ''}`,
        targets,
      };

    // ===== INVOICE EVENTS =====
    case 'invoice_created':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🧾 فاتورة جديدة #${event.invoice_number || ''}\nالمبلغ: ${event.amount?.toLocaleString() || '0'} ج.م`,
        targets,
      };

    case 'invoice_paid':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `💰 تم سداد الفاتورة #${event.invoice_number || ''}\nالمبلغ: ${event.amount?.toLocaleString() || '0'} ج.م`,
        targets,
      };

    case 'invoice_overdue':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `⚠️ فاتورة متأخرة #${event.invoice_number || ''}\nالمبلغ المستحق: ${event.amount?.toLocaleString() || '0'} ج.م\nيرجى السداد في أقرب وقت`,
        targets,
      };

    // ===== DEPOSIT EVENTS =====
    case 'deposit_received':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🏦 تم استلام إيداع مالي\nالمبلغ: ${event.amount?.toLocaleString() || '0'} ج.م\nمن: ${event.depositor_name || '-'}`,
        targets,
      };

    // ===== COLLECTION REQUEST EVENTS =====
    case 'collection_request_new':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🆕 طلب جمع جديد\nالعميل: ${event.customer_name || '-'}\nنوع المخلفات: ${event.waste_type || '-'}`,
        targets,
      };

    case 'collection_request_assigned':
      return {
        text: `🚛 تم تعيين سائق لطلب الجمع\n${event.driver_name ? `السائق: ${event.driver_name}` : ''}`,
        targets: event.customer_phone ? [] : (event.organization_id ? [event.organization_id] : []),
      };

    case 'collection_request_picked_up':
      return {
        text: `📦 تم استلام المخلفات من موقعك\nشكراً لاستخدام خدمات الجمع`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    case 'collection_request_completed':
      return {
        text: `✅ تم إكمال طلب الجمع بنجاح\nنشكرك على ثقتك في خدماتنا`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    case 'collection_request_cancelled':
      return {
        text: `❌ تم إلغاء طلب الجمع\n${event.extra?.reason ? `السبب: ${event.extra.reason}` : ''}`,
        targets: event.organization_id ? [event.organization_id] : [],
      };

    // ===== APPROVAL EVENTS =====
    case 'approval_approved':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `✅ تمت الموافقة على طلبك: ${event.request_title || '-'}`,
        targets,
      };

    case 'approval_rejected':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `❌ تم رفض طلبك: ${event.request_title || ''}\n${event.extra?.reason ? `السبب: ${event.extra.reason}` : ''}`,
        targets,
      };

    // ===== CONTRACT/LICENSE EVENTS =====
    case 'license_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `⚠️ تنبيه: رخصتك تنتهي قريباً\nيرجى تجديدها لتجنب تعليق الخدمة`,
        targets,
      };

    case 'contract_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `📋 تنبيه: عقدك ينتهي قريباً\nتواصل معنا للتجديد`,
        targets,
      };

    // ===== SUBSCRIPTION EVENTS =====
    case 'subscription_expiring':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `💳 اشتراكك ينتهي قريباً\nجدد الآن لتجنب انقطاع الخدمة`,
        targets,
      };

    case 'subscription_expired':
      if (event.organization_id) targets.push(event.organization_id);
      return {
        text: `🔴 انتهى اشتراكك\nجدد الآن لاستعادة الوصول الكامل`,
        targets,
      };

    default:
      return {
        text: event.extra?.message || `📢 إشعار جديد من منصة آي ريسايكل`,
        targets: event.organization_id ? [event.organization_id] : [],
      };
  }
}

// Map event_type to config column
function getConfigColumn(eventType: string): string | null {
  if (eventType.startsWith('shipment_') || eventType.startsWith('collection_')) return 'auto_send_notifications';
  if (eventType.startsWith('invoice_') || eventType.startsWith('deposit_')) return 'auto_send_notifications';
  if (eventType.startsWith('subscription_')) return 'auto_send_subscription_reminders';
  if (eventType.startsWith('approval_') || eventType.startsWith('license_') || eventType.startsWith('contract_')) return 'auto_send_notifications';
  return 'auto_send_notifications';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const event: EventPayload = await req.json();
    console.log(`[whatsapp-event] Processing: ${event.event_type}`, JSON.stringify(event));

    if (!WHATSAPP_ACCESS_TOKEN) {
      // Log the event but can't send
      console.log("[whatsapp-event] WHATSAPP_ACCESS_TOKEN not configured, logging event only");
      
      // Still log it as pending
      await supabase.from("whatsapp_messages").insert({
        organization_id: event.organization_id || null,
        direction: "outbound",
        message_type: "event",
        content: `[${event.event_type}] ${buildMessage(event).text.slice(0, 200)}`,
        status: "pending",
        error_message: "WHATSAPP_ACCESS_TOKEN not configured",
        metadata: { event_type: event.event_type, ...event.extra },
      });

      return new Response(
        JSON.stringify({ success: false, reason: "not_configured", event_logged: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, targets } = buildMessage(event);
    const configColumn = getConfigColumn(event.event_type);
    const results: any[] = [];

    // For each target org, check if WhatsApp is enabled
    for (const orgId of targets) {
      // Check org config
      const { data: orgConfig } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (!orgConfig?.is_active) {
        console.log(`[whatsapp-event] WhatsApp disabled for org ${orgId}`);
        continue;
      }

      // Check if this notification type is enabled
      if (configColumn && !(orgConfig as any)[configColumn]) {
        console.log(`[whatsapp-event] ${configColumn} disabled for org ${orgId}`);
        continue;
      }

      const phoneNumberId = orgConfig.phone_number_id || WHATSAPP_PHONE_NUMBER_ID;
      if (!phoneNumberId) continue;

      // Get users in this org with WhatsApp notifications enabled
      const { data: channels } = await supabase
        .from("notification_channels")
        .select("user_id, phone_number")
        .eq("organization_id", orgId)
        .eq("channel_type", "whatsapp")
        .eq("is_enabled", true)
        .eq("notify_shipment_updates", true);

      if (!channels || channels.length === 0) {
        console.log(`[whatsapp-event] No WhatsApp channels for org ${orgId}`);
        continue;
      }

      // Send to each user
      for (const ch of channels) {
        if (!ch.phone_number) continue;

        const formattedPhone = ch.phone_number.replace(/[\s+\-()]/g, "");

        try {
          const response = await fetch(
            `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "text",
                text: { body: text },
              }),
            }
          );

          const result = await response.json();

          await supabase.from("whatsapp_messages").insert({
            organization_id: orgId,
            direction: "outbound",
            to_phone: ch.phone_number,
            user_id: ch.user_id,
            message_type: "event",
            content: text.slice(0, 500),
            meta_message_id: result.messages?.[0]?.id || null,
            status: result.messages ? "sent" : "failed",
            error_message: result.error?.message || null,
            metadata: { event_type: event.event_type },
          });

          results.push({ org: orgId, phone: ch.phone_number, success: !!result.messages });
        } catch (e: any) {
          results.push({ org: orgId, phone: ch.phone_number, success: false, error: e.message });
        }
      }
    }

    // Also send directly to customer_phone if provided (for collection requests)
    if (event.customer_phone && WHATSAPP_PHONE_NUMBER_ID) {
      const formattedPhone = event.customer_phone.replace(/[\s+\-()]/g, "");
      try {
        const response = await fetch(
          `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: formattedPhone,
              type: "text",
              text: { body: text },
            }),
          }
        );
        const result = await response.json();
        results.push({ phone: event.customer_phone, success: !!result.messages, direct: true });
      } catch (e: any) {
        results.push({ phone: event.customer_phone, success: false, error: e.message, direct: true });
      }
    }

    console.log(`[whatsapp-event] Completed: ${results.length} sends`);

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

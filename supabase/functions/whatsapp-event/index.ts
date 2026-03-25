import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WAPILOT_BASE = "https://api.wapilot.net/api/v2";
const INSTANCE_ID = "instance3373";

interface EventPayload {
  event_type: string;
  organization_id?: string;
  shipment_id?: string;
  shipment_number?: string;
  phone?: string;
  customer_phone?: string;
  generator_org_id?: string;
  transporter_org_id?: string;
  recycler_org_id?: string;
  driver_name?: string;
  driver_phone?: string;
  otp_code?: string;
  extra?: Record<string, any>;
}

function buildMessage(event: EventPayload): { text: string; targets: string[]; configColumn?: string } {
  const sn = event.shipment_number || event.shipment_id?.slice(0, 8) || "";
  const targets: string[] = [];
  if (event.generator_org_id) targets.push(event.generator_org_id);
  if (event.transporter_org_id) targets.push(event.transporter_org_id);
  if (event.recycler_org_id) targets.push(event.recycler_org_id);
  if (event.organization_id && !targets.includes(event.organization_id)) targets.push(event.organization_id);

  let configColumn: string | undefined;

  switch (event.event_type) {
    case "shipment_created":
      configColumn = "auto_send_notifications";
      return { text: `📦 شحنة جديدة #${sn}\nتم إنشاء شحنة جديدة وهي بانتظار الموافقة.\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "shipment_approved":
      configColumn = "auto_send_notifications";
      return { text: `✅ تمت الموافقة على الشحنة #${sn}\nالشحنة جاهزة للنقل. يرجى التنسيق مع السائق.\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "shipment_in_transit":
      configColumn = "auto_send_notifications";
      return { text: `🚛 الشحنة #${sn} في الطريق\nالسائق: ${event.driver_name || "غير محدد"}\n📍 من: ${event.extra?.pickup_address || 'غير محدد'}\n📍 إلى: ${event.extra?.delivery_address || 'غير محدد'}\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "shipment_delivered":
      configColumn = "auto_send_notifications";
      return { text: `📍 وصلت الشحنة #${sn}\nتم التسليم بنجاح ✅\nالسائق: ${event.driver_name || "غير محدد"}\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "shipment_completed":
      configColumn = "auto_send_notifications";
      return { text: `🏁 اكتملت الشحنة #${sn}\nتمت معالجة الشحنة بالكامل وإغلاق الدورة.\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "driver_assigned":
      configColumn = "auto_send_notifications";
      return {
        text: `🚛 تم تعيين سائق للشحنة #${sn}\nالسائق: ${event.driver_name || "غير محدد"}\nنوع النفايات: ${event.extra?.waste_type || ''}\nالكمية: ${event.extra?.quantity || ''}\n📍 من: ${event.extra?.pickup_address || ''}\n📍 إلى: ${event.extra?.delivery_address || ''}\n🕐 ${new Date().toLocaleString('ar-EG')}`,
        targets: [...targets, ...(event.driver_phone ? [] : [])],
        configColumn,
      };
    case "invoice_generated":
      configColumn = "auto_send_notifications";
      return { text: `🧾 فاتورة جديدة للشحنة #${sn}\nرقم الفاتورة: ${event.extra?.invoice_number || ''}\nالمبلغ: ${event.extra?.amount || ''} ج.م\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "payment_received":
      configColumn = "auto_send_notifications";
      return { text: `💰 تم استلام دفعة مالية\nالمبلغ: ${event.extra?.amount || ''} ج.م\nالمرجع: ${event.extra?.reference || ''}\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "otp_verification":
      configColumn = "auto_send_otp";
      return { text: `🔐 رمز التحقق: ${event.otp_code}\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`, targets, configColumn };
    case "signature_request":
      configColumn = "auto_send_notifications";
      return { text: `✍️ مطلوب توقيعك على الشحنة #${sn}\nيرجى الدخول للمنصة لإتمام التوقيع.\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "subscription_reminder":
      configColumn = "auto_send_subscription_reminders";
      return { text: `⚠️ تذكير بتجديد الاشتراك\nاشتراكك على وشك الانتهاء. جدّد الآن لاستمرار الخدمة.\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "emergency_alert":
      configColumn = "auto_send_notifications";
      return { text: `🚨 تنبيه طوارئ\n${event.extra?.message || 'يرجى الانتباه والتحقق من المنصة فوراً.'}\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    case "daily_report":
      return { text: event.extra?.report_text || `📊 التقرير اليومي\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets };
    case "weekly_report":
      return { text: event.extra?.report_text || `📊 التقرير الأسبوعي\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets };
    case "meeting_invitation":
      configColumn = "auto_send_notifications";
      return { text: `📹 دعوة اجتماع ${event.extra?.meeting_type === 'audio' ? 'صوتي' : 'مرئي'}\nالعنوان: ${event.extra?.meeting_title || ''}\nمن: ${event.extra?.host_name || 'مستخدم'}\n${event.extra?.scheduled_at ? `📅 الموعد: ${event.extra.scheduled_at}` : '⚡ يبدأ الآن'}\n🔗 انضم من لوحة التحكم ← الاجتماعات المرئية\n🕐 ${new Date().toLocaleString('ar-EG')}`, targets, configColumn };
    default:
      return { text: `📢 إشعار: ${event.event_type}\n${JSON.stringify(event.extra || {}).slice(0, 200)}`, targets };
  }
}

async function sendViaWaPilot(token: string, phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    let formattedPhone = phone.replace(/[\s\-()]/g, "");
    if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.startsWith("05")) formattedPhone = "966" + formattedPhone.substring(1);
    if (formattedPhone.startsWith("01")) formattedPhone = "20" + formattedPhone;
    const chatId = `${formattedPhone}@c.us`;

    const response = await fetch(`${WAPILOT_BASE}/${INSTANCE_ID}/send-message`, {
      method: "POST",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
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
        to_phone: event.phone || event.customer_phone || "unknown",
        content: `[${event.event_type}] ${buildMessage(event).text.slice(0, 200)}`,
        status: "pending",
        error_message: "WAPILOT_API_TOKEN not configured",
        metadata: { event_type: event.event_type, ...event.extra },
      });
      return new Response(JSON.stringify({ success: false, reason: "no_token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, targets, configColumn } = buildMessage(event);

    // OTP: send directly to provided phone
    if (event.event_type === "otp_verification" && event.phone) {
      const result = await sendViaWaPilot(WAPILOT_TOKEN, event.phone, text);
      await supabase.from("whatsapp_messages").insert({
        organization_id: event.organization_id || null,
        direction: "outbound",
        to_phone: event.phone,
        content: text,
        message_type: "otp",
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
        metadata: { event_type: event.event_type },
      });
      return new Response(JSON.stringify({ success: result.success }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    // Special handling: meeting invitations - send to individual invited users
    if (event.event_type === "meeting_invitation" && (event as any).invited_user_ids?.length > 0) {
      const invitedIds = (event as any).invited_user_ids as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone, full_name")
        .in("id", invitedIds);

      for (const p of (profiles || [])) {
        if (!p.phone) continue;
        const personalText = `📹 دعوة اجتماع ${(event as any).meeting_type === 'audio' ? 'صوتي' : 'مرئي'}\nمرحباً ${p.full_name || ''}!\n\nالعنوان: ${(event as any).meeting_title || ''}\nمن: ${(event as any).host_name || 'مستخدم'}\n${(event as any).scheduled_at ? `📅 الموعد: ${(event as any).scheduled_at}` : '⚡ يبدأ الآن'}\n\n🔗 انضم من لوحة التحكم ← الاجتماعات المرئية\n🕐 ${new Date().toLocaleString('ar-EG')}`;
        const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, p.phone, personalText);
        await supabase.from("whatsapp_messages").insert({
          organization_id: event.organization_id || null,
          direction: "outbound",
          to_phone: p.phone,
          content: personalText,
          status: sendResult.success ? "sent" : "failed",
          error_message: sendResult.error || null,
          metadata: { event_type: "meeting_invitation", user_id: p.id },
        });
        results.push({ user: p.id, phone: p.phone, success: sendResult.success });
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const orgId of targets) {
      const { data: orgConfig } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("organization_id", orgId)
        .single();

      if (!orgConfig?.is_active) {
        console.log(`[whatsapp-event] WhatsApp disabled for org ${orgId}`);
        continue;
      }

      if (configColumn && !(orgConfig as any)[configColumn]) {
        console.log(`[whatsapp-event] ${configColumn} disabled for org ${orgId}`);
        continue;
      }

      const { data: channels } = await supabase
        .from("notification_channels")
        .select("user_id, phone_number")
        .eq("organization_id", orgId)
        .eq("channel_type", "whatsapp")
        .eq("is_enabled", true)
        .eq("notify_shipment_updates", true);

      if (!channels || channels.length === 0) {
        // Fallback: send to org phone
        const { data: orgData } = await supabase
          .from("organizations")
          .select("phone")
          .eq("id", orgId)
          .single();

        if (orgData?.phone) {
          const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, orgData.phone, text);
          await supabase.from("whatsapp_messages").insert({
            organization_id: orgId,
            direction: "outbound",
            to_phone: orgData.phone,
            content: text,
            status: sendResult.success ? "sent" : "failed",
            error_message: sendResult.error || null,
            metadata: { event_type: event.event_type, fallback: true },
          });
          results.push({ org: orgId, phone: orgData.phone, success: sendResult.success, fallback: true });
        }
        continue;
      }

      for (const ch of channels) {
        if (!ch.phone_number) continue;
        const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, ch.phone_number, text);
        await supabase.from("whatsapp_messages").insert({
          organization_id: orgId,
          direction: "outbound",
          to_phone: ch.phone_number,
          user_id: ch.user_id,
          content: text,
          status: sendResult.success ? "sent" : "failed",
          error_message: sendResult.error || null,
          metadata: { event_type: event.event_type },
        });
        results.push({ org: orgId, phone: ch.phone_number, success: sendResult.success });
      }
    }

    // Direct send to customer_phone
    if (event.customer_phone) {
      const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, event.customer_phone, text);
      results.push({ phone: event.customer_phone, success: sendResult.success, direct: true });
    }

    // Direct send to driver_phone for driver-specific events
    if (event.driver_phone && ["driver_assigned", "shipment_approved", "shipment_in_transit"].includes(event.event_type)) {
      const driverText = event.event_type === "driver_assigned"
        ? `🚛 مهمة جديدة لك!\nالشحنة: #${event.shipment_number || ''}\nنوع النفايات: ${event.extra?.waste_type || ''}\nالكمية: ${event.extra?.quantity || ''}\n📍 من: ${event.extra?.pickup_address || ''}\n📍 إلى: ${event.extra?.delivery_address || ''}\nيرجى الدخول للمنصة لقبول المهمة.`
        : text;
      const sendResult = await sendViaWaPilot(WAPILOT_TOKEN, event.driver_phone, driverText);
      await supabase.from("whatsapp_messages").insert({
        organization_id: event.transporter_org_id || null,
        direction: "outbound",
        to_phone: event.driver_phone,
        content: driverText,
        status: sendResult.success ? "sent" : "failed",
        error_message: sendResult.error || null,
        metadata: { event_type: event.event_type, target: "driver" },
      });
      results.push({ phone: event.driver_phone, success: sendResult.success, target: "driver" });
    }

    console.log(`[whatsapp-event] Completed via WaPilot: ${results.length} sends`);

    return new Response(
      JSON.stringify({ success: true, results }),
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

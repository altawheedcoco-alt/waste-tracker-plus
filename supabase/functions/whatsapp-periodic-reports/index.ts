import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const reportType = body.report_type || "daily"; // "daily" or "weekly"

    // Get all organizations with active WhatsApp config
    const { data: orgConfigs } = await supabase
      .from("whatsapp_config")
      .select("organization_id, is_active")
      .eq("is_active", true);

    if (!orgConfigs || orgConfigs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active WhatsApp configs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];
    const now = new Date();
    const periodStart = reportType === "daily"
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const config of orgConfigs) {
      const orgId = config.organization_id;

      // Get org name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();

      // Get shipment stats for the period
      const { data: shipments } = await supabase
        .from("shipments")
        .select("id, status, quantity, waste_type, created_at")
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .gte("created_at", periodStart.toISOString());

      const totalShipments = shipments?.length || 0;
      const completedShipments = shipments?.filter(s => s.status === "delivered" || s.status === "confirmed").length || 0;
      const totalQuantity = shipments?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

      // Get financial stats
      const { data: ledgerEntries } = await supabase
        .from("accounting_ledger")
        .select("amount, entry_type")
        .eq("organization_id", orgId)
        .gte("entry_date", periodStart.toISOString());

      const totalRevenue = ledgerEntries?.filter(e => e.entry_type === "credit").reduce((s, e) => s + e.amount, 0) || 0;
      const totalExpenses = ledgerEntries?.filter(e => e.entry_type === "debit").reduce((s, e) => s + e.amount, 0) || 0;

      // Build report text
      const periodLabel = reportType === "daily" ? "اليومي" : "الأسبوعي";
      const dateRange = reportType === "daily"
        ? now.toLocaleDateString("ar-EG")
        : `${periodStart.toLocaleDateString("ar-EG")} - ${now.toLocaleDateString("ar-EG")}`;

      const reportText = `📊 التقرير ${periodLabel} — ${org?.name || ""}
📅 ${dateRange}

📦 الشحنات:
• إجمالي: ${totalShipments}
• مكتملة: ${completedShipments}
• الكمية: ${totalQuantity.toLocaleString("ar-EG")} كجم
• نسبة الإنجاز: ${totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : 0}%

💰 المالية:
• الإيرادات: ${totalRevenue.toLocaleString("ar-EG")} ج.م
• المصروفات: ${totalExpenses.toLocaleString("ar-EG")} ج.م
• الصافي: ${(totalRevenue - totalExpenses).toLocaleString("ar-EG")} ج.م

🕐 ${now.toLocaleString("ar-EG")}
— منصة آي ريسايكل 🌿`;

      // Get users who enabled this report type
      const notifyColumn = reportType === "daily" ? "notify_daily_reports" : "notify_weekly_reports";
      const { data: channels } = await supabase
        .from("notification_channels")
        .select("phone_number, user_id")
        .eq("organization_id", orgId)
        .eq("channel_type", "whatsapp")
        .eq("is_enabled", true)
        .eq(notifyColumn, true);

      if (channels && channels.length > 0) {
        // Send via whatsapp-event
        for (const ch of channels) {
          if (!ch.phone_number) continue;
          const { data: sendResult } = await supabase.functions.invoke("whatsapp-send", {
            body: {
              action: "send",
              to_phone: ch.phone_number,
              organization_id: orgId,
              user_id: ch.user_id,
              message_text: reportText,
              message_type: "report",
              metadata: { report_type: reportType },
            },
          });
          results.push({ org: orgId, phone: ch.phone_number, success: sendResult?.success });
        }
      } else {
        // Fallback: send to org phone
        if (org) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("phone")
            .eq("id", orgId)
            .single();

          if (orgData?.phone) {
            const { data: sendResult } = await supabase.functions.invoke("whatsapp-send", {
              body: {
                action: "send",
                to_phone: orgData.phone,
                organization_id: orgId,
                message_text: reportText,
                message_type: "report",
                metadata: { report_type: reportType },
              },
            });
            results.push({ org: orgId, phone: orgData.phone, success: sendResult?.success, fallback: true });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, report_type: reportType, sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[whatsapp-periodic-reports] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

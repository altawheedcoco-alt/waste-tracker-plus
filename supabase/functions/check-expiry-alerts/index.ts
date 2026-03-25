import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let totalNotifications = 0;

    // ========== 1. Driver Documents Expiring ==========
    const { data: expiringDocs } = await supabase
      .from("driver_documents")
      .select("id, document_type, expiry_date, driver_id, drivers!inner(user_id, organization_id, full_name)")
      .not("expiry_date", "is", null)
      .lte("expiry_date", in30Days)
      .gte("expiry_date", now.toISOString());

    if (expiringDocs?.length) {
      const notifications = [];
      for (const doc of expiringDocs) {
        const driver = (doc as any).drivers;
        const daysLeft = Math.ceil(
          (new Date(doc.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const urgency = daysLeft <= 7 ? "🔴" : "🟡";
        const title = `${urgency} مستند سائق قارب على الانتهاء`;
        const message = `مستند "${doc.document_type}" للسائق ${driver?.full_name || "غير معروف"} ينتهي خلال ${daysLeft} يوم`;

        // Notify driver
        if (driver?.user_id) {
          notifications.push({
            user_id: driver.user_id,
            title,
            message,
            type: "expiry_alert",
            is_read: false,
          });
        }

        // Notify org admins
        if (driver?.organization_id) {
          const { data: orgMembers } = await supabase
            .from("profiles")
            .select("id")
            .eq("organization_id", driver.organization_id);
          
          for (const member of orgMembers || []) {
            if (member.id !== driver?.user_id) {
              notifications.push({
                user_id: member.id,
                title,
                message,
                type: "expiry_alert",
                is_read: false,
              });
            }
          }
        }
      }

      if (notifications.length) {
        // Deduplicate by checking existing notifications from today
        const today = now.toISOString().split("T")[0];
        const { data: existingToday } = await supabase
          .from("notifications")
          .select("user_id, message")
          .eq("type", "expiry_alert")
          .gte("created_at", today);

        const existingSet = new Set(
          (existingToday || []).map((n) => `${n.user_id}:${n.message}`)
        );

        const newNotifications = notifications.filter(
          (n) => !existingSet.has(`${n.user_id}:${n.message}`)
        );

        if (newNotifications.length) {
          await supabase.from("notifications").insert(newNotifications);
          totalNotifications += newNotifications.length;
        }
      }
    }

    // ========== 2. Environmental Certificates Expiring ==========
    const { data: expiringCerts } = await supabase
      .from("environmental_certificates")
      .select("id, certificate_type, valid_until, organization_id")
      .not("valid_until", "is", null)
      .lte("valid_until", in30Days)
      .gte("valid_until", now.toISOString());

    if (expiringCerts?.length) {
      for (const cert of expiringCerts) {
        const daysLeft = Math.ceil(
          (new Date(cert.valid_until!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const urgency = daysLeft <= 7 ? "🔴" : "🟡";
        const title = `${urgency} شهادة بيئية قاربت على الانتهاء`;
        const message = `شهادة "${cert.certificate_type}" تنتهي خلال ${daysLeft} يوم`;

        const { data: orgMembers } = await supabase
          .from("profiles")
          .select("id")
          .eq("organization_id", cert.organization_id);

        const today = now.toISOString().split("T")[0];
        const { data: existingToday } = await supabase
          .from("notifications")
          .select("user_id")
          .eq("type", "expiry_alert")
          .eq("message", message)
          .gte("created_at", today);

        const existingUserIds = new Set((existingToday || []).map((n) => n.user_id));

        const newNotifs = (orgMembers || [])
          .filter((m) => !existingUserIds.has(m.id))
          .map((m) => ({
            user_id: m.id,
            title,
            message,
            type: "expiry_alert",
            is_read: false,
          }));

        if (newNotifs.length) {
          await supabase.from("notifications").insert(newNotifs);
          totalNotifications += newNotifs.length;
        }
      }
    }

    // ========== 3. Overdue Invoices ==========
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, currency, due_date, organization_id, partner_organization_id")
      .eq("status", "sent")
      .not("due_date", "is", null)
      .lt("due_date", now.toISOString());

    if (overdueInvoices?.length) {
      // Update status to overdue
      const overdueIds = overdueInvoices.map((i) => i.id);
      await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .in("id", overdueIds);

      for (const inv of overdueInvoices) {
        const daysOverdue = Math.ceil(
          (now.getTime() - new Date(inv.due_date!).getTime()) / (1000 * 60 * 60 * 24)
        );
        const title = "⚠️ فاتورة متأخرة السداد";
        const message = `الفاتورة ${inv.invoice_number || inv.id.slice(0, 8)} بقيمة ${inv.total_amount} ${inv.currency || "SAR"} متأخرة ${daysOverdue} يوم`;

        const orgIds = [inv.organization_id, inv.partner_organization_id].filter(Boolean);
        
        for (const orgId of orgIds) {
          const { data: members } = await supabase
            .from("profiles")
            .select("id")
            .eq("organization_id", orgId!);

          const today = now.toISOString().split("T")[0];
          const { data: existingToday } = await supabase
            .from("notifications")
            .select("user_id")
            .eq("type", "overdue_invoice")
            .ilike("message", `%${inv.invoice_number || inv.id.slice(0, 8)}%`)
            .gte("created_at", today);

          const existingUserIds = new Set((existingToday || []).map((n) => n.user_id));

          const newNotifs = (members || [])
            .filter((m) => !existingUserIds.has(m.id))
            .map((m) => ({
              user_id: m.id,
              title,
              message,
              type: "overdue_invoice",
              is_read: false,
            }));

          if (newNotifs.length) {
            await supabase.from("notifications").insert(newNotifs);
            totalNotifications += newNotifs.length;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_notifications_sent: totalNotifications,
        checked: {
          expiring_documents: expiringDocs?.length || 0,
          expiring_certificates: expiringCerts?.length || 0,
          overdue_invoices: overdueInvoices?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-expiry-alerts error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

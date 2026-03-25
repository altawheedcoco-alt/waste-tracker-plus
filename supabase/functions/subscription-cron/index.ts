import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const results = { expired: 0, grace_started: 0, reminders_sent: 0, errors: 0 };

    // 1. Find expired subscriptions (past grace period)
    const { data: expiredSubs, error: expErr } = await supabase
      .from("user_subscriptions")
      .select("*")
      .in("status", ["active", "grace_period"])
      .lt("expiry_date", now.toISOString());

    if (expErr) throw expErr;

    for (const sub of expiredSubs || []) {
      try {
        const expiryDate = new Date(sub.expiry_date);
        const graceHours = sub.grace_period_hours || 24;
        const graceEnd = new Date(expiryDate.getTime() + graceHours * 60 * 60 * 1000);

        if (now > graceEnd) {
          // Grace period over - deactivate
          await supabase
            .from("user_subscriptions")
            .update({ status: "expired" })
            .eq("id", sub.id);

          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            title: "⛔ انتهى اشتراكك",
            message: "انتهت فترة اشتراكك وفترة السماح. يرجى تجديد الاشتراك للوصول للمنصة.",
            type: "subscription_expired",
          });

          // WhatsApp notification
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("phone")
              .eq("id", sub.user_id)
              .single();

            if (profile?.phone) {
              await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  to_phone: profile.phone,
                  template_name: "account_suspended",
                  template_params: ["المنصة", "انتهاء الاشتراك"],
                  user_id: sub.user_id,
                }),
              });
            }
          } catch (e) { /* non-blocking */ }

          results.expired++;
          console.log(`Expired subscription for user ${sub.user_id}`);
        } else if (sub.status === "active") {
          // Start grace period
          await supabase
            .from("user_subscriptions")
            .update({ status: "grace_period" })
            .eq("id", sub.id);

          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            title: "⚠️ انتهى اشتراكك - فترة سماح",
            message: `انتهت فترة اشتراكك. لديك ${graceHours} ساعة إضافية لتجديد الاشتراك قبل تعطيل الحساب.`,
            type: "subscription_grace",
          });

          results.grace_started++;
        }
      } catch (subErr) {
        console.error(`Error processing sub ${sub.id}:`, subErr);
        results.errors++;
      }
    }

    // 2. Send reminders for subscriptions expiring in 3 days
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    const { data: expiringSoon } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("status", "active")
      .gte("expiry_date", `${todayStr}T00:00:00Z`)
      .lte("expiry_date", `${threeDaysStr}T23:59:59Z`);

    for (const sub of expiringSoon || []) {
      try {
        const expiryDate = new Date(sub.expiry_date);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if reminder already sent today
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", sub.user_id)
          .eq("type", "subscription_reminder")
          .gte("created_at", `${todayStr}T00:00:00Z`)
          .limit(1);

        if (existingNotif && existingNotif.length > 0) continue;

        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: `⏰ اشتراكك ينتهي خلال ${daysLeft} يوم`,
          message: `يرجى تجديد اشتراكك قبل ${expiryDate.toLocaleDateString("ar-EG")} لتجنب انقطاع الخدمة.`,
          type: "subscription_reminder",
        });

        // WhatsApp reminder
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", sub.user_id)
            .single();

          if (profile?.phone) {
            await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to_phone: profile.phone,
                template_name: "subscription_reminder",
                template_params: ["المنصة", String(daysLeft)],
                user_id: sub.user_id,
              }),
            });
          }
        } catch (e) { /* non-blocking */ }

        results.reminders_sent++;
      } catch (remErr) {
        console.error(`Reminder error for sub ${sub.id}:`, remErr);
        results.errors++;
      }
    }

    console.log("Subscription cron results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Subscription cron error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

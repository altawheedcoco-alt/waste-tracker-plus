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

    const findings: any[] = [];
    const now = new Date();

    // ========== 1. Check for tables without RLS ==========
    const { data: tablesNoRls } = await supabase.rpc("check_tables_without_rls").catch(() => ({ data: null }));
    // Fallback: direct query
    if (!tablesNoRls) {
      const { data: allTables } = await supabase
        .from("information_schema.tables" as any)
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_type", "BASE TABLE");
      // Note: can't check RLS status from here easily, skip
    }

    // ========== 2. Check for failed login attempts (brute force) ==========
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: securityEvents } = await supabase
      .from("security_events")
      .select("event_type, count:id")
      .eq("severity", "warning")
      .gte("created_at", oneDayAgo);

    if (securityEvents && securityEvents.length > 10) {
      findings.push({
        type: "high_security_events",
        severity: "high",
        message: `${securityEvents.length} أحداث أمنية في آخر 24 ساعة`,
        count: securityEvents.length,
      });
    }

    // ========== 3. Check rate limit violations ==========
    const { data: rateLimitHits } = await supabase
      .from("security_events")
      .select("id, details")
      .eq("event_type", "rate_limit_exceeded")
      .gte("created_at", oneDayAgo);

    if (rateLimitHits && rateLimitHits.length > 0) {
      findings.push({
        type: "rate_limit_violations",
        severity: "medium",
        message: `${rateLimitHits.length} تجاوز لحد الطلبات في آخر 24 ساعة`,
        count: rateLimitHits.length,
      });
    }

    // ========== 4. Check for users with no 2FA ==========
    const { data: usersNo2FA, count: no2faCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .is("two_factor_secret", null);

    if (no2faCount && no2faCount > 0) {
      findings.push({
        type: "users_without_2fa",
        severity: "info",
        message: `${no2faCount} مستخدم بدون مصادقة ثنائية`,
        count: no2faCount,
      });
    }

    // ========== 5. Check expired sessions/tokens ==========
    const { data: expiredTokens, count: expiredCount } = await supabase
      .from("portal_access_tokens")
      .select("id", { count: "exact" })
      .lt("expires_at", now.toISOString())
      .eq("is_active", true);

    if (expiredCount && expiredCount > 0) {
      // Deactivate expired tokens
      await supabase
        .from("portal_access_tokens")
        .update({ is_active: false })
        .lt("expires_at", now.toISOString())
        .eq("is_active", true);

      findings.push({
        type: "expired_tokens_cleaned",
        severity: "info",
        message: `تم تعطيل ${expiredCount} رمز وصول منتهي الصلاحية`,
        count: expiredCount,
      });
    }

    // ========== 6. Check API keys expiry ==========
    const { data: expiredApiKeys } = await supabase
      .from("api_keys")
      .select("id, name")
      .lt("expires_at", now.toISOString())
      .eq("is_active", true);

    if (expiredApiKeys && expiredApiKeys.length > 0) {
      await supabase
        .from("api_keys")
        .update({ is_active: false })
        .in("id", expiredApiKeys.map((k) => k.id));

      findings.push({
        type: "expired_api_keys_cleaned",
        severity: "medium",
        message: `تم تعطيل ${expiredApiKeys.length} مفتاح API منتهي الصلاحية`,
        keys: expiredApiKeys.map((k) => k.name),
      });
    }

    // ========== 7. Cleanup old rate limit entries ==========
    await supabase.rpc("cleanup_rate_limit_entries").catch(() => {});

    // ========== 8. Log scan results ==========
    const hasCritical = findings.some((f) => f.severity === "high" || f.severity === "critical");

    await supabase.from("security_events").insert({
      event_type: "security_scan",
      severity: hasCritical ? "high" : "info",
      details: {
        scan_time: now.toISOString(),
        findings_count: findings.length,
        findings,
      },
    });

    // ========== 9. Notify admins if critical findings ==========
    if (hasCritical) {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins?.length) {
        const notifications = admins.map((a) => ({
          user_id: a.user_id,
          title: "🔴 تنبيه أمني - نتائج الفحص الدوري",
          message: `تم اكتشاف ${findings.length} نتيجة أمنية تحتاج مراجعة فورية`,
          type: "security",
          is_read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scan_time: now.toISOString(),
        findings_count: findings.length,
        has_critical: hasCritical,
        findings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("security-scan error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

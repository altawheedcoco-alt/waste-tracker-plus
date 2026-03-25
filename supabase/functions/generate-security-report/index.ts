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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;
    const body = await req.json().catch(() => ({}));
    const period = body.period || "daily";

    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case "hourly":
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "weekly":
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // daily
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Gather threat stats for the period
    let threatQuery = supabase
      .from("cyber_threats")
      .select("*")
      .gte("detected_at", periodStart.toISOString())
      .lte("detected_at", now.toISOString());

    if (orgId) {
      threatQuery = threatQuery.eq("organization_id", orgId);
    }

    const { data: threats = [] } = await threatQuery;

    const critical = threats.filter((t: any) => t.severity === "critical").length;
    const high = threats.filter((t: any) => t.severity === "high").length;
    const medium = threats.filter((t: any) => t.severity === "medium").length;
    const low = threats.filter((t: any) => t.severity === "low").length;
    const mitigated = threats.filter((t: any) => t.status === "mitigated" || t.status === "resolved").length;
    const pending = threats.filter((t: any) => t.status === "detected" || t.status === "analyzing").length;

    // Calculate security score
    const total = threats.length;
    const criticalRatio = critical / Math.max(total, 1);
    const activeRatio = pending / Math.max(total, 1);
    const autoMitigated = threats.filter((t: any) => t.auto_response_taken).length;
    const autoRatio = autoMitigated / Math.max(total, 1);
    const securityScore = Math.round(
      Math.max(0, Math.min(100, 100 - criticalRatio * 40 - activeRatio * 30 + autoRatio * 20))
    );

    // Determine status
    let status = "clean";
    if (critical > 0 || pending > 3) status = "critical";
    else if (high > 0 || pending > 0) status = "warning";

    // Build findings
    const findings: any[] = [];
    const typeGroups: Record<string, number> = {};
    for (const t of threats) {
      typeGroups[(t as any).threat_type] = (typeGroups[(t as any).threat_type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(typeGroups)) {
      findings.push({ type, count, severity: threats.find((t: any) => t.threat_type === type)?.severity });
    }

    // Build recommendations
    const recommendations: string[] = [];
    if (critical > 0) recommendations.push("مراجعة فورية للتهديدات الحرجة واتخاذ إجراءات عاجلة");
    if (pending > 0) recommendations.push(`معالجة ${pending} تهديد معلق في أقرب وقت`);
    if (autoRatio < 0.5 && total > 0) recommendations.push("تفعيل المزيد من قواعد الدفاع التلقائي لتحسين سرعة الاستجابة");
    if (securityScore < 70) recommendations.push("تعزيز الإجراءات الأمنية — درجة الأمان أقل من المستوى المقبول");
    if (total === 0) recommendations.push("لم يتم رصد أي تهديدات — النظام في حالة أمنية مستقرة");
    recommendations.push("الاستمرار في المراقبة الدورية وتحديث قواعد الدفاع");

    // Generate summary
    const periodLabels: Record<string, string> = {
      hourly: "الساعة الأخيرة",
      daily: "آخر 24 ساعة",
      weekly: "آخر 7 أيام",
      monthly: "آخر 30 يوم",
    };
    const periodLabel = periodLabels[period] || period;

    let summary: string;
    if (total === 0) {
      summary = `✅ تقرير ${periodLabel}: لم يتم رصد أي تهديدات أمنية. النظام يعمل بأمان تام. درجة الأمان: ${securityScore}/100`;
    } else if (status === "critical") {
      summary = `🔴 تقرير ${periodLabel}: تم رصد ${total} تهديد (${critical} حرج، ${high} عالي). تم التعامل مع ${mitigated} تلقائياً. ${pending} تهديد بانتظار المعالجة. درجة الأمان: ${securityScore}/100`;
    } else if (status === "warning") {
      summary = `⚠️ تقرير ${periodLabel}: تم رصد ${total} تهديد (${high} عالي، ${medium} متوسط). تم التخفيف من ${mitigated}. درجة الأمان: ${securityScore}/100`;
    } else {
      summary = `✅ تقرير ${periodLabel}: تم رصد ${total} تهديد بسيط وتم التعامل معها بنجاح. درجة الأمان: ${securityScore}/100`;
    }

    // Insert report
    const { data: report, error: insertError } = await supabase
      .from("security_reports")
      .insert({
        organization_id: orgId,
        report_type: body.type || "periodic",
        report_period: period,
        status,
        summary,
        total_threats: total,
        critical_threats: critical,
        high_threats: high,
        medium_threats: medium,
        low_threats: low,
        threats_mitigated: mitigated,
        threats_pending: pending,
        security_score: securityScore,
        findings,
        recommendations,
        period_start: periodStart.toISOString(),
        period_end: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify admins if critical
    if (status === "critical") {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins?.length) {
        const notifications = admins.map((a: any) => ({
          user_id: a.user_id,
          title: "🔴 تقرير أمني حرج",
          message: summary,
          type: "security",
          is_read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-security-report error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

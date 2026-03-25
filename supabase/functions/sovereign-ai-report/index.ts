import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: adminRole } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!adminRole) throw new Error("Not admin");

    const { report_type } = await req.json();

    // Gather platform data
    const [
      { count: orgCount },
      { count: shipmentCount },
      { count: activeShipments },
      { count: driverCount },
      { count: invoiceCount },
      { data: recentAlerts },
      { data: slaViolations },
    ] = await Promise.all([
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("shipments").select("*", { count: "exact", head: true }),
      supabase.from("shipments").select("*", { count: "exact", head: true }).in("status", ["new", "approved", "in_transit"]),
      supabase.from("drivers").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("*", { count: "exact", head: true }),
      supabase.from("early_warning_alerts").select("category, severity").eq("is_resolved", false),
      supabase.from("sla_violations").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const periodLabel = report_type === "daily" ? "اليوم" : report_type === "weekly" ? "هذا الأسبوع" : report_type === "monthly" ? "هذا الشهر" : report_type;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `أنت محلل سيادي لمنصة إدارة النفايات WaPilot. اكتب تقريراً تنفيذياً باللغة العربية بتنسيق Markdown.
البيانات: المنظمات=${orgCount}, الشحنات=${shipmentCount}, النشطة=${activeShipments}, السائقون=${driverCount}, الفواتير=${invoiceCount}, تنبيهات نشطة=${recentAlerts?.length || 0}, مخالفات SLA=${slaViolations?.length || 0}.`,
          },
          {
            role: "user",
            content: `اكتب تقرير ${periodLabel} سيادي شامل يتضمن: 1) ملخص تنفيذي 2) مؤشرات الأداء الرئيسية 3) تحليل المخاطر 4) التوصيات الاستراتيجية`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_report",
            description: "Save the generated sovereign report",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string", description: "Executive summary in 2-3 sentences" },
                content: { type: "string", description: "Full report content in Markdown" },
                recommendations: { type: "array", items: { type: "string" } },
                risk_indicators: { type: "array", items: { type: "object", properties: { name: { type: "string" }, level: { type: "string" }, description: { type: "string" } } } },
              },
              required: ["title", "summary", "content", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call");

    const parsed = JSON.parse(toolCall.function.arguments);

    const { error: insertErr } = await supabase.from("sovereign_reports").insert({
      report_type,
      title: parsed.title,
      period: periodLabel,
      summary: parsed.summary,
      content: parsed.content,
      recommendations: parsed.recommendations || [],
      risk_indicators: parsed.risk_indicators || [],
      key_metrics: { orgCount, shipmentCount, activeShipments, driverCount, invoiceCount },
      status: "draft",
    });
    if (insertErr) console.error("Insert err:", insertErr);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sovereign-ai-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

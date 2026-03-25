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

    // Verify admin role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (!adminRole) throw new Error("Not admin");

    const { unresolvedAlerts, alertCategories } = await req.json();

    // Gather platform data for analysis
    const [
      { count: orgCount },
      { count: shipmentCount },
      { count: activeShipments },
      { data: recentAlerts },
    ] = await Promise.all([
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      supabase.from("shipments").select("*", { count: "exact", head: true }),
      supabase.from("shipments").select("*", { count: "exact", head: true }).in("status", ["new", "approved", "in_transit"]),
      supabase.from("early_warning_alerts").select("category, severity").eq("is_resolved", false).limit(20),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت مستشار ذكاء اصطناعي سيادي لمنصة إدارة النفايات WaPilot. مهمتك تحليل بيانات المنصة وتقديم قرارات وتوصيات استراتيجية لمدير النظام.

البيانات الحالية:
- عدد المنظمات: ${orgCount || 0}
- إجمالي الشحنات: ${shipmentCount || 0}
- الشحنات النشطة: ${activeShipments || 0}
- التنبيهات غير المعالجة: ${unresolvedAlerts || 0}
- فئات التنبيهات: ${JSON.stringify(alertCategories || [])}
- تفاصيل التنبيهات: ${JSON.stringify(recentAlerts || [])}

أجب بتنسيق JSON فقط وفق الهيكل التالي. لا تضف أي نص خارج JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: "حلل الوضع الحالي للمنصة وقدم 3 توصيات استراتيجية مع تقييم المخاطر. لكل توصية حدد: العنوان، التحليل، مستوى الخطورة (low/medium/high/critical)، والإجراءات المقترحة.",
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_decisions",
            description: "Create sovereign AI decisions with risk analysis",
            parameters: {
              type: "object",
              properties: {
                decisions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      decision_type: { type: "string", enum: ["risk_assessment", "optimization", "compliance_review", "forecast"] },
                      title: { type: "string" },
                      analysis: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      recommendations: { type: "array", items: { type: "string" } },
                    },
                    required: ["decision_type", "title", "analysis", "risk_level", "recommendations"],
                  },
                },
              },
              required: ["decisions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_decisions" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const decisionsToInsert = (parsed.decisions || []).map((d: any) => ({
      decision_type: d.decision_type,
      title: d.title,
      analysis: d.analysis,
      risk_level: d.risk_level,
      recommendations: d.recommendations,
      data_sources: [{ type: "platform_stats", org_count: orgCount, shipment_count: shipmentCount }],
      status: "pending",
    }));

    if (decisionsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("ai_sovereign_decisions").insert(decisionsToInsert);
      if (insertError) console.error("Insert error:", insertError);
    }

    return new Response(JSON.stringify({ success: true, count: decisionsToInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sovereign-ai-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

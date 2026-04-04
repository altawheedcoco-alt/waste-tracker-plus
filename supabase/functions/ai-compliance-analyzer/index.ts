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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const authClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Fetch comprehensive org data
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch documents
    const { data: docs } = await supabase
      .from("organization_documents")
      .select("document_type, status, expiry_date, file_url, notes")
      .eq("organization_id", organization_id);

    // Fetch shipment stats
    const { count: totalShipments } = await supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .or(`generator_id.eq.${organization_id},transporter_id.eq.${organization_id},recycler_id.eq.${organization_id}`);

    const { count: completedShipments } = await supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .or(`generator_id.eq.${organization_id},transporter_id.eq.${organization_id},recycler_id.eq.${organization_id}`)
      .eq("status", "confirmed");

    // Fetch partnerships
    const { count: partnerCount } = await supabase
      .from("verified_partnerships")
      .select("id", { count: "exact", head: true })
      .or(`requester_org_id.eq.${organization_id},partner_org_id.eq.${organization_id}`)
      .eq("status", "active");

    // Build context for AI
    const orgType = org.organization_type;
    const licenseData: Record<string, any> = {};
    const licenseFields = [
      "license_number", "license_expiry_date",
      "wmra_license", "wmra_license_expiry_date",
      "environmental_license", "eeaa_license_expiry_date",
      "land_transport_license", "land_transport_license_expiry_date",
      "ida_license", "ida_license_expiry_date",
      "civil_defense_approval_number", "civil_defense_approval_expiry",
      "occupational_safety_approval_number", "occupational_safety_approval_expiry",
      "eia_certificate_number", "eia_certificate_expiry",
      "incineration_permit_number", "incineration_permit_expiry",
      "landfill_license_number", "landfill_license_expiry",
      "health_ministry_approval_number", "health_ministry_approval_expiry",
      "petroleum_authority_approval_number", "petroleum_authority_approval_expiry",
      "environmental_register_number", "hazardous_materials_register_number",
    ];

    for (const f of licenseFields) {
      if (org[f]) licenseData[f] = org[f];
    }

    const prompt = `أنت خبير امتثال بيئي ومستشار قانوني متخصص في إدارة المخلفات وفقاً للقانون المصري 202/2020 ولوائحه التنفيذية.

تحليل البيانات التالية لجهة من نوع "${orgType}" واسمها "${org.name}":

## التراخيص والتصاريح:
${JSON.stringify(licenseData, null, 2)}

## المستندات المرفوعة:
${JSON.stringify(docs || [], null, 2)}

## الإحصائيات التشغيلية:
- إجمالي الشحنات: ${totalShipments || 0}
- الشحنات المكتملة: ${completedShipments || 0}
- الشراكات النشطة: ${partnerCount || 0}

## المطلوب:
قدم تقريراً تحليلياً صارماً يتضمن:
1. **تقييم عام** (من 100) مع مستوى (ممتاز/جيد/مقبول/ضعيف/حرج)
2. **نقاط القوة** (3-5 نقاط)
3. **نقاط الضعف** (3-5 نقاط مع شرح المخاطر)
4. **توصيات عاجلة** (مرتبة حسب الأولوية)
5. **توصيات تحسينية** (للمدى المتوسط)
6. **مخاطر قانونية** (أي مخالفات محتملة للقانون 202/2020)
7. **مقارنة بالمعايير** (مقارنة الوضع الحالي بأفضل الممارسات المصرية والدولية)

⚠️ ملاحظة مهمة: هذا التقرير استشاري وغير ملزم — لا يمنع أي عملية تشغيلية.

أجب بصيغة JSON فقط بالشكل التالي:
{
  "overall_score": number,
  "level": "excellent|good|acceptable|weak|critical",
  "strengths": ["..."],
  "weaknesses": [{"point": "...", "risk": "..."}],
  "urgent_recommendations": [{"action": "...", "priority": "high|medium", "deadline_days": number}],
  "improvement_recommendations": ["..."],
  "legal_risks": [{"risk": "...", "law_reference": "...", "severity": "high|medium|low"}],
  "standards_comparison": [{"standard": "...", "current_status": "met|partial|not_met", "gap": "..."}],
  "summary": "..."
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت خبير امتثال بيئي مصري. أجب بـ JSON فقط بدون markdown أو backticks." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "رصيد AI غير كافٍ" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let report;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      report = JSON.parse(cleaned);
    } catch {
      report = { raw_response: content, parse_error: true };
    }

    return new Response(
      JSON.stringify({
        success: true,
        report,
        organization: { id: org.id, name: org.name, type: orgType },
        generated_at: new Date().toISOString(),
        disclaimer: "هذا التقرير استشاري وغير ملزم — لا يمنع أي عملية تشغيلية",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI compliance error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

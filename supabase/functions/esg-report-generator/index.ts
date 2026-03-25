import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { organization_id, period_type, include_sdg, include_recommendations } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an ESG (Environmental, Social & Governance) reporting analyst for a waste management company in Egypt/MENA region.

Generate a comprehensive ESG report for a ${period_type || 'quarterly'} period.

Return ONLY valid JSON with this structure:
{
  "overview": {
    "overall_score": 78,
    "environmental_score": 82,
    "social_score": 71,
    "governance_score": 75,
    "rating": "A",
    "trend": "improving"
  },
  "environmental": {
    "waste_diverted_tons": 2450,
    "waste_landfilled_tons": 350,
    "diversion_rate": 87.5,
    "carbon_saved_tons": 1820,
    "carbon_credits": 364,
    "carbon_credit_value_usd": 9100,
    "energy_generated_kwh": 45000,
    "water_saved_liters": 120000,
    "trees_saved": 4200
  },
  "sdg_contributions": [
    {"sdg_number": 7, "sdg_name": "Affordable and Clean Energy", "sdg_name_ar": "طاقة نظيفة وبأسعار معقولة", "contribution_score": 65, "details": "توليد طاقة بديلة من RDF"},
    {"sdg_number": 9, "sdg_name": "Industry, Innovation", "sdg_name_ar": "الصناعة والابتكار", "contribution_score": 72, "details": "تقنيات تدوير متقدمة"},
    {"sdg_number": 11, "sdg_name": "Sustainable Cities", "sdg_name_ar": "مدن ومجتمعات مستدامة", "contribution_score": 80, "details": "تقليل النفايات في المدن"},
    {"sdg_number": 12, "sdg_name": "Responsible Consumption", "sdg_name_ar": "الاستهلاك والإنتاج المسؤولان", "contribution_score": 88, "details": "اقتصاد دائري متكامل"},
    {"sdg_number": 13, "sdg_name": "Climate Action", "sdg_name_ar": "العمل المناخي", "contribution_score": 75, "details": "تقليل 1820 طن CO₂"},
    {"sdg_number": 15, "sdg_name": "Life on Land", "sdg_name_ar": "الحياة في البر", "contribution_score": 60, "details": "حماية التربة من التلوث"}
  ],
  "monthly_trends": [
    {"month": "يناير", "diverted": 180, "landfilled": 30, "carbon_saved": 135, "score": 72},
    {"month": "فبراير", "diverted": 200, "landfilled": 28, "carbon_saved": 150, "score": 74},
    {"month": "مارس", "diverted": 220, "landfilled": 25, "carbon_saved": 165, "score": 76},
    {"month": "أبريل", "diverted": 210, "landfilled": 32, "carbon_saved": 158, "score": 75},
    {"month": "مايو", "diverted": 250, "landfilled": 22, "carbon_saved": 188, "score": 79},
    {"month": "يونيو", "diverted": 270, "landfilled": 20, "carbon_saved": 203, "score": 81},
    {"month": "يوليو", "diverted": 240, "landfilled": 35, "carbon_saved": 180, "score": 77},
    {"month": "أغسطس", "diverted": 230, "landfilled": 28, "carbon_saved": 173, "score": 78},
    {"month": "سبتمبر", "diverted": 260, "landfilled": 24, "carbon_saved": 195, "score": 80},
    {"month": "أكتوبر", "diverted": 280, "landfilled": 18, "carbon_saved": 210, "score": 83},
    {"month": "نوفمبر", "diverted": 290, "landfilled": 15, "carbon_saved": 218, "score": 85},
    {"month": "ديسمبر", "diverted": 300, "landfilled": 12, "carbon_saved": 225, "score": 87}
  ],
  "recommendations": [
    "زيادة نسبة فرز البلاستيك من 72% إلى 85% لرفع أرصدة الكربون",
    "الاستثمار في تقنية التحلل اللاهوائي للمخلفات العضوية لإنتاج البيوجاز",
    "توقيع شراكات مع 3 مصانع أسمنت إضافية لتوسيع بيع RDF",
    "الحصول على شهادة ISO 14001 لتحسين نقاط الحوكمة",
    "تطبيق نظام تتبع رقمي شامل (Blockchain) لسلسلة الحيازة"
  ],
  "investor_highlights": [
    "نسبة تحويل النفايات بلغت 87.5% متجاوزة المعدل العالمي (60%)",
    "توفير 1,820 طن CO₂ يعادل زراعة 4,200 شجرة",
    "أرصدة كربون بقيمة $9,100 قابلة للتداول في الأسواق العالمية",
    "معدل نمو ESG Score بنسبة 15% على أساس سنوي",
    "الامتثال الكامل لمعايير EEAA ومتطلبات جهاز تنظيم إدارة المخلفات (WMRA)",
    "تغطية 12 منطقة صناعية بخدمات إدارة مخلفات متكاملة"
  ]
}

Generate REALISTIC data for a waste management company. Arabic content where specified. Return ONLY JSON.`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: "You are an ESG reporting analyst. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error('Failed to parse ESG response:', content.substring(0, 200));
      throw new Error('Failed to parse ESG data');
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("esg-report-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

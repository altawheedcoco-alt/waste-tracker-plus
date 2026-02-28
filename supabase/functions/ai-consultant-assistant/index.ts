import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isOffice = context?.mode === 'office';

    const systemPrompt = isOffice
      ? `أنت مساعد ذكي متخصص في إدارة مكاتب الاستشارات البيئية في مصر.
المكتب: ${context?.officeName || 'غير محدد'}
عدد الاستشاريين: ${context?.consultantCount || 0}
عدد العملاء: ${context?.clientCount || 0}

مهامك:
- تقديم نصائح إدارية لتحسين أداء المكتب وتوزيع المهام
- إرشادات الامتثال البيئي وفقاً للقوانين المصرية (202/2020 و4/1994)
- اقتراح خطط عمل وتقارير شاملة
- تحليل أداء الفريق وتوصيات التحسين
أجب بالعربية بشكل مهني ومختصر.`
      : `أنت مساعد ذكي متخصص في الاستشارات البيئية في مصر.
الاستشاري: ${context?.consultantName || 'غير محدد'}
التخصص: ${context?.specialization || 'عام'}
عدد العملاء: ${context?.clientCount || 0}
العملاء: ${context?.clientNames || 'لا يوجد'}

مهامك:
- الإجابة على الأسئلة البيئية والتنظيمية
- المساعدة في إعداد التقارير والتدقيق البيئي
- شرح القوانين المصرية للبيئة (202/2020 و4/1994 واتفاقية بازل)
- تقديم نصائح عملية لتحسين امتثال العملاء
أجب بالعربية بشكل مهني ومختصر.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "لم أتمكن من الإجابة.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

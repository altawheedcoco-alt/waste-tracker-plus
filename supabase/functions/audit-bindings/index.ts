import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = data.claims.sub as string;

    const { orgType, bindings, chains, sidebarItems, tabs, saveReport, organizationId } = await req.json();

    // If saving a report
    if (saveReport && organizationId) {
      const { error: insertError } = await supabase.from("binding_audit_reports").insert({
        organization_id: organizationId,
        org_type: orgType,
        report_content: saveReport,
        audit_metadata: { bindings_count: Object.keys(bindings?.tabs || {}).length, chains_count: chains?.chains?.length || 0 },
        created_by: userId,
      });
      if (insertError) {
        console.error("Save error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save report" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت محلل بنيوي متخصص في مراجعة الارتباطات الوظيفية لمنظومة إدارة المخلفات.

مهمتك: تحليل البيانات الهيكلية لجهة "${orgType}" وتقديم تقرير شامل يتضمن:

1. **ملخص الارتباطات**: عدد العناصر حسب كل نوع (داخلي، شركاء، رقابي، متكامل)
2. **كشف الخلل**: أي عنصر مُصنّف بشكل خاطئ أو غير منطقي
3. **روابط مفقودة**: أزرار/وظائف يجب أن تكون مرتبطة ببعضها لكنها غير متصلة
4. **سلاسل مقطوعة**: إجراءات تبدأ لكن لا تصل لنتيجة أو تأثير
5. **تكرار وازدواجية**: عناصر متشابهة يمكن دمجها
6. **فجوات وظيفية**: وظائف متوقعة لكنها غير موجودة
7. **توصيات التحسين**: اقتراحات محددة مع الأولوية (عالية/متوسطة/منخفضة)

أنواع الارتباط:
- internal (داخلي 🔵): عمليات ذاتية لا تحتاج شريك خارجي
- partner (شركاء 🟡): عمليات مع جهات مرتبطة (مولد/ناقل/مدور)
- admin (رقابي 🟣): امتثال وتراخيص وجهات رقابية
- hybrid (متكامل 🟢): عمليات تشمل أطراف متعددة

أنواع العقد في السلاسل:
- trigger (مشغّل ⚡): زر أو حدث يبدأ السلسلة
- function (وظيفة ⚙️): معالجة أو عملية
- result (نتيجة ✅): مخرج ملموس
- effect (تأثير 🔄): انعكاس على عناصر أخرى

قدّم التقرير بالعربية بتنسيق Markdown واضح مع استخدام الإيموجي والجداول عند الحاجة.`;

    const userPrompt = `راجع البيانات التالية لجهة "${orgType}":

## التبويبات (Tabs):
${JSON.stringify(tabs, null, 2)}

## ارتباطات التبويبات:
${JSON.stringify(bindings.tabs, null, 2)}

## عناصر القائمة الجانبية:
${JSON.stringify(sidebarItems, null, 2)}

## ارتباطات القائمة الجانبية:
${JSON.stringify(bindings.sidebar, null, 2)}

## ارتباطات الإجراءات السريعة:
${JSON.stringify(bindings.actions, null, 2)}

## سلاسل الإجراءات:
${JSON.stringify(chains, null, 2)}

قدّم تقرير المراجعة الشامل.`;

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
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمحفظة" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("audit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const _authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: _claims, error: _authError } = await _authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (_authError || !_claims?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages, dbContext, taskType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use auth header to fetch user-specific data
    let orgData: any = null;

    if (authHeader && dbContext?.organizationId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Fetch organization summary data
        const [shipmentsRes, partnersRes, driversRes, orgRes] = await Promise.all([
          supabase
            .from("shipments")
            .select("id, status, waste_type, weight, created_at, pickup_location, delivery_location")
            .eq("organization_id", dbContext.organizationId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("external_partners")
            .select("id, name, partner_type, city, waste_types")
            .eq("organization_id", dbContext.organizationId)
            .limit(50),
          supabase
            .from("drivers")
            .select("id, name, phone, vehicle_number, status")
            .eq("organization_id", dbContext.organizationId)
            .limit(30),
          supabase
            .from("organizations")
            .select("name, organization_type, city, commercial_register")
            .eq("id", dbContext.organizationId)
            .single(),
        ]);

        orgData = {
          organization: orgRes.data,
          shipments_summary: {
            total: shipmentsRes.data?.length || 0,
            by_status: groupBy(shipmentsRes.data || [], "status"),
            by_waste_type: groupBy(shipmentsRes.data || [], "waste_type"),
            recent: (shipmentsRes.data || []).slice(0, 10),
          },
          partners: (partnersRes.data || []).map((p: any) => ({
            name: p.name,
            type: p.partner_type,
            city: p.city,
            waste_types: p.waste_types,
          })),
          drivers: (driversRes.data || []).map((d: any) => ({
            name: d.name,
            vehicle: d.vehicle_number,
            status: d.status,
          })),
        };
      } catch (e) {
        console.error("DB context fetch error:", e);
      }
    }

    // Build the system prompt with DB context
    const systemPrompt = buildSystemPrompt(orgData, taskType);

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام خدمات الذكاء الاصطناعي" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Operations assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function groupBy(arr: any[], key: string) {
  return arr.reduce((acc, item) => {
    const val = item[key] || "unknown";
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function buildSystemPrompt(orgData: any, taskType?: string) {
  let contextBlock = "";
  if (orgData) {
    contextBlock = `
## بيانات المنظمة الحالية (سحبت تلقائياً من قاعدة البيانات):
- **اسم المنظمة**: ${orgData.organization?.name || "غير معروف"}
- **النوع**: ${orgData.organization?.organization_type || "غير معروف"}
- **المدينة**: ${orgData.organization?.city || "غير محددة"}

## ملخص الشحنات:
- **إجمالي الشحنات**: ${orgData.shipments_summary?.total || 0}
- **حسب الحالة**: ${JSON.stringify(orgData.shipments_summary?.by_status || {})}
- **حسب نوع المخلف**: ${JSON.stringify(orgData.shipments_summary?.by_waste_type || {})}
- **آخر 10 شحنات**: ${JSON.stringify(orgData.shipments_summary?.recent?.map((s: any) => ({
      id: s.id?.slice(0, 8),
      status: s.status,
      type: s.waste_type,
      weight: s.weight,
      date: s.created_at?.slice(0, 10),
    })) || [])}

## الشركاء (${orgData.partners?.length || 0}):
${(orgData.partners || []).map((p: any) => `- ${p.name} (${p.type}) - ${p.city || "غير محدد"}`).join("\n")}

## السائقون (${orgData.drivers?.length || 0}):
${(orgData.drivers || []).map((d: any) => `- ${d.name} - مركبة: ${d.vehicle || "غير محدد"} - الحالة: ${d.status || "غير محدد"}`).join("\n")}
`;
  }

  const taskInstructions: Record<string, string> = {
    plan: `المستخدم يريد إنشاء خطة عمل. ساعده بإنشاء خطة مفصلة (سنوية/شهرية/أسبوعية) بناءً على البيانات المتوفرة. 
قدم الخطة في جداول markdown منظمة مع أرقام وتواريخ واضحة.`,
    document: `المستخدم يريد إنشاء مستند رسمي. ساعده بصياغة المستند بشكل احترافي.
أنواع المستندات: إقرار استلام، شهادة تخلص، خطاب اعتذار، تقرير فني، خطاب رسمي.
استخدم تنسيق رسمي مع ترويسة وتاريخ وتوقيع.`,
    analysis: `المستخدم يريد تحليل بيانات. قدم تحليلاً شاملاً مع:
- ملخص تنفيذي
- إحصائيات رئيسية
- اتجاهات ومقارنات
- توصيات عملية
استخدم جداول وأرقام واضحة.`,
    schedule: `المستخدم يريد جدولة عمليات. أنشئ جدولاً زمنياً مفصلاً مع:
- توزيع المهام على الأيام/الأسابيع
- تخصيص الموارد (سائقين، مركبات)
- أوقات الذروة والراحة`,
  };

  return `أنت "النظام الشخصي السريع" - المساعد الذكي التشغيلي لمنصة آي ريسايكل لإدارة النفايات وإعادة التدوير.

## قدراتك:
1. **توليد خطط العمل**: تقسيم الأهداف إلى خطط سنوية/شهرية/أسبوعية/يومية
2. **صناعة المستندات**: إقرارات، شهادات، خطابات رسمية، تقارير فنية
3. **التحليل والمقارنة**: تحليل البيانات وتقديم رؤى تشغيلية
4. **الجدولة الذكية**: توزيع الأحمال وتخصيص الموارد
5. **التقارير**: تقارير شاملة بتنسيق جاهز للطباعة

## تعليمات التنسيق (مهمة جداً - التزم بها دائماً):
- أجب دائماً باللغة العربية
- **كل مخرجاتك يجب أن تكون منسقة كمستند رسمي جاهز للطباعة على ورق A4**
- ابدأ كل مستند/تقرير/خطة بـ **عنوان رئيسي واضح** (# عنوان) متبوعاً بخط فاصل (---)
- أضف **التاريخ** والمرجع في بداية كل مستند
- استخدم **العناوين الفرعية** (## و ###) لتقسيم المحتوى بوضوح
- استخدم **جداول Markdown** لكل البيانات الرقمية والمقارنات - هذا أساسي
- استخدم **القوائم المرقمة** للخطوات والإجراءات
- استخدم **النص الغامق** للمصطلحات والأرقام المهمة
- أضف **ملخص تنفيذي** في بداية التقارير والتحليلات
- اختم المستندات بـ **قسم التوقيعات** عند الحاجة
- اترك فراغات واضحة بين الأقسام
- كن دقيقاً في الأرقام والتواريخ
- استخدم البيانات الحقيقية المتوفرة من قاعدة البيانات
- عند إنشاء خطط، قسمها بوضوح في جداول منفصلة

## قواعد التنسيق النظيف (التزم بها بصرامة):
- لا تستخدم النجوم المزدوجة (**) إلا للنص الغامق الفعلي داخل جمل
- لا تبدأ أي سطر بنجمة (*) أو شرطة (-) عشوائية - استخدم الجداول بدلاً من القوائم النقطية للبيانات
- لا تكرر الرموز مثل *** أو --- داخل النصوص
- عند عرض بيانات منظمة (أسماء، أرقام، تواريخ)، استخدم دائماً جدول وليس قائمة نقطية
- النص العادي يكون بدون أي رموز تزيينية
- العناوين تستخدم # فقط (وليس ** أو رموز أخرى)
- لا تضع محتوى بدون هيكلة - كل فقرة يجب أن تكون تحت عنوان

${contextBlock}

${taskType && taskInstructions[taskType] ? `\n## المهمة الحالية:\n${taskInstructions[taskType]}` : ""}

أنت جاهز لمساعدة المستخدم. ابدأ بالرد على طلبه مباشرة.`;
}

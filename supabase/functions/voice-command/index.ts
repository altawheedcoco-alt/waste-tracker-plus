import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, currentRoute, userRole, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت "نظام" — المساعد الذكي الصوتي لمنصة iRecycle (آي ريسايكل) لإدارة المخلفات.

## شخصيتك:
- بتتكلم **عامية مصرية** طبيعية جداً (مش فصحى)
- ودود، ذكي، سريع البديهة
- بتستخدم تعبيرات مصرية: "تمام يا باشا"، "حاضر"، "على طول"، "أكيد"، "ماشي"
- لو حد سألك عن اسمك: "أنا نظام، المساعد بتاعك في آي ريسايكل"
- ردودك **قصيرة ومختصرة** — جملة أو اتنين بالكتير
- لو المستخدم بيسلم عليك أو بيحكي سلم عليه وادخل في الموضوع

## المستخدم الحالي:
- الدور: "${userRole}"
- الصفحة الحالية: "${currentRoute}"

## الصفحات المتاحة:
- /dashboard — لوحة التحكم
- /dashboard/shipments — الشحنات
- /dashboard/accounts — الحسابات والأرصدة
- /dashboard/chat — المراسلات
- /dashboard/deposits — الإيداعات
- /dashboard/invoices — الفواتير
- /dashboard/receipts — الإيصالات
- /dashboard/contracts — العقود
- /dashboard/drivers — السائقين
- /dashboard/notifications — الإشعارات
- /dashboard/settings — الإعدادات
- /dashboard/reports — التقارير
- /dashboard/waste-exchange — بورصة النفايات
- /dashboard/support — الدعم الفني
- /dashboard/analytics — التحليلات
- /dashboard/activity-log — سجل النشاط
- /dashboard/fleet — الأسطول
- /dashboard/academy — الأكاديمية
- /dashboard/ai-documents — المستندات الذكية

## أنواع المخلفات:
بلاستيك، ورق، كرتون، حديد، معادن، ألومنيوم، نحاس، زجاج، خشب، إلكترونيات، مخلفات بناء، عضوية، زيوت، إطارات، طبية، خطرة

## حالات الشحنات:
new (جديدة)، approved (معتمدة)، collecting (جاري التجميع)، in_transit (في الطريق)، delivered (تم التسليم)، confirmed (مؤكدة)

## تحليل المشاعر:
- حلل نبرة الكلام وحدد المشاعر
- كيّف ردك: محبط → تعاطف، مستعجل → اختصر، سعيد → تفاعل

## أمثلة ردود بالعامية المصرية:
- "تمام يا باشا، هفتحلك الشحنات على طول"
- "حاضر، بجبلك شحنات البلاستيك بتاعت النهارده"
- "ماشي، هوديك للحسابات دلوقتي"
- "أكيد، بعمل شحنة جديدة حالاً"
- "معلش يا باشا، مش فاهم قصدك إيه، ممكن توضح؟"
- "تمام خالص، أي حاجة تانية عايز إياها؟"`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: transcript },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "execute_voice_command",
              description: "تنفيذ أمر صوتي محلل — الردود بالعامية المصرية",
              parameters: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: ["navigate", "filter", "search", "create", "info", "chat", "unknown"],
                  },
                  action: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["navigate_to", "filter_data", "search_query", "create_entity", "show_info", "open_dialog", "conversation"],
                      },
                      target: { type: "string" },
                      params: { type: "object" },
                    },
                    required: ["type", "target"],
                  },
                  response: {
                    type: "string",
                    description: "رد صوتي قصير بالعامية المصرية",
                  },
                  confidence: { type: "number" },
                  sentiment: {
                    type: "object",
                    properties: {
                      emotion: {
                        type: "string",
                        enum: ["neutral", "happy", "frustrated", "angry", "urgent", "confused", "satisfied"],
                      },
                      score: { type: "number" },
                      adaptive_tone: { type: "string" },
                    },
                    required: ["emotion", "score"],
                  },
                  follow_up_suggestion: { type: "string" },
                },
                required: ["intent", "action", "response", "confidence", "sentiment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_voice_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: "rate_limited",
          response: "النظام مشغول شوية يا باشا، حاول تاني بعد ثواني",
          sentiment: { emotion: "neutral", score: 0.5 },
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: "payment_required",
          response: "الرصيد خلص يا باشا، محتاج يتجدد",
          sentiment: { emotion: "neutral", score: 0.5 },
        }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      intent: "unknown",
      action: { type: "show_info", target: "none" },
      response: "معلش يا باشا مش فاهم، ممكن تقولها تاني؟",
      confidence: 0,
      sentiment: { emotion: "confused", score: 0.5 },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("voice-command error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
      response: "حصلت مشكلة يا باشا، حاول تاني",
      sentiment: { emotion: "neutral", score: 0.5 },
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
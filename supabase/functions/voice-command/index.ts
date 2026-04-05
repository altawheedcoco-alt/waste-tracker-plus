import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, currentRoute, userRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت مساعد ذكي صوتي لمنصة iRecycle لإدارة النفايات. مهمتك تحليل الأوامر الصوتية باللغة العربية وتحويلها لأفعال محددة.

المستخدم الحالي: دور "${userRole}" في الصفحة "${currentRoute}"

## الصفحات المتاحة للتنقل:
- /dashboard — لوحة التحكم الرئيسية
- /dashboard/shipments — الشحنات
- /dashboard/accounts — الحسابات
- /dashboard/chat — الدردشة/المراسلات
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

## أنواع النفايات المعروفة:
بلاستيك، ورق، كرتون، حديد، معادن، ألومنيوم، نحاس، زجاج، خشب، إلكترونيات، مخلفات بناء، مخلفات عضوية، زيوت، إطارات

## حالات الشحنات:
new (جديدة)، approved (معتمدة)، collecting (جاري التجميع)، in_transit (في الطريق)، delivered (تم التسليم)، confirmed (مؤكدة)

## تحليل المشاعر:
حلل نبرة المستخدم وحدد مشاعره (مثلاً: إحباط، رضا، استعجال، حياد، غضب، سعادة) حتى نقدر نتعامل معاه بشكل مناسب.

أجب دائماً بـ JSON فقط بالشكل التالي:
{
  "intent": "navigate" | "filter" | "search" | "create" | "info" | "unknown",
  "action": {
    "type": "navigate_to" | "filter_data" | "search_query" | "create_entity" | "show_info" | "open_dialog",
    "target": "المسار أو الكيان المستهدف",
    "params": { معاملات إضافية حسب الحاجة }
  },
  "response": "رد صوتي قصير ومهذب بالعربية (جملة أو اتنين بالكتير)",
  "confidence": 0.0-1.0,
  "sentiment": {
    "emotion": "neutral" | "happy" | "frustrated" | "angry" | "urgent" | "confused" | "satisfied",
    "score": 0.0-1.0,
    "adaptive_tone": "رد مكيّف حسب مشاعر المستخدم"
  }
}

## قواعد تكيّف الرد حسب المشاعر:
- لو المستخدم محبط أو زعلان → كن أكثر تعاطفاً ومساعدة، قدّم حلول سريعة
- لو المستخدم مستعجل → كن مختصراً ونفّذ بسرعة بدون كلام كتير
- لو المستخدم سعيد → تفاعل بإيجابية
- لو المستخدم مرتبك → اشرح ببساطة وقدم اقتراحات

## أمثلة:
- "افتح الشحنات" → navigate, navigate_to, /dashboard/shipments
- "ورّيني شحنات البلاستيك" → filter, filter_data, target: shipments, params: { waste_type: "بلاستيك" }
- "شحنات النهارده" → filter, filter_data, target: shipments, params: { date_filter: "today" }
- "كام شحنة معلقة" → info, show_info, target: shipments, params: { status: "new", query: "count" }
- "روح للحسابات" → navigate, navigate_to, /dashboard/accounts
- "أنشئ شحنة جديدة" → create, open_dialog, target: new_shipment
- "ابحث عن شركة النيل" → search, search_query, params: { query: "شركة النيل" }

كن ذكياً في فهم اللهجة المصرية والعربية الفصحى. لو مش فاهم الأمر، اطلب توضيح بأدب.`;

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
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "execute_voice_command",
              description: "تنفيذ أمر صوتي محلل مع تحليل المشاعر",
              parameters: {
                type: "object",
                properties: {
                  intent: { type: "string", enum: ["navigate", "filter", "search", "create", "info", "unknown"] },
                  action: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["navigate_to", "filter_data", "search_query", "create_entity", "show_info", "open_dialog"] },
                      target: { type: "string" },
                      params: { type: "object" },
                    },
                    required: ["type", "target"],
                  },
                  response: { type: "string" },
                  confidence: { type: "number" },
                  sentiment: {
                    type: "object",
                    properties: {
                      emotion: { type: "string", enum: ["neutral", "happy", "frustrated", "angry", "urgent", "confused", "satisfied"] },
                      score: { type: "number" },
                      adaptive_tone: { type: "string" },
                    },
                    required: ["emotion", "score"],
                  },
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
        return new Response(JSON.stringify({ error: "rate_limited", response: "النظام مشغول، حاول تاني بعد شوية" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", response: "محتاج تجدد الرصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      response: "مش فاهم الأمر، ممكن تقوله تاني؟",
      confidence: 0,
      sentiment: { emotion: "neutral", score: 0.5 },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-command error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      response: "حصل مشكلة، حاول تاني",
      sentiment: { emotion: "neutral", score: 0.5 },
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

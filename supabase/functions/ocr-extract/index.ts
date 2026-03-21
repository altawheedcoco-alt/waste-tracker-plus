import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function mergeVerbatimText(aiText: string, supplementalText?: string) {
  const cleanAi = (aiText || "").trim();
  const cleanSupplemental = (supplementalText || "").trim();

  if (!cleanSupplemental) return cleanAi;
  if (!cleanAi) return cleanSupplemental;

  // If AI text is shorter than supplemental, prefer supplemental (AI likely summarized)
  if (cleanAi.length < cleanSupplemental.length * 0.7) {
    return cleanSupplemental;
  }

  const normalizedAi = cleanAi.replace(/\s+/g, " ").trim();
  const normalizedSupplemental = cleanSupplemental.replace(/\s+/g, " ").trim();

  if (normalizedAi === normalizedSupplemental) return cleanSupplemental;
  if (normalizedSupplemental.includes(normalizedAi)) return cleanSupplemental;
  if (normalizedAi.includes(normalizedSupplemental)) return cleanAi;

  // Merge both — supplemental first (verbatim), then AI additions
  return `${cleanSupplemental}\n\n--- نص إضافي مستخرج بالذكاء الاصطناعي ---\n${cleanAi}`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, fileName, supplementalText } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 is required");

    const systemPrompt = `أنت محلل مستندات متخصص في استخراج البيانات من المستندات العربية والإنجليزية، خاصة التراخيص والتصاريح البيئية المصرية والموافقات البيئية الصادرة من جهاز شؤون البيئة.

## القواعد الحاسمة:
- يجب أن يحتوي raw_text على النص الكامل الحرفي من المستند بدون أي اختصار أو تلخيص أو حذف
- انسخ النص كما هو حرفياً — كل كلمة وكل رقم وكل بند
- إذا كان المستند يحتوي على قسم "الاشتراطات" أو "الالتزامات" أو "الشروط" فانسخه بالكامل حرفياً بند بند
- إذا وصلك نص مرجعي من طبقة PDF فاحتفظ به كاملاً وأضف إليه أي نص إضافي قرأته من الصورة

## البيانات المطلوبة:
1. raw_text: النص الكامل الحرفي (بدون اختصار)
2. document_type: نوع المستند
3. detected_fields: البيانات المنظمة (رقم الترخيص، التواريخ، الجهات، الأسماء)
4. obligations: قائمة الاشتراطات والالتزامات (إن وجدت) — كل بند على حده
5. waste_types: أنواع المخلفات المذكورة
6. confidence: نسبة الثقة`;

    const userText = `حلل هذا المستند (${fileName || 'document'}) واستخرج كل البيانات منه بالكامل حرفياً.

${supplementalText ? `نص طبقة PDF المرجعي (يجب الحفاظ عليه كاملاً ودمجه مع ما تقرأه من الصورة):\n"""\n${supplementalText}\n"""\n\n` : ''}

هام جداً:
- raw_text يجب أن يحتوي على النص الكامل الحرفي بدون أي حذف أو اختصار
- إذا كان هناك قسم "الاشتراطات" أو "الالتزامات" فانسخه بالكامل حرفياً داخل raw_text وأيضاً ضعه في obligations كقائمة
- لا تلخص ولا تختصر — انسخ كل شيء`;

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
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extract ALL data from a document image verbatim — no summarization",
              parameters: {
                type: "object",
                properties: {
                  raw_text: {
                    type: "string",
                    description: "The COMPLETE verbatim text extracted from the document. Must include every word, number, and line. Never summarize or shorten.",
                  },
                  document_type: {
                    type: "string",
                    enum: ["wmra_license", "environmental_approval", "transport_license", "invoice", "contract", "other"],
                  },
                  detected_fields: {
                    type: "object",
                    properties: {
                      license_number: { type: "string" },
                      issue_date: { type: "string" },
                      expiry_date: { type: "string" },
                      holder_name: { type: "string" },
                      issuing_authority: { type: "string" },
                      waste_types: { type: "array", items: { type: "string" } },
                    },
                  },
                  obligations: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of obligations/conditions/requirements mentioned in the document (الاشتراطات/الالتزامات), each as a separate verbatim item",
                  },
                  confidence: { type: "number", description: "Confidence percentage 0-100" },
                },
                required: ["raw_text", "document_type", "detected_fields", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let result;

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiResponse.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { raw_text: content, document_type: "other", detected_fields: {}, confidence: 50 };
      }
    }

    // Ensure full text is preserved by merging with supplemental
    result.raw_text = mergeVerbatimText(result.raw_text || "", supplementalText);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-extract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

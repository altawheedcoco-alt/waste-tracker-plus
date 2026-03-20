import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, fileName } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 is required");

    const systemPrompt = `أنت محلل مستندات متخصص في استخراج البيانات من المستندات العربية والإنجليزية، خاصة التراخيص والتصاريح البيئية المصرية.

مهمتك:
1. استخرج كل النص الموجود في الصورة بدقة عالية (OCR)
2. حدد نوع المستند (ترخيص WMRA، موافقة بيئية، ترخيص نقل، فاتورة، عقد، أو غير ذلك)
3. استخرج البيانات المنظمة التالية إن وجدت:
   - رقم الترخيص/التصريح
   - تاريخ الإصدار
   - تاريخ الانتهاء
   - اسم الجهة المصدرة
   - اسم صاحب الترخيص
   - أنواع المخلفات المرخصة
   - أي بيانات أخرى مهمة

أجب بتنسيق JSON فقط.`;

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
            content: [
              {
                type: "text",
                text: `حلل هذا المستند (${fileName || 'document'}) واستخرج كل البيانات منه. أجب بـ JSON بالتنسيق التالي:
{
  "raw_text": "النص الكامل المستخرج من المستند",
  "document_type": "wmra_license | environmental_approval | transport_license | invoice | contract | other",
  "detected_fields": {
    "license_number": "رقم الترخيص إن وجد",
    "issue_date": "تاريخ الإصدار",
    "expiry_date": "تاريخ الانتهاء",
    "holder_name": "اسم صاحب الترخيص",
    "issuing_authority": "الجهة المصدرة",
    "waste_types": ["أنواع المخلفات المرخصة"]
  },
  "confidence": 95
}`
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extract structured data from a document image",
              parameters: {
                type: "object",
                properties: {
                  raw_text: { type: "string", description: "Full extracted text from the document" },
                  document_type: { type: "string", enum: ["wmra_license", "environmental_approval", "transport_license", "invoice", "contract", "other"] },
                  detected_fields: {
                    type: "object",
                    properties: {
                      license_number: { type: "string" },
                      issue_date: { type: "string" },
                      expiry_date: { type: "string" },
                      holder_name: { type: "string" },
                      issuing_authority: { type: "string" },
                      waste_types: { type: "array", items: { type: "string" } }
                    }
                  },
                  confidence: { type: "number", description: "Confidence percentage 0-100" }
                },
                required: ["raw_text", "document_type", "detected_fields", "confidence"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للذكاء الاصطناعي" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract from tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing from content
      const content = aiResponse.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { raw_text: content, document_type: "other", detected_fields: {}, confidence: 50 };
      }
    }

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

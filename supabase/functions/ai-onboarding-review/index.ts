import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const _authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: _claims, error: _authError } = await _authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (_authError || !_claims?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { acceptance_id, signer_name, national_id, organization_name, organization_type, 
            has_id_front, has_id_back, has_selfie, has_signature, face_match, face_match_confidence,
            has_business_doc, business_doc_type, business_doc_pages_count,
            has_delegation, delegation_type, delegation_parties_count,
            signer_position, signer_phone, id_verification_confidence } = await req.json();

    const prompt = `أنت مساعد ذكي متخصص في مراجعة مستندات التسجيل والتحقق من الهوية للمنصات القانونية.

قم بتحليل بيانات التسجيل التالية وأعطِ تقييماً شاملاً:

## بيانات الموقّع:
- الاسم: ${signer_name || 'غير محدد'}
- الرقم القومي: ${national_id || 'غير محدد'} (${national_id?.length === 14 ? '14 رقم ✓' : 'غير صالح ✗'})
- المنصب: ${signer_position || 'غير محدد'}
- الهاتف: ${signer_phone || 'غير محدد'}
- المنظمة: ${organization_name || 'غير محدد'}
- نوع المنظمة: ${organization_type || 'غير محدد'}

## المستندات المقدمة:
- وجه البطاقة: ${has_id_front ? 'مرفق ✓' : 'غير مرفق ✗'}
- ظهر البطاقة: ${has_id_back ? 'مرفق ✓' : 'غير مرفق ✗'}
- الصورة الشخصية (سيلفي): ${has_selfie ? 'مرفق ✓' : 'غير مرفق ✗'}
- التوقيع: ${has_signature ? 'مرفق ✓' : 'غير مرفق ✗'}
- تطابق الوجه: ${face_match ? `مطابق ✓ (${face_match_confidence}%)` : 'غير مطابق ✗'}
- ثقة التحقق من البطاقة: ${id_verification_confidence || 'غير محدد'}%

## المستند التجاري:
- مرفق: ${has_business_doc ? 'نعم ✓' : 'لا ✗'}
- نوع المستند: ${business_doc_type || 'غير محدد'}
- عدد الصفحات: ${business_doc_pages_count || 0}

## التوكيل/التفويض:
- يوجد تمثيل قانوني: ${has_delegation ? 'نعم' : 'لا'}
${has_delegation ? `- نوع التمثيل: ${delegation_type === 'power_of_attorney' ? 'توكيل رسمي' : 'تفويض'}` : ''}
${has_delegation ? `- عدد الأطراف: ${delegation_parties_count}` : ''}`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "حلل هذه البيانات وأعطني تقييماً." }
      ],
      tools: [{
        type: "function",
        function: {
          name: "submit_review",
          description: "Submit the AI review results for an onboarding submission",
          parameters: {
            type: "object",
            properties: {
              overall_score: { type: "number", description: "Overall confidence score from 0 to 100" },
              checks: { type: "array", items: { type: "object", properties: { check_name: { type: "string" }, passed: { type: "boolean" }, details: { type: "string" }, weight: { type: "number" } }, required: ["check_name", "passed", "details", "weight"] } },
              summary: { type: "string", description: "Overall summary in Arabic" },
              recommendation: { type: "string", enum: ["auto_approve", "needs_review"] },
              risk_flags: { type: "array", items: { type: "string" } }
            },
            required: ["overall_score", "checks", "summary", "recommendation", "risk_flags"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "submit_review" } }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const review = JSON.parse(toolCall.function.arguments);

    // Determine status based on score
    const status = review.overall_score >= 80 ? 'auto_approved' : 'needs_review';

    return new Response(JSON.stringify({
      success: true,
      review: {
        ...review,
        status,
        acceptance_id,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Review error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

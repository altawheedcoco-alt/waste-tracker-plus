import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const { callNotes, phoneNumber, callDirection, callerName } = await req.json();
    
    if (!callNotes) {
      return new Response(
        JSON.stringify({ error: 'ملاحظات المكالمة مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Analyzing call notes for:', phoneNumber || 'Unknown');

    const systemPrompt = `أنت محلل مكالمات متخصص في خدمة العملاء. مهمتك تحليل ملخص المكالمة واستخراج:
1. المتطلبات الأساسية للعميل
2. المشاكل أو الشكاوى المذكورة
3. الإجراءات المطلوبة
4. درجة الأولوية (عاجل، متوسط، منخفض)
5. تصنيف المكالمة (استفسار، شكوى، طلب خدمة، متابعة، أخرى)
6. ملخص قصير
7. توصيات للمتابعة

قدم الإجابة بصيغة JSON منظمة.`;

    const userPrompt = `حلل هذه المكالمة:
رقم الهاتف: ${phoneNumber || 'غير محدد'}
اسم المتصل: ${callerName || 'غير محدد'}
اتجاه المكالمة: ${callDirection === 'inbound' ? 'واردة' : 'صادرة'}

ملاحظات المكالمة:
${callNotes}`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
          {
            type: "function",
            function: {
              name: "analyze_call",
              description: "تحليل المكالمة واستخراج البيانات المهيكلة",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "ملخص قصير للمكالمة في جملتين" },
                  requirements: { type: "array", items: { type: "string" }, description: "قائمة متطلبات العميل" },
                  issues: { type: "array", items: { type: "string" }, description: "المشاكل أو الشكاوى المذكورة" },
                  actions_required: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["urgent", "medium", "low"] }
                      }
                    },
                    description: "الإجراءات المطلوبة مع أولويتها"
                  },
                  priority: { type: "string", enum: ["urgent", "medium", "low"], description: "درجة أولوية المكالمة الإجمالية" },
                  category: { type: "string", enum: ["inquiry", "complaint", "service_request", "follow_up", "other"], description: "تصنيف المكالمة" },
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"], description: "مشاعر العميل" },
                  follow_up_recommendations: { type: "array", items: { type: "string" }, description: "توصيات للمتابعة" },
                  keywords: { type: "array", items: { type: "string" }, description: "الكلمات المفتاحية من المكالمة" }
                },
                required: ["summary", "requirements", "priority", "category", "sentiment"]
              }
            }
          }
        ],
      tool_choice: { type: "function", function: { name: "analyze_call" } }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام خدمات AI" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    let analysis;
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback parsing
      const content = aiResponse.choices?.[0]?.message?.content || '';
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = {
          summary: content.slice(0, 200),
          requirements: [],
          priority: 'medium',
          category: 'other',
          sentiment: 'neutral'
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        phoneNumber,
        callDirection,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing call:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ في تحليل المكالمة' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

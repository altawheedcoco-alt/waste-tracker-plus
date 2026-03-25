import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PricingData {
  wasteType: string;
  currentPrice: number;
  averageCost: number;
  competitorPrices?: number[];
  demand: 'low' | 'medium' | 'high';
  volume: number;
  customerSegment?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { pricingData, marketConditions, organizationId, optimizationGoal = 'balanced' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Optimizing prices for ${pricingData?.length || 0} items...`);

    const systemPrompt = `أنت خبير في تحسين الأسعار والتسعير الديناميكي لقطاع إدارة المخلفات والنقل.

مهمتك تحليل البيانات واقتراح أسعار مثلى تراعي:
1. **التكاليف التشغيلية**: ضمان تغطية التكاليف مع هامش ربح معقول
2. **أسعار المنافسين**: البقاء تنافسياً في السوق
3. **الطلب**: تعديل الأسعار حسب مستوى الطلب
4. **قيمة العميل**: تقديم أسعار مخصصة للعملاء المهمين
5. **الموسمية**: مراعاة التغيرات الموسمية

أهداف التحسين:
- balanced: توازن بين الربحية والتنافسية
- profit_maximize: تعظيم الأرباح
- market_share: زيادة الحصة السوقية
- customer_retention: الحفاظ على العملاء`;

    const userPrompt = `قم بتحليل البيانات التالية واقتراح أسعار محسّنة:

بيانات التسعير الحالية:
${JSON.stringify(pricingData, null, 2)}

ظروف السوق:
${JSON.stringify(marketConditions || {}, null, 2)}

هدف التحسين: ${optimizationGoal}

قدم:
1. أسعار محسّنة لكل خدمة/منتج
2. تحليل هوامش الربح
3. مقارنة مع أسعار المنافسين
4. توصيات استراتيجية للتسعير`;

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
            name: "price_optimization",
            description: "اقتراحات تحسين الأسعار",
            parameters: {
              type: "object",
              properties: {
                optimizedPrices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      itemId: { type: "string" },
                      itemName: { type: "string" },
                      currentPrice: { type: "number" },
                      suggestedPrice: { type: "number" },
                      minPrice: { type: "number" },
                      maxPrice: { type: "number" },
                      changePercent: { type: "number" },
                      profitMargin: { type: "number" },
                      competitivePosition: { type: "string", enum: ["below_market", "at_market", "above_market"] },
                      rationale: { type: "string" }
                    },
                    required: ["itemName", "currentPrice", "suggestedPrice", "changePercent", "rationale"]
                  }
                },
                marketAnalysis: {
                  type: "object",
                  properties: {
                    averageMarketPrice: { type: "number" },
                    priceRange: { type: "object", properties: { min: { type: "number" }, max: { type: "number" } } },
                    competitiveIndex: { type: "number" },
                    marketPosition: { type: "string" }
                  }
                },
                revenueImpact: {
                  type: "object",
                  properties: {
                    estimatedRevenueChange: { type: "number" },
                    estimatedProfitChange: { type: "number" },
                    breakEvenVolume: { type: "number" },
                    riskLevel: { type: "string", enum: ["low", "medium", "high"] }
                  }
                },
                strategies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      strategy: { type: "string" },
                      description: { type: "string" },
                      expectedImpact: { type: "string" },
                      implementation: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["strategy", "description", "priority"]
                  }
                },
                summary: { type: "string" }
              },
              required: ["optimizedPrices", "revenueImpact", "strategies", "summary"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "price_optimization" } }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار في استخدام الخدمة" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log(`Generated ${result.optimizedPrices?.length || 0} price recommendations`);
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        optimizedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");

  } catch (error) {
    console.error("Price optimization error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تحسين الأسعار" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

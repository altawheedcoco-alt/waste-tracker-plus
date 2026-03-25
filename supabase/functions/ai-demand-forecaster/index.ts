import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface HistoricalData {
  date: string;
  shipmentCount: number;
  totalWeight: number;
  totalRevenue: number;
  wasteTypes?: Record<string, number>;
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

    const { historicalData, forecastPeriod = 'weekly', organizationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Forecasting demand for ${forecastPeriod} period...`);

    const systemPrompt = `أنت خبير في التنبؤ بالطلب وتحليل البيانات الزمنية لقطاع النقل وإدارة المخلفات.

مهمتك تحليل البيانات التاريخية والتنبؤ بـ:
1. **حجم الشحنات المتوقع**: عدد الشحنات اليومية/الأسبوعية/الشهرية
2. **أوقات الذروة**: تحديد الفترات الأكثر نشاطاً
3. **الموسمية**: اكتشاف الأنماط الموسمية
4. **الاتجاهات**: النمو أو الانخفاض المتوقع
5. **التوصيات**: كيفية الاستعداد للفترات القادمة

استخدم أساليب التحليل الإحصائي للوصول لتنبؤات دقيقة.`;

    const userPrompt = `قم بتحليل البيانات التاريخية التالية والتنبؤ بالطلب المستقبلي:

البيانات التاريخية:
${JSON.stringify(historicalData, null, 2)}

فترة التنبؤ المطلوبة: ${forecastPeriod}

قدم:
1. توقعات الطلب للفترة القادمة
2. تحليل الموسمية والاتجاهات
3. أوقات الذروة المتوقعة
4. توصيات لتوزيع الموارد`;

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
            name: "demand_forecast",
            description: "تقرير التنبؤ بالطلب المستقبلي",
            parameters: {
              type: "object",
              properties: {
                forecasts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      period: { type: "string" },
                      predictedShipments: { type: "number" },
                      predictedWeight: { type: "number" },
                      predictedRevenue: { type: "number" },
                      confidence: { type: "number" },
                      isPeakPeriod: { type: "boolean" }
                    },
                    required: ["period", "predictedShipments", "confidence"]
                  }
                },
                trends: {
                  type: "object",
                  properties: {
                    overallTrend: { type: "string", enum: ["increasing", "stable", "decreasing"] },
                    growthRate: { type: "number" },
                    seasonalPatterns: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, impact: { type: "string" } } } }
                  },
                  required: ["overallTrend", "growthRate"]
                },
                peakAnalysis: {
                  type: "object",
                  properties: {
                    peakDays: { type: "array", items: { type: "string" } },
                    peakHours: { type: "array", items: { type: "string" } },
                    lowActivityPeriods: { type: "array", items: { type: "string" } }
                  }
                },
                resourceRecommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      resource: { type: "string" },
                      currentCapacity: { type: "string" },
                      recommendedCapacity: { type: "string" },
                      action: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["resource", "action", "priority"]
                  }
                },
                summary: { type: "string" }
              },
              required: ["forecasts", "trends", "resourceRecommendations", "summary"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "demand_forecast" } }
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
      console.log(`Generated ${result.forecasts?.length || 0} forecast periods`);
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        forecastedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");

  } catch (error) {
    console.error("Demand forecast error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء التنبؤ بالطلب" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

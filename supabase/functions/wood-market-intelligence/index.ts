import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`[Wood Market Intelligence] Action: ${action}`);

    if (action === 'analyze') {
      const { woodType, internalVolume, historicalPrices, region } = data || {};

      const systemPrompt = `أنت محلل متخصص في أسواق الخشب والمخلفات الخشبية في الشرق الأوسط. لديك خبرة عميقة في نوعين أساسيين:

1. **الخشب السكراب (Scrap Wood)**: نشارة، تقطيع، مخلفات تصنيع - سعره مرتبط بأسواق الوقود البديل (RDF)، المازوت، والغاز الطبيعي
2. **الطبالي/البالتات (Pallets)**: خشب سليم قابل لإعادة الاستخدام - سعره مرتبط بأسعار الخشب الجديد وحركة التجارة والموانئ

قم بتحليل البيانات وتقديم تقرير شامل يتضمن توقعات سعرية وتوصيات عملية.`;

      const userPrompt = `حلل سوق الخشب التالي:
- نوع الخشب: ${woodType || 'الكل'}
- المنطقة: ${region || 'السعودية'}
- الحجم الداخلي المتاح: ${internalVolume || 'غير محدد'} طن
- بيانات الأسعار التاريخية: ${JSON.stringify(historicalPrices || [])}

قدم تحليلاً شاملاً يشمل:
1. تحليل السوق الحالي لكل نوع (سكراب وطبالي)
2. العوامل المؤثرة في السعر
3. التوقعات السعرية للأسبوع والشهر القادم
4. توصيات للبيع والشراء
5. تنبيهات ذكية للأطراف المختلفة`;

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
            { role: "user", content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "wood_market_analysis",
              description: "تحليل شامل لسوق الخشب",
              parameters: {
                type: "object",
                properties: {
                  scrapWood: {
                    type: "object",
                    properties: {
                      currentPricePerTon: { type: "number" },
                      predictedPriceNextWeek: { type: "number" },
                      predictedPriceNextMonth: { type: "number" },
                      priceChangePercent: { type: "number" },
                      trend: { type: "string", enum: ["rising", "stable", "falling"] },
                      demandLevel: { type: "string", enum: ["low", "medium", "high", "very_high"] },
                      correlatedFactors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            factor: { type: "string" },
                            impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                            weight: { type: "number" },
                            description: { type: "string" }
                          },
                          required: ["factor", "impact", "description"]
                        }
                      },
                      seasonalNote: { type: "string" }
                    },
                    required: ["currentPricePerTon", "predictedPriceNextWeek", "trend", "demandLevel"]
                  },
                  palletWood: {
                    type: "object",
                    properties: {
                      currentPricePerUnit: { type: "number" },
                      predictedPriceNextWeek: { type: "number" },
                      predictedPriceNextMonth: { type: "number" },
                      priceChangePercent: { type: "number" },
                      trend: { type: "string", enum: ["rising", "stable", "falling"] },
                      demandLevel: { type: "string", enum: ["low", "medium", "high", "very_high"] },
                      correlatedFactors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            factor: { type: "string" },
                            impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                            weight: { type: "number" },
                            description: { type: "string" }
                          },
                          required: ["factor", "impact", "description"]
                        }
                      },
                      seasonalNote: { type: "string" }
                    },
                    required: ["currentPricePerUnit", "predictedPriceNextWeek", "trend", "demandLevel"]
                  },
                  marketOverview: {
                    type: "object",
                    properties: {
                      overallSentiment: { type: "string", enum: ["bullish", "neutral", "bearish"] },
                      confidenceLevel: { type: "number" },
                      keyInsight: { type: "string" },
                      riskLevel: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["overallSentiment", "confidenceLevel", "keyInsight"]
                  },
                  smartAlerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        targetAudience: { type: "string", enum: ["generator", "transporter", "recycler", "all"] },
                        alertType: { type: "string", enum: ["sell_now", "buy_now", "prepare_capacity", "price_drop_warning", "opportunity", "seasonal"] },
                        title: { type: "string" },
                        message: { type: "string" },
                        urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        icon: { type: "string" }
                      },
                      required: ["targetAudience", "alertType", "title", "message", "urgency"]
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        reason: { type: "string" },
                        expectedImpact: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        timeframe: { type: "string" }
                      },
                      required: ["action", "reason", "priority"]
                    }
                  },
                  forecast: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        period: { type: "string" },
                        scrapPrice: { type: "number" },
                        palletPrice: { type: "number" },
                        confidence: { type: "number" }
                      },
                      required: ["period", "scrapPrice", "palletPrice", "confidence"]
                    }
                  },
                  summary: { type: "string" }
                },
                required: ["scrapWood", "palletWood", "marketOverview", "smartAlerts", "recommendations", "summary"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "wood_market_analysis" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({
          success: true,
          ...result,
          analyzedAt: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("Invalid AI response");
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Wood Market Intelligence] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "حدث خطأ"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

import { callAIWithRetry } from "../_shared/ai-retry.ts";

async function callAI(systemPrompt: string, userPrompt: string, useTools = false, tools?: any[]) {
  const options: any = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
  };

  if (useTools && tools) {
    options.tools = tools;
    options.tool_choice = { type: "function", function: { name: tools[0].function.name } };
  }

  const response = await callAIWithRetry(LOVABLE_API_KEY!, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMITED");
    }
    if (response.status === 402) {
      throw new Error("PAYMENT_REQUIRED");
    }
    throw new Error(`AI_ERROR: ${response.status}`);
  }

  const result = await response.json();
  
  if (useTools && result.choices?.[0]?.message?.tool_calls) {
    const toolCall = result.choices[0].message.tool_calls[0];
    return JSON.parse(toolCall.function.arguments);
  }
  
  return result.choices?.[0]?.message?.content || "";
}

// Sentiment Analysis
async function analyzeSentiment(data: { texts: string[], context?: string }) {
  const systemPrompt = `أنت محلل مشاعر متخصص في اللغة العربية والإنجليزية. 
حلل النصوص المقدمة واستخرج:
1. المشاعر السائدة (إيجابي، سلبي، محايد)
2. درجة الثقة (0-100)
3. المواضيع الرئيسية المذكورة
4. نقاط القلق إن وجدت
5. توصيات للتحسين`;

  const tools = [{
    type: "function",
    function: {
      name: "sentiment_analysis",
      description: "تحليل المشاعر للنصوص المقدمة",
      parameters: {
        type: "object",
        properties: {
          overall_sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral", "mixed"],
            description: "المشاعر السائدة"
          },
          confidence: {
            type: "number",
            description: "درجة الثقة من 0 إلى 100"
          },
          sentiment_breakdown: {
            type: "object",
            properties: {
              positive_percentage: { type: "number" },
              negative_percentage: { type: "number" },
              neutral_percentage: { type: "number" }
            }
          },
          key_themes: {
            type: "array",
            items: { type: "string" },
            description: "المواضيع الرئيسية"
          },
          concerns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] }
              }
            }
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          },
          emotional_indicators: {
            type: "object",
            properties: {
              satisfaction: { type: "number" },
              frustration: { type: "number" },
              urgency: { type: "number" },
              trust: { type: "number" }
            }
          }
        },
        required: ["overall_sentiment", "confidence", "sentiment_breakdown", "key_themes"]
      }
    }
  }];

  const userPrompt = `السياق: ${data.context || "تحليل عام"}

النصوص للتحليل:
${data.texts.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

قم بتحليل المشاعر وأعطني تقريراً شاملاً.`;

  return await callAI(systemPrompt, userPrompt, true, tools);
}

// Smart Predictions
async function generatePredictions(data: { 
  historicalData: any[], 
  predictionType: string,
  timeframe: string 
}) {
  const systemPrompt = `أنت خبير تحليل بيانات متخصص في التنبؤات الذكية لقطاع إدارة النفايات.
بناءً على البيانات التاريخية، قم بتوليد تنبؤات دقيقة مع مستوى الثقة والعوامل المؤثرة.`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_predictions",
      description: "توليد تنبؤات ذكية",
      parameters: {
        type: "object",
        properties: {
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                current_value: { type: "number" },
                predicted_value: { type: "number" },
                change_percentage: { type: "number" },
                confidence: { type: "number" },
                trend: { type: "string", enum: ["increasing", "decreasing", "stable"] }
              }
            }
          },
          risk_factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                impact: { type: "string", enum: ["low", "medium", "high"] },
                probability: { type: "number" }
              }
            }
          },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opportunity: { type: "string" },
                potential_value: { type: "string" },
                timeframe: { type: "string" }
              }
            }
          },
          actionable_insights: {
            type: "array",
            items: { type: "string" }
          },
          confidence_level: {
            type: "string",
            enum: ["low", "medium", "high", "very_high"]
          }
        },
        required: ["predictions", "confidence_level"]
      }
    }
  }];

  const userPrompt = `نوع التنبؤ: ${data.predictionType}
الإطار الزمني: ${data.timeframe}

البيانات التاريخية:
${JSON.stringify(data.historicalData, null, 2)}

قم بتحليل البيانات وتوليد تنبؤات ذكية مع توصيات قابلة للتنفيذ.`;

  return await callAI(systemPrompt, userPrompt, true, tools);
}

// Risk Assessment
async function assessRisk(data: {
  contracts?: any[],
  shipments?: any[],
  partners?: any[]
}) {
  const systemPrompt = `أنت خبير تقييم مخاطر متخصص في قطاع إدارة النفايات.
قم بتحليل البيانات وتحديد المخاطر المحتملة مع توصيات للتخفيف.`;

  const tools = [{
    type: "function",
    function: {
      name: "risk_assessment",
      description: "تقييم المخاطر",
      parameters: {
        type: "object",
        properties: {
          overall_risk_score: {
            type: "number",
            description: "درجة المخاطر الإجمالية من 0 إلى 100"
          },
          risk_level: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                probability: { type: "number" },
                impact: { type: "string" },
                mitigation: { type: "string" }
              }
            }
          },
          urgent_actions: {
            type: "array",
            items: { type: "string" }
          },
          monitoring_suggestions: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["overall_risk_score", "risk_level", "risks"]
      }
    }
  }];

  const userPrompt = `البيانات للتحليل:

العقود: ${JSON.stringify(data.contracts || [], null, 2)}
الشحنات: ${JSON.stringify(data.shipments || [], null, 2)}
الشركاء: ${JSON.stringify(data.partners || [], null, 2)}

قم بتقييم المخاطر وتقديم توصيات للتخفيف.`;

  return await callAI(systemPrompt, userPrompt, true, tools);
}

// Smart Recommendations
async function generateRecommendations(data: {
  organizationType: string,
  currentMetrics: any,
  goals?: string[]
}) {
  const systemPrompt = `أنت مستشار أعمال ذكي متخصص في تحسين عمليات إدارة النفايات.
قدم توصيات عملية ومخصصة بناءً على نوع المنشأة والمقاييس الحالية.`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_recommendations",
      description: "توليد توصيات ذكية",
      parameters: {
        type: "object",
        properties: {
          priority_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
                expected_impact: { type: "string" },
                effort: { type: "string", enum: ["low", "medium", "high"] },
                timeline: { type: "string" }
              }
            }
          },
          efficiency_improvements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                area: { type: "string" },
                current_state: { type: "string" },
                recommended_state: { type: "string" },
                potential_savings: { type: "string" }
              }
            }
          },
          growth_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opportunity: { type: "string" },
                description: { type: "string" },
                investment_required: { type: "string" },
                roi_estimate: { type: "string" }
              }
            }
          },
          quick_wins: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["priority_actions", "quick_wins"]
      }
    }
  }];

  const userPrompt = `نوع المنشأة: ${data.organizationType}

المقاييس الحالية:
${JSON.stringify(data.currentMetrics, null, 2)}

الأهداف: ${data.goals?.join(', ') || 'تحسين الكفاءة العامة'}

قدم توصيات عملية ومخصصة.`;

  return await callAI(systemPrompt, userPrompt, true, tools);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, data, context }: AnalysisRequest = await req.json();

    let result;

    switch (type) {
      case 'sentiment':
        result = await analyzeSentiment({ texts: data.texts, context });
        break;
      
      case 'prediction':
        result = await generatePredictions({
          historicalData: data.historicalData,
          predictionType: data.predictionType,
          timeframe: data.timeframe
        });
        break;
      
      case 'risk_assessment':
        result = await assessRisk({
          contracts: data.contracts,
          shipments: data.shipments,
          partners: data.partners
        });
        break;
      
      case 'recommendation':
        result = await generateRecommendations({
          organizationType: data.organizationType,
          currentMetrics: data.currentMetrics,
          goals: data.goals
        });
        break;
      
      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("AI Insights error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let statusCode = 500;
    let userMessage = "حدث خطأ في التحليل";

    if (errorMessage === "RATE_LIMITED") {
      statusCode = 429;
      userMessage = "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً";
    } else if (errorMessage === "PAYMENT_REQUIRED") {
      statusCode = 402;
      userMessage = "يرجى إضافة رصيد للاستمرار في استخدام الذكاء الاصطناعي";
    }

    return new Response(
      JSON.stringify({ success: false, error: userMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

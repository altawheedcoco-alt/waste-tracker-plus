import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ResourceData {
  vehicles: {
    total: number;
    available: number;
    inMaintenance: number;
    utilization: number;
  };
  drivers: {
    total: number;
    available: number;
    avgWorkload: number;
  };
  storage: {
    totalCapacity: number;
    usedCapacity: number;
    utilizationRate: number;
  };
  demandForecast?: {
    expectedShipments: number;
    expectedWeight: number;
    peakLoad: number;
  };
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

    const { resourceData, planningHorizon = '30days', organizationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Planning capacity for ${planningHorizon}...`);

    const systemPrompt = `أنت خبير في تخطيط السعة وإدارة الموارد للشركات اللوجستية وإدارة المخلفات.

مهمتك تحليل بيانات الموارد الحالية والتنبؤ بالاحتياجات المستقبلية:
1. **المركبات**: هل نحتاج مركبات إضافية؟ متى؟
2. **السائقين**: هل نحتاج توظيف سائقين جدد؟
3. **التخزين**: هل السعة التخزينية كافية؟
4. **جدولة العمل**: كيف نوزع الأحمال بشكل مثالي؟
5. **الطوارئ**: كيف نستعد للذروة؟

قدم توصيات عملية قابلة للتنفيذ مع جدول زمني واضح.`;

    const userPrompt = `قم بتحليل بيانات الموارد التالية وتخطيط السعة المستقبلية:

بيانات الموارد الحالية:
${JSON.stringify(resourceData, null, 2)}

أفق التخطيط: ${planningHorizon}

قدم:
1. تحليل شامل للسعة الحالية
2. توقع الاحتياجات المستقبلية
3. توصيات لتوسيع أو تقليص الموارد
4. خطة عمل واضحة`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "capacity_plan",
              description: "خطة السعة والموارد",
              parameters: {
                type: "object",
                properties: {
                  currentCapacityAnalysis: {
                    type: "object",
                    properties: {
                      vehicleUtilization: { type: "number", description: "نسبة استخدام المركبات %" },
                      driverWorkload: { type: "number", description: "متوسط عبء العمل %" },
                      storageUtilization: { type: "number", description: "نسبة استخدام التخزين %" },
                      overallCapacityScore: { type: "number", description: "درجة السعة الإجمالية (0-100)" },
                      bottlenecks: {
                        type: "array",
                        items: { type: "string" },
                        description: "الاختناقات الحالية"
                      },
                      status: { 
                        type: "string", 
                        enum: ["under_capacity", "optimal", "near_capacity", "over_capacity"],
                        description: "حالة السعة"
                      }
                    },
                    required: ["vehicleUtilization", "overallCapacityScore", "status"]
                  },
                  futureRequirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        resource: { type: "string", description: "نوع المورد" },
                        currentCount: { type: "number", description: "العدد الحالي" },
                        requiredCount: { type: "number", description: "العدد المطلوب" },
                        gap: { type: "number", description: "الفجوة" },
                        urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        timeline: { type: "string", description: "الجدول الزمني للتنفيذ" },
                        estimatedCost: { type: "string", description: "التكلفة المقدرة" }
                      },
                      required: ["resource", "currentCount", "requiredCount", "urgency"]
                    }
                  },
                  workloadDistribution: {
                    type: "object",
                    properties: {
                      peakDays: {
                        type: "array",
                        items: { type: "string" }
                      },
                      optimalShifts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            shift: { type: "string" },
                            driversNeeded: { type: "number" },
                            vehiclesNeeded: { type: "number" }
                          }
                        }
                      },
                      loadBalancingRecommendations: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  },
                  actionPlan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "الإجراء المطلوب" },
                        description: { type: "string", description: "وصف الإجراء" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        timeline: { type: "string", description: "الجدول الزمني" },
                        expectedImpact: { type: "string", description: "الأثر المتوقع" },
                        estimatedCost: { type: "string", description: "التكلفة المقدرة" },
                        responsible: { type: "string", description: "المسؤول عن التنفيذ" }
                      },
                      required: ["action", "priority", "timeline"]
                    }
                  },
                  contingencyPlan: {
                    type: "object",
                    properties: {
                      peakLoadStrategy: { type: "string", description: "استراتيجية التعامل مع الذروة" },
                      emergencyContacts: { type: "array", items: { type: "string" } },
                      backupResources: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            resource: { type: "string" },
                            availability: { type: "string" }
                          }
                        }
                      }
                    }
                  },
                  summary: {
                    type: "string",
                    description: "ملخص خطة السعة"
                  }
                },
                required: ["currentCapacityAnalysis", "futureRequirements", "actionPlan", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "capacity_plan" } }
      }),
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
      console.log(`Generated capacity plan with ${result.actionPlan?.length || 0} actions`);
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        plannedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");

  } catch (error) {
    console.error("Capacity planning error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تخطيط السعة" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

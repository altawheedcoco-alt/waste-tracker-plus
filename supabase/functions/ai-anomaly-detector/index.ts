import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ShipmentData {
  id: string;
  weight: number;
  expectedWeight?: number;
  origin: string;
  destination: string;
  driverId?: string;
  timestamp: string;
  price?: number;
  distance?: number;
}

interface AnomalyResult {
  shipmentId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  recommendation: string;
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

    const { shipments, organizationId, analysisType = 'comprehensive' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing ${shipments?.length || 0} shipments for anomalies...`);

    const systemPrompt = `أنت خبير متخصص في كشف الشذوذ والاحتيال في أنظمة النقل والخدمات اللوجستية.

مهمتك تحليل بيانات الشحنات لكشف:
1. **شذوذ الوزن**: فروقات غير طبيعية بين الوزن المتوقع والفعلي (أكثر من 15%)
2. **شذوذ المسار**: مسارات غير منطقية أو طويلة جداً
3. **شذوذ التسعير**: أسعار لا تتناسب مع المسافة أو الوزن
4. **أنماط مشبوهة**: تكرار غير طبيعي من نفس السائق أو العميل
5. **تلاعب بالبيانات**: تغييرات متكررة في البيانات

قم بتحليل البيانات وتصنيف كل شذوذ حسب الخطورة:
- critical: يتطلب إجراء فوري
- high: يحتاج مراجعة عاجلة
- medium: يحتاج متابعة
- low: للمراقبة فقط`;

    const userPrompt = `قم بتحليل الشحنات التالية للكشف عن أي شذوذ أو نشاط مشبوه:

بيانات الشحنات:
${JSON.stringify(shipments, null, 2)}

نوع التحليل المطلوب: ${analysisType}

قدم تحليلاً شاملاً يتضمن:
1. قائمة بكل الشذوذات المكتشفة
2. تصنيف خطورة كل شذوذ
3. توصيات للتعامل مع كل حالة
4. ملخص عام لحالة النظام`;

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
            name: "report_anomalies",
            description: "تقرير بالشذوذات المكتشفة في بيانات الشحنات",
            parameters: {
              type: "object",
              properties: {
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      shipmentId: { type: "string", description: "معرف الشحنة" },
                      anomalyType: { 
                        type: "string", 
                        enum: ["weight_discrepancy", "route_anomaly", "price_anomaly", "suspicious_pattern", "data_tampering"],
                        description: "نوع الشذوذ"
                      },
                      severity: { 
                        type: "string", 
                        enum: ["low", "medium", "high", "critical"],
                        description: "مستوى الخطورة"
                      },
                      description: { type: "string", description: "وصف الشذوذ" },
                      confidence: { type: "number", description: "نسبة الثقة في الاكتشاف (0-100)" },
                      recommendation: { type: "string", description: "التوصية للتعامل مع الشذوذ" }
                    },
                    required: ["shipmentId", "anomalyType", "severity", "description", "confidence", "recommendation"]
                  }
                },
                summary: {
                  type: "object",
                  properties: {
                    totalAnalyzed: { type: "number", description: "إجمالي الشحنات المحللة" },
                    totalAnomalies: { type: "number", description: "إجمالي الشذوذات المكتشفة" },
                    criticalCount: { type: "number", description: "عدد الشذوذات الحرجة" },
                    highCount: { type: "number", description: "عدد الشذوذات العالية الخطورة" },
                    mediumCount: { type: "number", description: "عدد الشذوذات المتوسطة" },
                    lowCount: { type: "number", description: "عدد الشذوذات المنخفضة" },
                    riskScore: { type: "number", description: "درجة المخاطر الإجمالية (0-100)" },
                    overallAssessment: { type: "string", description: "تقييم عام للوضع" }
                  },
                  required: ["totalAnalyzed", "totalAnomalies", "riskScore", "overallAssessment"]
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  description: "قائمة التوصيات العامة لتحسين الأمان"
                }
              },
              required: ["anomalies", "summary", "recommendations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "report_anomalies" } }
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
      console.log(`Found ${result.anomalies?.length || 0} anomalies`);
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        analyzedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid response from AI");

  } catch (error) {
    console.error("Anomaly detection error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تحليل الشذوذ" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

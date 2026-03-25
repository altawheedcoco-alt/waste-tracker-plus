import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VehicleData {
  id: string;
  plate: string;
  type: string;
  lastMaintenanceDate?: string;
  mileage?: number;
  age?: number;
  shipmentsCount: number;
  avgDailyDistance?: number;
  fuelConsumption?: number;
  issuesHistory?: string[];
}

interface MaintenancePrediction {
  vehicleId: string;
  vehiclePlate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedIssues: Array<{
    component: string;
    probability: number;
    estimatedDaysUntilFailure: number;
    recommendedAction: string;
  }>;
  nextMaintenanceDate: string;
  estimatedCost: number;
  recommendations: string[];
}

interface PredictionRequest {
  organizationId: string;
  vehicleIds?: string[];
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: PredictionRequest = await req.json();
    const { organizationId, vehicleIds } = body;

    console.log('Maintenance prediction request:', { organizationId, vehicleIds });

    // Fetch drivers/vehicles
    let query = supabase
      .from('drivers')
      .select(`
        id,
        vehicle_plate,
        vehicle_type,
        vehicle_capacity,
        status,
        created_at,
        profile:profiles(full_name)
      `)
      .eq('organization_id', organizationId);

    if (vehicleIds && vehicleIds.length > 0) {
      query = query.in('id', vehicleIds);
    }

    const { data: driversData, error: driversError } = await query;
    if (driversError) throw driversError;

    // Fetch shipment history for each driver
    const driverIds = (driversData || []).map((d: any) => d.id);
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select('driver_id, status, created_at, delivered_at')
      .in('driver_id', driverIds)
      .eq('status', 'delivered');

    // Build vehicle data
    const vehicles: VehicleData[] = (driversData || []).map((d: any) => {
      const driverShipments = (shipmentsData || []).filter((s: any) => s.driver_id === d.id);
      const createdDate = new Date(d.created_at);
      const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: d.id,
        plate: d.vehicle_plate,
        type: d.vehicle_type || 'شاحنة',
        shipmentsCount: driverShipments.length,
        age: Math.floor(ageInDays / 365),
        avgDailyDistance: driverShipments.length > 0 ? Math.round(driverShipments.length * 50 / Math.max(ageInDays, 1) * 30) : 100,
      };
    });

    if (vehicles.length === 0) {
      return new Response(JSON.stringify({ predictions: [], message: "لا توجد مركبات للتحليل" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI for predictions
    const prompt = buildPredictionPrompt(vehicles);

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        {
          role: "system",
          content: `أنت نظام ذكاء اصطناعي للتنبؤ بصيانة المركبات. حلل بيانات المركبات وتنبأ بالأعطال المحتملة.

معايير التحليل:
1. عمر المركبة
2. عدد الشحنات المنجزة
3. المسافة المقطوعة
4. نوع المركبة

أنواع الأعطال الشائعة:
- الإطارات (كل 40,000 كم)
- الفرامل (كل 60,000 كم)
- الزيت والفلاتر (كل 10,000 كم)
- البطارية (كل 3 سنوات)
- نظام التبريد (كل 100,000 كم)

أرجع تنبؤات واقعية بناءً على البيانات.`
        },
        { role: "user", content: prompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "predict_maintenance",
            description: "التنبؤ بصيانة المركبات",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      vehicleId: { type: "string" },
                      riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      predictedIssues: {
                        type: "array",
                        items: { type: "object", properties: { component: { type: "string" }, probability: { type: "number" }, daysUntilFailure: { type: "number" }, action: { type: "string" } } }
                      },
                      nextMaintenanceDays: { type: "number" },
                      estimatedCostEGP: { type: "number" },
                      recommendations: { type: "array", items: { type: "string" } }
                    },
                    required: ["vehicleId", "riskLevel", "predictedIssues"]
                  }
                }
              },
              required: ["predictions"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "predict_maintenance" } }
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "الرصيد غير كافٍ" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Fallback to rule-based predictions
      const predictions = generateRuleBasedPredictions(vehicles);
      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      const predictions = generateRuleBasedPredictions(vehicles);
      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = JSON.parse(toolCall.function.arguments);
    
    // Format predictions
    const predictions: MaintenancePrediction[] = (aiResult.predictions || []).map((p: any) => {
      const vehicle = vehicles.find(v => v.id === p.vehicleId);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (p.nextMaintenanceDays || 30));

      return {
        vehicleId: p.vehicleId,
        vehiclePlate: vehicle?.plate || 'غير معروف',
        riskLevel: p.riskLevel || 'low',
        predictedIssues: (p.predictedIssues || []).map((issue: any) => ({
          component: issue.component,
          probability: issue.probability || 50,
          estimatedDaysUntilFailure: issue.daysUntilFailure || 30,
          recommendedAction: issue.action || 'فحص دوري'
        })),
        nextMaintenanceDate: nextDate.toISOString().split('T')[0],
        estimatedCost: p.estimatedCostEGP || 2000,
        recommendations: p.recommendations || ["إجراء فحص دوري شامل"]
      };
    });

    console.log('Maintenance predictions generated:', {
      vehiclesAnalyzed: vehicles.length,
      predictionsCount: predictions.length,
      criticalCount: predictions.filter(p => p.riskLevel === 'critical').length
    });

    return new Response(JSON.stringify({ 
      predictions,
      summary: {
        totalVehicles: vehicles.length,
        criticalRisk: predictions.filter(p => p.riskLevel === 'critical').length,
        highRisk: predictions.filter(p => p.riskLevel === 'high').length,
        mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
        lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Maintenance prediction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'خطأ في التنبؤ بالصيانة' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPredictionPrompt(vehicles: VehicleData[]): string {
  const vehiclesList = vehicles.map(v =>
    `- ${v.id}: ${v.plate} (${v.type}) - عمر: ${v.age || 0} سنة، شحنات: ${v.shipmentsCount}، مسافة يومية: ${v.avgDailyDistance || 0} كم`
  ).join('\n');

  return `حلل المركبات التالية وتنبأ بالصيانة المطلوبة:

${vehiclesList}

لكل مركبة، حدد:
1. مستوى الخطر
2. القطع المتوقع تلفها
3. الأيام المتبقية قبل الصيانة
4. التكلفة التقديرية بالجنيه`;
}

function generateRuleBasedPredictions(vehicles: VehicleData[]): MaintenancePrediction[] {
  return vehicles.map(v => {
    const issues: MaintenancePrediction['predictedIssues'] = [];
    let riskLevel: MaintenancePrediction['riskLevel'] = 'low';
    
    // Age-based predictions
    if ((v.age || 0) >= 5) {
      issues.push({
        component: 'البطارية',
        probability: 80,
        estimatedDaysUntilFailure: 60,
        recommendedAction: 'فحص واستبدال البطارية'
      });
      riskLevel = 'high';
    }

    // Mileage-based predictions
    const estimatedMileage = (v.shipmentsCount || 0) * 100;
    if (estimatedMileage > 50000) {
      issues.push({
        component: 'الإطارات',
        probability: 70,
        estimatedDaysUntilFailure: 45,
        recommendedAction: 'فحص عمق المداس واستبدال إذا لزم'
      });
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (estimatedMileage > 10000) {
      issues.push({
        component: 'زيت المحرك والفلاتر',
        probability: 90,
        estimatedDaysUntilFailure: 14,
        recommendedAction: 'تغيير الزيت والفلاتر'
      });
    }

    if (estimatedMileage > 60000) {
      issues.push({
        component: 'الفرامل',
        probability: 60,
        estimatedDaysUntilFailure: 90,
        recommendedAction: 'فحص تيل الفرامل والأقراص'
      });
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (issues[0]?.estimatedDaysUntilFailure || 30));

    return {
      vehicleId: v.id,
      vehiclePlate: v.plate,
      riskLevel,
      predictedIssues: issues.length > 0 ? issues : [{
        component: 'فحص عام',
        probability: 30,
        estimatedDaysUntilFailure: 90,
        recommendedAction: 'فحص دوري وقائي'
      }],
      nextMaintenanceDate: nextDate.toISOString().split('T')[0],
      estimatedCost: issues.length * 500 + 1000,
      recommendations: [
        "إجراء فحص دوري شامل",
        issues.length > 0 ? `الاهتمام بـ ${issues.map(i => i.component).join('، ')}` : "المركبة في حالة جيدة"
      ]
    };
  });
}

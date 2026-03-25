import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Driver {
  id: string;
  name: string;
  currentLocation?: { lat: number; lng: number };
  status: string;
  vehicleCapacity: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  currentLoad: number;
  completedToday: number;
}

interface Shipment {
  id: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  wasteType: string;
  quantity: number;
  priority: number;
  expectedDeliveryDate?: string;
  status: string;
}

interface SchedulingRequest {
  organizationId: string;
  date?: string;
  maxShipmentsPerDriver?: number;
  prioritizeUrgent?: boolean;
}

interface ScheduleAssignment {
  driverId: string;
  driverName: string;
  shipments: Shipment[];
  estimatedDuration: number;
  estimatedDistance: number;
  loadUtilization: number;
  route: Array<{ lat: number; lng: number; name: string; type: string }>;
}

interface SchedulingResult {
  assignments: ScheduleAssignment[];
  unassignedShipments: Shipment[];
  totalShipments: number;
  assignedCount: number;
  efficiency: number;
  recommendations: string[];
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
    const body: SchedulingRequest = await req.json();
    const { organizationId, date, maxShipmentsPerDriver = 10, prioritizeUrgent = true } = body;

    console.log('Smart scheduling request:', { organizationId, date, maxShipmentsPerDriver });

    // Fetch available drivers
    const { data: driversData, error: driversError } = await supabase
      .from('drivers')
      .select(`
        id,
        vehicle_plate,
        vehicle_type,
        vehicle_capacity,
        status,
        profile:profiles(full_name)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['available', 'on_duty']);

    if (driversError) throw driversError;

    // Fetch pending shipments
    const { data: shipmentsData, error: shipmentsError } = await supabase
      .from('shipments')
      .select('*')
      .eq('transporter_id', organizationId)
      .in('status', ['approved', 'new'])
      .order('created_at', { ascending: true });

    if (shipmentsError) throw shipmentsError;

    const drivers: Driver[] = (driversData || []).map((d: any) => ({
      id: d.id,
      name: d.profile?.full_name || d.vehicle_plate,
      status: d.status,
      vehicleCapacity: d.vehicle_capacity || 20,
      currentLoad: 0,
      completedToday: 0,
    }));

    const shipments: Shipment[] = (shipmentsData || []).map((s: any) => ({
      id: s.id,
      pickupLocation: {
        lat: s.pickup_lat || 30.0444,
        lng: s.pickup_lng || 31.2357,
        address: s.pickup_address || ''
      },
      deliveryLocation: {
        lat: s.delivery_lat || 30.0,
        lng: s.delivery_lng || 31.2,
        address: s.delivery_address || ''
      },
      wasteType: s.waste_type,
      quantity: s.quantity || 1,
      priority: s.is_hazardous ? 3 : 1,
      expectedDeliveryDate: s.expected_delivery_date,
      status: s.status,
    }));

    if (drivers.length === 0) {
      return new Response(JSON.stringify({
        assignments: [],
        unassignedShipments: shipments,
        totalShipments: shipments.length,
        assignedCount: 0,
        efficiency: 0,
        recommendations: ["لا يوجد سائقون متاحون حالياً"]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (shipments.length === 0) {
      return new Response(JSON.stringify({
        assignments: [],
        unassignedShipments: [],
        totalShipments: 0,
        assignedCount: 0,
        efficiency: 100,
        recommendations: ["لا توجد شحنات معلقة للجدولة"]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI for intelligent scheduling
    const prompt = buildSchedulingPrompt(drivers, shipments, { maxShipmentsPerDriver, prioritizeUrgent });

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        {
          role: "system",
          content: `أنت نظام جدولة ذكي للشحنات. مهمتك توزيع الشحنات على السائقين بأفضل طريقة ممكنة.

معايير التوزيع:
1. وازن الحمل بين السائقين
2. راعِ سعة المركبة
3. أعطِ أولوية للشحنات العاجلة
4. قلل المسافات المقطوعة
5. جمّع الشحنات المتقاربة جغرافياً

أرجع النتيجة بصيغة JSON.`
        },
        { role: "user", content: prompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "schedule_shipments",
            description: "توزيع الشحنات على السائقين",
            parameters: {
              type: "object",
              properties: {
                assignments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      driverId: { type: "string" },
                      shipmentIds: { type: "array", items: { type: "string" } },
                      estimatedDurationMinutes: { type: "number" },
                      estimatedDistanceKm: { type: "number" }
                    },
                    required: ["driverId", "shipmentIds"]
                  }
                },
                unassignedShipmentIds: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["assignments", "recommendations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "schedule_shipments" } }
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
      // Fallback to simple scheduling
      const result = simpleScheduling(drivers, shipments, maxShipmentsPerDriver);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      const result = simpleScheduling(drivers, shipments, maxShipmentsPerDriver);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = JSON.parse(toolCall.function.arguments);
    
    // Build response
    const assignments: ScheduleAssignment[] = (aiResult.assignments || []).map((a: any) => {
      const driver = drivers.find(d => d.id === a.driverId);
      const assignedShipments = shipments.filter(s => a.shipmentIds?.includes(s.id));
      
      return {
        driverId: a.driverId,
        driverName: driver?.name || 'سائق',
        shipments: assignedShipments,
        estimatedDuration: a.estimatedDurationMinutes || assignedShipments.length * 30,
        estimatedDistance: a.estimatedDistanceKm || assignedShipments.length * 15,
        loadUtilization: Math.min(100, (assignedShipments.reduce((sum, s) => sum + s.quantity, 0) / (driver?.vehicleCapacity || 20)) * 100),
        route: buildRoute(assignedShipments),
      };
    });

    const assignedIds = assignments.flatMap(a => a.shipments.map(s => s.id));
    const unassignedShipments = shipments.filter(s => !assignedIds.includes(s.id));

    const result: SchedulingResult = {
      assignments,
      unassignedShipments,
      totalShipments: shipments.length,
      assignedCount: assignedIds.length,
      efficiency: shipments.length > 0 ? Math.round((assignedIds.length / shipments.length) * 100) : 100,
      recommendations: aiResult.recommendations || ["تم توزيع الشحنات بنجاح"]
    };

    console.log('Scheduling completed:', {
      totalDrivers: drivers.length,
      totalShipments: shipments.length,
      assignedCount: result.assignedCount,
      efficiency: result.efficiency
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart scheduling error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'خطأ في الجدولة الذكية' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSchedulingPrompt(
  drivers: Driver[],
  shipments: Shipment[],
  options: { maxShipmentsPerDriver: number; prioritizeUrgent: boolean }
): string {
  const driversList = drivers.map(d => 
    `- ${d.id}: ${d.name} (سعة: ${d.vehicleCapacity} طن، الحالة: ${d.status})`
  ).join('\n');

  const shipmentsList = shipments.map(s =>
    `- ${s.id}: ${s.wasteType} (${s.quantity} طن، أولوية: ${s.priority})`
  ).join('\n');

  return `السائقون المتاحون:
${driversList}

الشحنات المعلقة:
${shipmentsList}

القيود:
- أقصى شحنات لكل سائق: ${options.maxShipmentsPerDriver}
${options.prioritizeUrgent ? '- أعطِ أولوية للشحنات العاجلة (أولوية 3)' : ''}

وزّع الشحنات على السائقين بأفضل طريقة.`;
}

function simpleScheduling(
  drivers: Driver[],
  shipments: Shipment[],
  maxPerDriver: number
): SchedulingResult {
  const assignments: ScheduleAssignment[] = [];
  const remaining = [...shipments].sort((a, b) => b.priority - a.priority);
  
  for (const driver of drivers) {
    const driverShipments: Shipment[] = [];
    let currentLoad = 0;
    
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (driverShipments.length >= maxPerDriver) break;
      if (currentLoad + remaining[i].quantity <= driver.vehicleCapacity) {
        driverShipments.push(remaining.splice(i, 1)[0]);
        currentLoad += driverShipments[driverShipments.length - 1].quantity;
      }
    }
    
    if (driverShipments.length > 0) {
      assignments.push({
        driverId: driver.id,
        driverName: driver.name,
        shipments: driverShipments,
        estimatedDuration: driverShipments.length * 25,
        estimatedDistance: driverShipments.length * 12,
        loadUtilization: Math.round((currentLoad / driver.vehicleCapacity) * 100),
        route: buildRoute(driverShipments),
      });
    }
  }

  const assignedCount = assignments.reduce((sum, a) => sum + a.shipments.length, 0);

  return {
    assignments,
    unassignedShipments: remaining,
    totalShipments: shipments.length,
    assignedCount,
    efficiency: shipments.length > 0 ? Math.round((assignedCount / shipments.length) * 100) : 100,
    recommendations: [
      "تم التوزيع باستخدام خوارزمية الأولوية",
      `${assignedCount} شحنة تم تعيينها من ${shipments.length}`,
      remaining.length > 0 ? `${remaining.length} شحنة تحتاج سائقين إضافيين` : "جميع الشحنات موزعة"
    ]
  };
}

function buildRoute(shipments: Shipment[]): Array<{ lat: number; lng: number; name: string; type: string }> {
  const route: Array<{ lat: number; lng: number; name: string; type: string }> = [];
  
  for (const s of shipments) {
    route.push({
      lat: s.pickupLocation.lat,
      lng: s.pickupLocation.lng,
      name: s.pickupLocation.address || 'نقطة استلام',
      type: 'pickup'
    });
    route.push({
      lat: s.deliveryLocation.lat,
      lng: s.deliveryLocation.lng,
      name: s.deliveryLocation.address || 'نقطة تسليم',
      type: 'delivery'
    });
  }
  
  return route;
}

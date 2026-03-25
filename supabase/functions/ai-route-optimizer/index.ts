import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Location {
  lat: number;
  lng: number;
  name: string;
  type: 'pickup' | 'delivery';
  shipmentId?: string;
  priority?: number;
}

interface RouteOptimizationRequest {
  driverId: string;
  currentLocation: { lat: number; lng: number };
  destinations: Location[];
  vehicleCapacity?: number;
  maxStops?: number;
  preferredStartTime?: string;
  avoidTolls?: boolean;
}

interface OptimizedRoute {
  orderedStops: Location[];
  totalDistance: number;
  totalDuration: number;
  fuelEstimate: number;
  co2Savings: number;
  alternativeRoutes?: Array<{
    orderedStops: Location[];
    totalDistance: number;
    totalDuration: number;
  }>;
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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: RouteOptimizationRequest = await req.json();
    const { currentLocation, destinations, vehicleCapacity, maxStops, avoidTolls } = body;

    console.log('Route optimization request:', {
      currentLocation,
      destinationsCount: destinations.length,
      vehicleCapacity,
      maxStops
    });

    // If few destinations, use heuristic optimization
    if (destinations.length <= 2) {
      const optimized = simpleOptimization(currentLocation, destinations);
      return new Response(JSON.stringify(optimized), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI for complex route optimization
    const prompt = buildOptimizationPrompt(currentLocation, destinations, {
      vehicleCapacity,
      maxStops,
      avoidTolls
    });

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        {
          role: "system",
          content: `أنت خبير في تحسين المسارات اللوجستية. مهمتك تحليل نقاط التوصيل وإنتاج أفضل ترتيب للمسار.
            
قواعد التحسين:
1. قلل المسافة الإجمالية
2. راعِ أولوية الشحنات العاجلة
3. جمّع النقاط القريبة جغرافياً
4. تجنب الطرق المزدحمة في أوقات الذروة
5. احسب توفير الوقود والانبعاثات الكربونية

أجب بصيغة JSON فقط.`
        },
        { role: "user", content: prompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "optimize_route",
            description: "إرجاع المسار المحسّن مع التوصيات",
            parameters: {
              type: "object",
              properties: {
                orderedStopIndices: { type: "array", items: { type: "number" }, description: "ترتيب النقاط المحسّن (أرقام الفهرس)" },
                totalDistanceKm: { type: "number", description: "المسافة الإجمالية بالكيلومترات" },
                totalDurationMinutes: { type: "number", description: "الوقت الإجمالي بالدقائق" },
                fuelSavingsPercent: { type: "number", description: "نسبة توفير الوقود" },
                co2ReductionKg: { type: "number", description: "تقليل الانبعاثات الكربونية بالكيلوجرام" },
                recommendations: { type: "array", items: { type: "string" }, description: "توصيات لتحسين الرحلة" }
              },
              required: ["orderedStopIndices", "totalDistanceKm", "totalDurationMinutes", "recommendations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "optimize_route" } }
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "الرصيد غير كافٍ، يرجى إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      // Fallback to simple optimization
      const optimized = simpleOptimization(currentLocation, destinations);
      return new Response(JSON.stringify(optimized), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Build optimized route response
    const orderedStops = result.orderedStopIndices.map((idx: number) => destinations[idx]).filter(Boolean);
    
    const optimizedRoute: OptimizedRoute = {
      orderedStops,
      totalDistance: result.totalDistanceKm || calculateTotalDistance(currentLocation, orderedStops),
      totalDuration: result.totalDurationMinutes || orderedStops.length * 15,
      fuelEstimate: result.fuelSavingsPercent || 15,
      co2Savings: result.co2ReductionKg || orderedStops.length * 0.5,
      recommendations: result.recommendations || ["تم تحسين المسار بناءً على المسافة والأولوية"],
    };

    console.log('Route optimized successfully:', {
      stopsCount: optimizedRoute.orderedStops.length,
      totalDistance: optimizedRoute.totalDistance,
      totalDuration: optimizedRoute.totalDuration
    });

    return new Response(JSON.stringify(optimizedRoute), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'خطأ في تحسين المسار' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildOptimizationPrompt(
  currentLocation: { lat: number; lng: number },
  destinations: Location[],
  options: { vehicleCapacity?: number; maxStops?: number; avoidTolls?: boolean }
): string {
  const destList = destinations.map((d, i) => 
    `${i}. ${d.name} (${d.type === 'pickup' ? 'استلام' : 'تسليم'}) - إحداثيات: ${d.lat}, ${d.lng}${d.priority ? ` - أولوية: ${d.priority}` : ''}`
  ).join('\n');

  return `الموقع الحالي للسائق: ${currentLocation.lat}, ${currentLocation.lng}

نقاط التوصيل:
${destList}

${options.vehicleCapacity ? `سعة المركبة: ${options.vehicleCapacity} طن` : ''}
${options.maxStops ? `أقصى عدد محطات: ${options.maxStops}` : ''}
${options.avoidTolls ? 'تجنب الطرق المدفوعة' : ''}

حسّن ترتيب النقاط لتقليل المسافة والوقت مع مراعاة الأولويات.`;
}

function simpleOptimization(
  currentLocation: { lat: number; lng: number },
  destinations: Location[]
): OptimizedRoute {
  // Simple nearest neighbor algorithm
  const remaining = [...destinations];
  const ordered: Location[] = [];
  let current = currentLocation;
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      // Factor in priority
      const priorityFactor = remaining[i].priority ? (1 - remaining[i].priority * 0.1) : 1;
      const adjustedDist = dist * priorityFactor;
      
      if (adjustedDist < nearestDist) {
        nearestDist = adjustedDist;
        nearestIdx = i;
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0];
    totalDistance += haversineDistance(current.lat, current.lng, nearest.lat, nearest.lng);
    ordered.push(nearest);
    current = { lat: nearest.lat, lng: nearest.lng };
  }

  return {
    orderedStops: ordered,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalDuration: Math.round(ordered.length * 12 + totalDistance * 1.5),
    fuelEstimate: Math.round(totalDistance * 0.12 * 10) / 10,
    co2Savings: Math.round(ordered.length * 0.3 * 10) / 10,
    recommendations: [
      "تم تحسين المسار باستخدام خوارزمية أقرب جار",
      "يُنصح بالبدء مبكراً لتجنب ازدحام الذروة",
      `المسافة الإجمالية المقدرة: ${Math.round(totalDistance)} كم`
    ]
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistance(start: { lat: number; lng: number }, stops: Location[]): number {
  let total = 0;
  let current = start;
  for (const stop of stops) {
    total += haversineDistance(current.lat, current.lng, stop.lat, stop.lng);
    current = { lat: stop.lat, lng: stop.lng };
  }
  return Math.round(total * 10) / 10;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { waste_category } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Aggregate shipment data into waste flow analytics
    let shipmentQuery = supabase
      .from('shipments')
      .select(`
        id, waste_type, quantity, pickup_lat, pickup_lng, delivery_lat, delivery_lng,
        pickup_address, delivery_address, status, created_at,
        organization_id, destination_type
      `)
      .in('status', ['delivered', 'completed', 'in_transit', 'picked_up'])
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: shipments, error: shipError } = await shipmentQuery;
    if (shipError) {
      console.error('Shipment query error:', shipError);
    }

    // Aggregate into flow data
    const flowMap = new Map<string, any>();
    const regionStats = { totalTons: 0, activeShipments: 0, activeRegions: new Set<string>(), recycled: 0, landfilled: 0 };

    (shipments || []).forEach((s: any) => {
      const sourceRegion = s.pickup_address?.split(',').pop()?.trim() || 'غير محدد';
      const destRegion = s.delivery_address?.split(',').pop()?.trim() || 'غير محدد';
      const category = s.destination_type === 'recycling' ? 'commodity' : 
                       s.destination_type === 'disposal' ? 'hazardous' : 'commodity';
      
      if (waste_category && category !== waste_category) return;

      const key = `${sourceRegion}_${destRegion}_${category}`;
      if (!flowMap.has(key)) {
        flowMap.set(key, {
          id: key,
          source_region: sourceRegion,
          source_lat: s.pickup_lat || 30.0444,
          source_lng: s.pickup_lng || 31.2357,
          destination_region: destRegion,
          destination_lat: s.delivery_lat || 30.1,
          destination_lng: s.delivery_lng || 31.3,
          waste_type: s.waste_type || 'mixed',
          waste_category: category,
          quantity_tons: 0,
          flow_date: new Date().toISOString().split('T')[0],
          shipment_count: 0,
        });
      }

      const flow = flowMap.get(key);
      flow.quantity_tons += Number(s.quantity) || 0;
      flow.shipment_count += 1;

      regionStats.totalTons += Number(s.quantity) || 0;
      regionStats.activeShipments += 1;
      regionStats.activeRegions.add(sourceRegion);
      regionStats.activeRegions.add(destRegion);

      if (category === 'commodity') regionStats.recycled += Number(s.quantity) || 0;
      else regionStats.landfilled += Number(s.quantity) || 0;
    });

    const flows = Array.from(flowMap.values()).sort((a, b) => b.quantity_tons - a.quantity_tons);

    // Fetch active geo alerts
    const { data: alerts } = await supabase
      .from('geo_concentration_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    // Generate concentration alerts if high activity in region
    const regionTotals = new Map<string, number>();
    flows.forEach(f => {
      regionTotals.set(f.destination_region, (regionTotals.get(f.destination_region) || 0) + f.quantity_tons);
    });

    // Egyptian governorate approximate centers for deterministic geo placement
    const govCoords: Record<string, [number, number]> = {
      'القاهرة': [30.0444, 31.2357], 'الجيزة': [30.0131, 31.2089], 'الإسكندرية': [31.2001, 29.9187],
      'الشرقية': [30.5833, 31.5], 'الدقهلية': [31.0409, 31.3785], 'الغربية': [30.8754, 31.0297],
      'المنوفية': [30.5972, 30.9876], 'القليوبية': [30.3292, 31.2422], 'البحيرة': [31.0340, 30.4686],
      'الفيوم': [29.3084, 30.8428], 'بني سويف': [29.0661, 31.0994], 'المنيا': [28.1099, 30.7503],
    };
    const defaultCoord: [number, number] = [30.0444, 31.2357];

    const generatedAlerts: any[] = [];
    regionTotals.forEach((tons, region) => {
      if (tons > 100) {
        const [lat, lng] = govCoords[region] || defaultCoord;
        generatedAlerts.push({
          id: `gen_${region}`,
          region_name: region,
          region_lat: lat,
          region_lng: lng,
          alert_type: 'accumulation',
          waste_type: null,
          severity: tons > 500 ? 'critical' : tons > 200 ? 'high' : 'medium',
          message: `High waste accumulation in ${region}: ${tons.toFixed(0)} tons`,
          message_ar: `تراكم مخلفات عالي في ${region}: ${tons.toFixed(0)} طن`,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    });

    const totalTons = regionStats.totalTons;
    const recyclingRate = totalTons > 0 ? Math.round((regionStats.recycled / totalTons) * 100) : 0;

    return new Response(JSON.stringify({
      flows,
      alerts: [...(alerts || []), ...generatedAlerts],
      stats: {
        totalTons: Math.round(totalTons),
        activeShipments: regionStats.activeShipments,
        activeRegions: regionStats.activeRegions.size,
        recyclingRate,
        recycledTons: Math.round(regionStats.recycled),
        landfilledTons: Math.round(regionStats.landfilled),
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("waste-flow-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

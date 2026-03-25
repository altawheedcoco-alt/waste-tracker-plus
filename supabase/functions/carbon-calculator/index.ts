import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Allow ping without auth
    const rawBody = await req.text()
    let data: any
    try { data = JSON.parse(rawBody) } catch { data = {} }
    
    if (data.action === 'ping') {
      return new Response(JSON.stringify({ success: true, message: 'Carbon Calculator service is running', timestamp: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action } = data

    // Load emission factors
    const { data: factors } = await supabase
      .from('carbon_emission_factors')
      .select('*')
      .eq('is_active', true)

    const factorMap: Record<string, Record<string, any>> = {}
    for (const f of factors || []) {
      if (!factorMap[f.category]) factorMap[f.category] = {}
      factorMap[f.category][f.sub_category] = f
    }

    switch (action) {
      case 'calculate-shipment': {
        const { shipment_id, organization_id } = data
        if (!shipment_id || !organization_id) {
          return new Response(JSON.stringify({ error: 'shipment_id and organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { data: shipment } = await supabase
          .from('shipments')
          .select('*, generator:organizations!shipments_generator_id_fkey(name, organization_type), transporter:organizations!shipments_transporter_id_fkey(name), recycler:organizations!shipments_recycler_id_fkey(name, organization_type)')
          .eq('id', shipment_id)
          .single()

        if (!shipment) {
          return new Response(JSON.stringify({ error: 'Shipment not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const weightTons = (shipment.weight_at_destination || shipment.weight_at_source || shipment.quantity || 0)

        // 1. Transport emissions
        let transportEmissions = 0
        let distanceKm = shipment.actual_distance_km || shipment.estimated_distance_km || 0
        
        // Estimate distance from coordinates if not available
        if (!distanceKm && shipment.pickup_lat && shipment.delivery_lat) {
          const R = 6371
          const dLat = (shipment.delivery_lat - shipment.pickup_lat) * Math.PI / 180
          const dLon = (shipment.delivery_lng - shipment.pickup_lng) * Math.PI / 180
          const a = Math.sin(dLat/2)**2 + Math.cos(shipment.pickup_lat*Math.PI/180) * Math.cos(shipment.delivery_lat*Math.PI/180) * Math.sin(dLon/2)**2
          distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.3 // 1.3 road factor
        }

        // Fuel consumption estimate: ~0.3 L/km for heavy trucks
        const fuelType = 'diesel'
        const fuelConsumption = distanceKm * 0.3
        const dieselFactor = factorMap['transport_fuel']?.['diesel']?.emission_factor || 2.68
        transportEmissions = fuelConsumption * dieselFactor

        // 2. Determine waste destination & emissions
        let recyclingEmissions = 0
        let recyclingSavings = 0
        let disposalEmissions = 0
        let disposalMethod = ''

        const recyclerType = shipment.recycler?.organization_type
        const wasteType = (shipment.waste_type || '').toLowerCase()

        // Map waste type to emission factor sub_category
        const wasteToFactor: Record<string, string> = {
          'plastic': 'plastic_recycling',
          'بلاستيك': 'plastic_recycling',
          'paper': 'paper_recycling',
          'ورق': 'paper_recycling',
          'كرتون': 'paper_recycling',
          'metal': 'metal_recycling',
          'معادن': 'metal_recycling',
          'حديد': 'metal_recycling',
          'aluminum': 'aluminum_recycling',
          'ألومنيوم': 'aluminum_recycling',
          'glass': 'glass_recycling',
          'زجاج': 'glass_recycling',
          'organic': 'organic_composting',
          'عضوي': 'organic_composting',
          'e-waste': 'e_waste_recycling',
          'إلكتروني': 'e_waste_recycling',
          'textile': 'textile_recycling',
          'نسيج': 'textile_recycling',
          'ملابس': 'textile_recycling',
        }

        if (recyclerType === 'recycler' || recyclerType === 'مدور') {
          // Recycling path - calculate savings
          const matchedKey = Object.keys(wasteToFactor).find(k => wasteType.includes(k))
          const factorKey = matchedKey ? wasteToFactor[matchedKey] : 'plastic_recycling'
          const savingsFactor = factorMap['waste_recycling']?.[factorKey]?.emission_factor || 1400
          recyclingSavings = weightTons * savingsFactor

          // Small energy cost for recycling process (~5% of savings)
          recyclingEmissions = recyclingSavings * 0.05
        } else {
          // Disposal/landfill path
          disposalMethod = 'sanitary_landfill'
          const landfillKey = wasteType.includes('بلاستيك') || wasteType.includes('plastic') ? 'plastic_landfill'
            : wasteType.includes('ورق') || wasteType.includes('paper') ? 'paper_cardboard'
            : wasteType.includes('عضوي') || wasteType.includes('organic') ? 'organic_waste'
            : wasteType.includes('خطر') || wasteType.includes('hazard') ? 'hazardous_waste'
            : 'mixed_msw'
          
          disposalEmissions = weightTons * (factorMap['waste_landfill']?.[landfillKey]?.emission_factor || 450)
        }

        // 3. Generation emissions (minimal - collection energy)
        const generationEmissions = weightTons * 10 // ~10 kg CO2e/ton for collection/handling

        // Insert record
        const record = {
          shipment_id,
          organization_id,
          generation_emissions: Math.round(generationEmissions * 100) / 100,
          generation_details: { weight_tons: weightTons, waste_type: shipment.waste_type },
          transport_emissions: Math.round(transportEmissions * 100) / 100,
          transport_distance_km: Math.round(distanceKm * 10) / 10,
          fuel_consumed_liters: Math.round(fuelConsumption * 10) / 10,
          fuel_type: fuelType,
          transport_details: { diesel_factor: dieselFactor, fuel_rate_l_per_km: 0.3 },
          recycling_emissions: Math.round(recyclingEmissions * 100) / 100,
          recycling_savings: Math.round(recyclingSavings * 100) / 100,
          recycling_details: recyclerType === 'recycler' ? { method: 'mechanical_recycling', waste_type: shipment.waste_type } : null,
          disposal_emissions: Math.round(disposalEmissions * 100) / 100,
          disposal_method: disposalMethod || null,
          disposal_details: disposalMethod ? { method: disposalMethod, waste_type: shipment.waste_type } : null,
          total_savings: Math.round(recyclingSavings * 100) / 100,
        }

        // Upsert (update if exists for this shipment+org)
        const { data: existing } = await supabase
          .from('carbon_footprint_records')
          .select('id')
          .eq('shipment_id', shipment_id)
          .eq('organization_id', organization_id)
          .maybeSingle()

        let result
        if (existing) {
          result = await supabase.from('carbon_footprint_records').update(record).eq('id', existing.id).select().single()
        } else {
          result = await supabase.from('carbon_footprint_records').insert(record).select().single()
        }

        return new Response(JSON.stringify({ success: true, record: result.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'generate-summary': {
        const { organization_id, period_start, period_end } = data
        if (!organization_id || !period_start || !period_end) {
          return new Response(JSON.stringify({ error: 'organization_id, period_start, period_end required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Get all carbon records for the period
        const { data: records } = await supabase
          .from('carbon_footprint_records')
          .select('*')
          .eq('organization_id', organization_id)
          .gte('calculation_date', period_start)
          .lte('calculation_date', period_end)

        const summary = {
          organization_id,
          period_start,
          period_end,
          period_type: 'monthly',
          total_waste_tons: 0,
          total_recycled_tons: 0,
          total_landfilled_tons: 0,
          scope1_emissions: 0,
          scope2_emissions: 0,
          scope3_emissions: 0,
          total_emissions: 0,
          total_savings: 0,
          net_impact: 0,
          recycling_rate: 0,
          carbon_intensity: 0,
        }

        for (const r of records || []) {
          const weight = r.generation_details?.weight_tons || 0
          summary.total_waste_tons += weight
          if (r.recycling_savings > 0) summary.total_recycled_tons += weight
          if (r.disposal_emissions > 0) summary.total_landfilled_tons += weight

          summary.scope1_emissions += (r.transport_emissions || 0) + (r.disposal_emissions || 0)
          summary.scope3_emissions += (r.recycling_savings || 0)
          summary.total_emissions += r.total_emissions || 0
          summary.total_savings += r.recycling_savings || 0
        }

        summary.net_impact = summary.total_emissions - summary.total_savings
        summary.recycling_rate = summary.total_waste_tons > 0 
          ? Math.round(summary.total_recycled_tons / summary.total_waste_tons * 100 * 10) / 10 
          : 0
        summary.carbon_intensity = summary.total_waste_tons > 0 
          ? Math.round(summary.total_emissions / summary.total_waste_tons * 10) / 10 
          : 0

        // Upsert summary
        const { data: existing } = await supabase
          .from('carbon_summary')
          .select('id')
          .eq('organization_id', organization_id)
          .eq('period_start', period_start)
          .eq('period_end', period_end)
          .maybeSingle()

        if (existing) {
          await supabase.from('carbon_summary').update(summary).eq('id', existing.id)
        } else {
          await supabase.from('carbon_summary').insert(summary)
        }

        return new Response(JSON.stringify({ success: true, summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      case 'get-factors': {
        return new Response(JSON.stringify({ success: true, factors: factors || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action. Use: calculate-shipment, generate-summary, get-factors' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (error) {
    console.error('[Carbon Calculator] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

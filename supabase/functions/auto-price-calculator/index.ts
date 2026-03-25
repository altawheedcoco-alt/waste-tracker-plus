import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isPeakHour(): boolean {
  const hour = new Date().getUTCHours() + 3; // Saudi Arabia UTC+3
  return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 5 || day === 6; // Friday/Saturday
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { shipmentId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch shipment
    const { data: shipment, error: shipErr } = await supabase
      .from('shipments')
      .select('id, waste_type, quantity, unit, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, award_letter_id, transporter_id, price_per_unit, price_source, pricing_mode, driver_fee, transporter_margin_percent, transporter_margin_fixed, disposal_cost')
      .eq('id', shipmentId)
      .single();

    if (shipErr || !shipment) throw new Error("Shipment not found");

    // Skip pricing for modes that don't need calculation
    const skipModes = ['manual', 'generator_pays', 'externally_agreed'];
    if (skipModes.includes(shipment.pricing_mode)) {
      // For externally_agreed, keep existing price_per_unit if set
      if (shipment.pricing_mode === 'generator_pays') {
        await supabase.from('shipments').update({
          price_source: 'generator_pays',
          total_value: 0,
          price_per_unit: 0,
        }).eq('id', shipmentId);
      }
      return new Response(JSON.stringify({
        success: true,
        shipmentId,
        priceSource: shipment.pricing_mode,
        message: `Pricing mode '${shipment.pricing_mode}' - skipped auto calculation`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const quantity = shipment.quantity || 1;
    const wasteType = shipment.waste_type || 'general';

    // Calculate distance
    let distanceKm = 50; // default
    if (shipment.pickup_latitude && shipment.pickup_longitude && shipment.delivery_latitude && shipment.delivery_longitude) {
      distanceKm = haversineDistance(
        shipment.pickup_latitude, shipment.pickup_longitude,
        shipment.delivery_latitude, shipment.delivery_longitude
      );
    }

    let pricePerUnit = 0;
    let totalPrice = 0;
    let priceSource = 'dynamic_rules';
    const factors: Record<string, any> = { distance_km: Math.round(distanceKm * 10) / 10, quantity, waste_type: wasteType, pricing_mode: shipment.pricing_mode };

    // Handle driver_fee_plus_margin mode
    if (shipment.pricing_mode === 'driver_fee_plus_margin') {
      const driverFee = shipment.driver_fee || 0;
      const marginPercent = shipment.transporter_margin_percent || 0;
      const marginFixed = shipment.transporter_margin_fixed || 0;
      totalPrice = Math.round((driverFee * (1 + marginPercent / 100) + marginFixed) * 100) / 100;
      pricePerUnit = Math.round((totalPrice / quantity) * 100) / 100;
      priceSource = 'driver_fee_plus_margin';
      factors.driver_fee = driverFee;
      factors.margin_percent = marginPercent;
      factors.margin_fixed = marginFixed;

      const { error: updateErr } = await supabase.from('shipments').update({
        price_per_unit: pricePerUnit,
        total_value: totalPrice,
        client_total: totalPrice,
        price_source: priceSource,
      }).eq('id', shipmentId);
      if (updateErr) console.error("Update error:", updateErr);

      await supabase.from('pricing_calculations').insert({
        organization_id: shipment.transporter_id,
        shipment_id: shipmentId,
        waste_type: wasteType,
        base_price: driverFee,
        final_price: totalPrice,
        factors,
      });

      return new Response(JSON.stringify({ success: true, shipmentId, pricePerUnit, totalPrice, priceSource, factors }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Handle transport_and_disposal mode
    if (shipment.pricing_mode === 'transport_and_disposal') {
      const transportCost = shipment.driver_fee || 0;
      const disposalCost = shipment.disposal_cost || 0;
      totalPrice = Math.round((transportCost + disposalCost) * 100) / 100;
      pricePerUnit = Math.round((totalPrice / quantity) * 100) / 100;
      priceSource = 'transport_and_disposal';
      factors.transport_cost = transportCost;
      factors.disposal_cost = disposalCost;

      const { error: updateErr } = await supabase.from('shipments').update({
        price_per_unit: pricePerUnit,
        total_value: totalPrice,
        client_total: totalPrice,
        price_source: priceSource,
      }).eq('id', shipmentId);
      if (updateErr) console.error("Update error:", updateErr);

      await supabase.from('pricing_calculations').insert({
        organization_id: shipment.transporter_id,
        shipment_id: shipmentId,
        waste_type: wasteType,
        base_price: transportCost,
        final_price: totalPrice,
        factors,
      });

      return new Response(JSON.stringify({ success: true, shipmentId, pricePerUnit, totalPrice, priceSource, factors }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Handle transport_only mode
    if (shipment.pricing_mode === 'transport_only') {
      totalPrice = shipment.price_per_unit ? shipment.price_per_unit * quantity : 0;
      pricePerUnit = shipment.price_per_unit || 0;
      priceSource = 'transport_only';

      const { error: updateErr } = await supabase.from('shipments').update({
        total_value: totalPrice,
        client_total: totalPrice,
        price_source: priceSource,
      }).eq('id', shipmentId);
      if (updateErr) console.error("Update error:", updateErr);

      return new Response(JSON.stringify({ success: true, shipmentId, pricePerUnit, totalPrice, priceSource, factors }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Try Award Letter pricing first (highest priority)
    if (shipment.award_letter_id) {
      const { data: awardItems } = await supabase
        .from('award_letter_items')
        .select('unit_price, waste_type')
        .eq('award_letter_id', shipment.award_letter_id);

      if (awardItems && awardItems.length > 0) {
        // Match by waste_type or use first item
        const matched = awardItems.find(a => a.waste_type === wasteType) || awardItems[0];
        pricePerUnit = matched.unit_price;
        totalPrice = pricePerUnit * quantity;
        priceSource = 'award_letter';
        factors.source = 'award_letter';
        factors.award_letter_id = shipment.award_letter_id;
      }
    }

    // 3. If no award letter price, use dynamic pricing rules
    if (priceSource !== 'award_letter') {
      const { data: rules } = await supabase
        .from('dynamic_pricing_rules')
        .select('*')
        .eq('organization_id', shipment.transporter_id)
        .eq('is_active', true);

      if (rules && rules.length > 0) {
        // Find matching rule by waste_type or use first active rule
        const matchedRule = rules.find(r => r.waste_type === wasteType) || rules[0];

        let price = matchedRule.base_price;
        factors.base_price = price;

        // Distance factor
        const distFactor = 1 + (distanceKm / 100) * (matchedRule.distance_multiplier - 1);
        price *= distFactor;
        factors.distance_factor = Math.round(distFactor * 100) / 100;

        // Weight factor
        const weightFactor = 1 + (quantity / 10) * (matchedRule.weight_multiplier - 1);
        price *= weightFactor;
        factors.weight_factor = Math.round(weightFactor * 100) / 100;

        // Peak hour surcharge
        if (isPeakHour()) {
          price += matchedRule.peak_hour_surcharge;
          factors.peak_surcharge = matchedRule.peak_hour_surcharge;
        }

        // Weekend surcharge
        if (isWeekend()) {
          price += matchedRule.weekend_surcharge;
          factors.weekend_surcharge = matchedRule.weekend_surcharge;
        }

        // Apply min/max bounds
        price = Math.max(price, matchedRule.min_price);
        if (matchedRule.max_price) price = Math.min(price, matchedRule.max_price);

        pricePerUnit = Math.round(price * 100) / 100;
        totalPrice = Math.round(pricePerUnit * quantity * 100) / 100;
        priceSource = 'dynamic_rules';
        factors.rule_id = matchedRule.id;
      } else {
        // 4. Fallback: basic distance-based pricing
        const baseRate = 5; // SAR per km per ton
        pricePerUnit = Math.round(baseRate * distanceKm * 100) / 100;
        totalPrice = Math.round(pricePerUnit * quantity * 100) / 100;
        priceSource = 'fallback_distance';
        factors.base_rate_per_km = baseRate;
      }
    }

    // 5. Update shipment with calculated price
    const { error: updateErr } = await supabase
      .from('shipments')
      .update({
        price_per_unit: pricePerUnit,
        total_value: totalPrice,
        price_source: priceSource,
      })
      .eq('id', shipmentId);

    if (updateErr) console.error("Failed to update shipment price:", updateErr);

    // 6. Log the calculation
    await supabase.from('pricing_calculations').insert({
      organization_id: shipment.transporter_id,
      shipment_id: shipmentId,
      waste_type: wasteType,
      base_price: pricePerUnit,
      final_price: totalPrice,
      factors,
    });

    return new Response(JSON.stringify({
      success: true,
      shipmentId,
      pricePerUnit,
      totalPrice,
      priceSource,
      factors,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("Auto-pricing error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

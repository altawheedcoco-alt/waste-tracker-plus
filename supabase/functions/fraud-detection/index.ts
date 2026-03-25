import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { organizationId, shipmentId } = await req.json();
    if (!organizationId) throw new Error("organizationId is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const alerts: any[] = [];

    // 1. Weight Anomaly Detection
    if (shipmentId) {
      const { data: shipment } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, generator_id, transporter_id')
        .eq('id', shipmentId)
        .single();

      if (shipment) {
        // Get historical average for same waste type and generator
        const { data: historicalData } = await supabase
          .from('shipments')
          .select('quantity')
          .eq('waste_type', shipment.waste_type)
          .eq('generator_id', shipment.generator_id)
          .neq('id', shipmentId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (historicalData && historicalData.length >= 3) {
          const quantities = historicalData.map(h => h.quantity).filter(q => q > 0);
          const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
          const stdDev = Math.sqrt(quantities.reduce((sum, q) => sum + (q - avg) ** 2, 0) / quantities.length);
          
          const deviation = Math.abs(shipment.quantity - avg);
          if (deviation > stdDev * 2.5) {
            const severity = deviation > stdDev * 4 ? 'critical' : deviation > stdDev * 3 ? 'high' : 'medium';
            alerts.push({
              organization_id: organizationId,
              shipment_id: shipmentId,
              alert_type: 'weight_anomaly',
              severity,
              description: `كمية الشحنة ${shipment.shipment_number} (${shipment.quantity} كجم) تنحرف بشكل ملحوظ عن المتوسط التاريخي (${avg.toFixed(0)} كجم) بفارق ${deviation.toFixed(0)} كجم`,
              evidence: {
                current_quantity: shipment.quantity,
                historical_avg: Math.round(avg),
                std_deviation: Math.round(stdDev),
                deviation_factor: Math.round((deviation / stdDev) * 10) / 10,
                sample_size: quantities.length,
              },
            });
          }
        }

        // Price anomaly check
        if (shipment.quantity > 0) {
          const { data: priceHistory } = await supabase
            .from('shipments')
            .select('price_per_unit')
            .eq('waste_type', shipment.waste_type)
            .not('price_per_unit', 'is', null)
            .gt('price_per_unit', 0)
            .neq('id', shipmentId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (priceHistory && priceHistory.length >= 3) {
            const { data: currentShipment } = await supabase
              .from('shipments')
              .select('price_per_unit')
              .eq('id', shipmentId)
              .single();

            if (currentShipment?.price_per_unit) {
              const prices = priceHistory.map(p => p.price_per_unit).filter(p => p > 0);
              const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
              const priceDev = Math.abs(currentShipment.price_per_unit - avgPrice) / avgPrice;

              if (priceDev > 0.5) {
                alerts.push({
                  organization_id: organizationId,
                  shipment_id: shipmentId,
                  alert_type: 'price_anomaly',
                  severity: priceDev > 1 ? 'high' : 'medium',
                  description: `سعر الوحدة (${currentShipment.price_per_unit} ريال) ينحرف بنسبة ${(priceDev * 100).toFixed(0)}% عن متوسط الأسعار (${avgPrice.toFixed(2)} ريال)`,
                  evidence: {
                    current_price: currentShipment.price_per_unit,
                    avg_price: Math.round(avgPrice * 100) / 100,
                    deviation_percent: Math.round(priceDev * 100),
                  },
                });
              }
            }
          }
        }
      }
    }

    // 2. Duplicate shipment detection (same generator, same quantity, same day)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayShipments } = await supabase
      .from('shipments')
      .select('id, shipment_number, generator_id, quantity, waste_type, created_at')
      .or(`transporter_id.eq.${organizationId},organization_id.eq.${organizationId}`)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (todayShipments && todayShipments.length > 1) {
      const seen = new Map<string, any>();
      for (const s of todayShipments) {
        const key = `${s.generator_id}_${s.quantity}_${s.waste_type}`;
        if (seen.has(key)) {
          const original = seen.get(key);
          // Check if alert already exists
          const { data: existingAlert } = await supabase
            .from('fraud_alerts')
            .select('id')
            .eq('shipment_id', s.id)
            .eq('alert_type', 'duplicate_shipment')
            .maybeSingle();

          if (!existingAlert) {
            alerts.push({
              organization_id: organizationId,
              shipment_id: s.id,
              alert_type: 'duplicate_shipment',
              severity: 'high',
              description: `شحنة مكررة محتملة: ${s.shipment_number} تتطابق مع ${original.shipment_number} (نفس المولّد، الكمية، ونوع المخلفات)`,
              evidence: {
                duplicate_of: original.id,
                original_number: original.shipment_number,
                matching_fields: ['generator_id', 'quantity', 'waste_type'],
              },
            });
          }
        }
        seen.set(key, s);
      }
    }

    // 3. Insert alerts
    if (alerts.length > 0) {
      const { error: insertErr } = await supabase.from('fraud_alerts').insert(alerts);
      if (insertErr) console.error("Error inserting fraud alerts:", insertErr);
    }

    return new Response(JSON.stringify({
      success: true,
      alerts_generated: alerts.length,
      alerts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("Fraud detection error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPSPayload {
  device_serial?: string;
  imei?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: string;
  battery?: number;
  signal?: number;
  raw_data?: Record<string, any>;
}

interface DeviceAction {
  action: 'receive_location' | 'test_connection' | 'get_device_status' | 'bulk_update';
  device_id?: string;
  device_serial?: string;
  payload?: GPSPayload | GPSPayload[];
  device_type?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: DeviceAction = await req.json();
    const { action, device_id, device_serial, payload, device_type } = body;

    console.log(`[GPS Gateway] Action: ${action}, Device: ${device_id || device_serial}`);

    // Action: Receive location from GPS device
    if (action === 'receive_location') {
      if (!payload) {
        throw new Error('Payload is required for receive_location action');
      }

      // Handle single or bulk payloads
      const payloads = Array.isArray(payload) ? payload : [payload];
      const results = [];

      for (const p of payloads) {
        // Find device by serial or IMEI
        const searchField = p.device_serial || p.imei || device_serial;
        
        if (!searchField) {
          results.push({ success: false, error: 'Device identifier not provided' });
          continue;
        }

        const { data: device, error: deviceError } = await supabase
          .from('gps_devices')
          .select('id, driver_id, organization_id')
          .eq('device_serial', searchField)
          .eq('is_active', true)
          .single();

        if (deviceError || !device) {
          console.error(`[GPS Gateway] Device not found: ${searchField}`);
          results.push({ success: false, error: 'Device not found or inactive' });
          continue;
        }

        // Find active shipment for this driver
        let shipmentId = null;
        if (device.driver_id) {
          const { data: shipment } = await supabase
            .from('shipments')
            .select('id')
            .eq('driver_id', device.driver_id)
            .in('status', ['approved', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          shipmentId = shipment?.id;
        }

        // Insert location log
        const { error: logError } = await supabase
          .from('gps_location_logs')
          .insert({
            device_id: device.id,
            driver_id: device.driver_id,
            shipment_id: shipmentId,
            latitude: p.latitude,
            longitude: p.longitude,
            altitude: p.altitude,
            speed: p.speed,
            heading: p.heading,
            accuracy: p.accuracy || 10,
            source: 'gps_device',
            raw_data: p.raw_data || p,
            recorded_at: p.timestamp || new Date().toISOString(),
          });

        if (logError) {
          console.error('[GPS Gateway] Error inserting log:', logError);
          results.push({ success: false, error: 'Failed to save location' });
          continue;
        }

        // Update device last location
        await supabase
          .from('gps_devices')
          .update({
            last_ping_at: new Date().toISOString(),
            last_location: { lat: p.latitude, lng: p.longitude, speed: p.speed, heading: p.heading },
            battery_level: p.battery,
            signal_strength: p.signal,
          })
          .eq('id', device.id);

        results.push({ success: true, device_id: device.id });
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Test device connection
    if (action === 'test_connection') {
      if (!device_id) {
        throw new Error('device_id is required for test_connection');
      }

      const { data: device, error: deviceError } = await supabase
        .from('gps_devices')
        .select('*, gps_device_types:device_type')
        .eq('id', device_id)
        .single();

      if (deviceError || !device) {
        return new Response(
          JSON.stringify({ success: false, message: 'الجهاز غير موجود' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For HTTP-based devices, we can try to ping their API
      if (device.protocol === 'http' && device.api_endpoint) {
        try {
          const response = await fetch(device.api_endpoint, {
            method: 'GET',
            headers: device.api_key ? { 'Authorization': `Bearer ${device.api_key}` } : {},
          });

          if (response.ok) {
            // Update last ping
            await supabase
              .from('gps_devices')
              .update({ last_ping_at: new Date().toISOString() })
              .eq('id', device_id);

            return new Response(
              JSON.stringify({ success: true, message: 'الاتصال ناجح' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (e) {
          console.error('[GPS Gateway] Connection test failed:', e);
        }
      }

      // For other protocols, check last ping time
      if (device.last_ping_at) {
        const lastPing = new Date(device.last_ping_at);
        const minutesAgo = (Date.now() - lastPing.getTime()) / 60000;

        if (minutesAgo < 5) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `الجهاز نشط - آخر اتصال منذ ${Math.round(minutesAgo)} دقيقة` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'الجهاز غير نشط أو لم يتم الاتصال به مؤخراً' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get device status
    if (action === 'get_device_status') {
      if (!device_id) {
        throw new Error('device_id is required');
      }

      const { data: device, error } = await supabase
        .from('gps_devices')
        .select('*, driver:drivers(full_name)')
        .eq('id', device_id)
        .single();

      if (error || !device) {
        throw new Error('Device not found');
      }

      // Get last 10 locations
      const { data: recentLogs } = await supabase
        .from('gps_location_logs')
        .select('latitude, longitude, speed, recorded_at')
        .eq('device_id', device_id)
        .order('recorded_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          success: true,
          device,
          recent_locations: recentLogs || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[GPS Gateway] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

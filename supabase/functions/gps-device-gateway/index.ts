import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-key',
};

// --- Input Validation Helpers ---
function isValidLatitude(v: unknown): v is number {
  return typeof v === 'number' && v >= -90 && v <= 90;
}
function isValidLongitude(v: unknown): v is number {
  return typeof v === 'number' && v >= -180 && v <= 180;
}
function isValidString(v: unknown, maxLen = 255): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}
function isOptionalNumber(v: unknown): boolean {
  return v === undefined || v === null || typeof v === 'number';
}

function validateGPSPayload(p: any): string | null {
  if (!p || typeof p !== 'object') return 'Invalid payload';
  if (!isValidLatitude(p.latitude)) return 'Invalid latitude';
  if (!isValidLongitude(p.longitude)) return 'Invalid longitude';
  if (!isOptionalNumber(p.altitude)) return 'Invalid altitude';
  if (!isOptionalNumber(p.speed)) return 'Invalid speed';
  if (!isOptionalNumber(p.heading)) return 'Invalid heading';
  if (!isOptionalNumber(p.accuracy)) return 'Invalid accuracy';
  if (!isOptionalNumber(p.battery)) return 'Invalid battery';
  if (!isOptionalNumber(p.signal)) return 'Invalid signal';
  return null;
}

function validateAction(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  const validActions = ['receive_location', 'test_connection', 'get_device_status', 'bulk_update'];
  if (!validActions.includes(body.action)) return 'Invalid action';
  if (body.device_id && typeof body.device_id !== 'string') return 'Invalid device_id';
  if (body.device_serial && typeof body.device_serial !== 'string') return 'Invalid device_serial';
  return null;
}

// Rate limiting: simple in-memory per-device tracker
const deviceRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute per device
const RATE_WINDOW = 60_000;

function isRateLimited(deviceKey: string): boolean {
  const now = Date.now();
  const entry = deviceRequestCounts.get(deviceKey);
  if (!entry || now > entry.resetAt) {
    deviceRequestCounts.set(deviceKey, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    const actionError = validateAction(body);
    if (actionError) {
      return new Response(
        JSON.stringify({ success: false, error: actionError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, device_id, device_serial, payload, device_type } = body;

    // Extract device authentication key from header or body
    const deviceAuthKey = req.headers.get('x-device-key') || body.device_key;

    console.log(`[GPS Gateway] Action: ${action}, Device: ${device_id || device_serial}`);

    // Action: Receive location from GPS device
    if (action === 'receive_location') {
      if (!payload) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payload is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payloads = Array.isArray(payload) ? payload : [payload];

      // Limit bulk size
      if (payloads.length > 100) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bulk limit exceeded (max 100)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];

      for (const p of payloads) {
        // Validate payload
        const validationError = validateGPSPayload(p);
        if (validationError) {
          results.push({ success: false, error: validationError });
          continue;
        }

        const searchField = p.device_serial || p.imei || device_serial;
        if (!searchField || !isValidString(searchField, 100)) {
          results.push({ success: false, error: 'Device identifier not provided or invalid' });
          continue;
        }

        // Rate limit per device
        if (isRateLimited(searchField)) {
          results.push({ success: false, error: 'Rate limit exceeded' });
          continue;
        }

        // Find device and verify auth key
        const { data: device, error: deviceError } = await supabase
          .from('gps_devices')
          .select('id, driver_id, organization_id, api_key')
          .eq('device_serial', searchField)
          .eq('is_active', true)
          .single();

        if (deviceError || !device) {
          results.push({ success: false, error: 'Device not found or inactive' });
          continue;
        }

        // Verify device authentication key
        if (device.api_key) {
          if (!deviceAuthKey || deviceAuthKey !== device.api_key) {
            console.error(`[GPS Gateway] Auth failed for device: ${searchField}`);
            results.push({ success: false, error: 'Device authentication failed' });
            continue;
          }
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
            raw_data: p.raw_data || {},
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

    // Action: Test device connection - requires user auth
    if (action === 'test_connection') {
      if (!device_id || typeof device_id !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid device_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user auth for management actions
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      // Verify user belongs to same org as device
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.organization_id !== device.organization_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (device.protocol === 'http' && device.api_endpoint) {
        try {
          const response = await fetch(device.api_endpoint, {
            method: 'GET',
            headers: device.api_key ? { 'Authorization': `Bearer ${device.api_key}` } : {},
          });

          if (response.ok) {
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

    // Action: Get device status - requires user auth
    if (action === 'get_device_status') {
      if (!device_id || typeof device_id !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid device_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: device, error } = await supabase
        .from('gps_devices')
        .select('*, driver:drivers(full_name)')
        .eq('id', device_id)
        .single();

      if (error || !device) {
        return new Response(
          JSON.stringify({ success: false, error: 'Device not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user belongs to same org
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.organization_id !== device.organization_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: recentLogs } = await supabase
        .from('gps_location_logs')
        .select('latitude, longitude, speed, recorded_at')
        .eq('device_id', device_id)
        .order('recorded_at', { ascending: false })
        .limit(10);

      // Remove sensitive fields before returning
      const { api_key: _ak, connection_config: _cc, ...safeDevice } = device;

      return new Response(
        JSON.stringify({
          success: true,
          device: safeDevice,
          recent_locations: recentLogs || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GPS Gateway] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

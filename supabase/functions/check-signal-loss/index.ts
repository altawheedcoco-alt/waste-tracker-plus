import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const timeoutMinutes = 3;

    // Find drivers who haven't sent location in timeout period
    const { data: offlineDrivers, error: queryError } = await supabase
      .from('driver_signal_status')
      .select('driver_id, organization_id, last_seen_at, signal_lost_notified, drivers:driver_id(full_name)')
      .eq('is_online', true)
      .lt('last_seen_at', new Date(Date.now() - timeoutMinutes * 60000).toISOString());

    if (queryError) throw queryError;

    const results = [];

    for (const driver of offlineDrivers || []) {
      // Mark as offline
      await supabase
        .from('driver_signal_status')
        .update({
          is_online: false,
          signal_lost_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('driver_id', driver.driver_id);

      // Send notification if not already notified
      if (!driver.signal_lost_notified) {
        const driverName = (driver as any).drivers?.full_name || 'سائق';
        const minutesOffline = Math.round((Date.now() - new Date(driver.last_seen_at).getTime()) / 60000);

        // Get admin users for this org
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', driver.organization_id);

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin: any) => ({
            user_id: admin.id,
            title: '⚠️ انقطاع إشارة سائق',
            message: `السائق ${driverName} غير متصل منذ ${minutesOffline} دقيقة`,
            type: 'signal_lost',
          }));
          await supabase.from('notifications').insert(notifications);
        }

        // Mark as notified
        await supabase
          .from('driver_signal_status')
          .update({ signal_lost_notified: true })
          .eq('driver_id', driver.driver_id);

        results.push({ driver_id: driver.driver_id, notified: true });
      }
    }

    console.log(`[SignalLoss] Checked ${offlineDrivers?.length || 0} stale drivers, notified ${results.length}`);

    return new Response(
      JSON.stringify({ success: true, checked: offlineDrivers?.length || 0, notified: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SignalLoss] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, organizationId, dataType, portalId, sessionToken } = await req.json();
    if (!clientId || !organizationId || !dataType) {
      return new Response(JSON.stringify({ error: 'Missing params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Require session token
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Session token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate session token
    const { data: session, error: sessionError } = await supabase
      .from('portal_sessions')
      .select('client_id, organization_id, expires_at')
      .eq('token', sessionToken)
      .eq('client_id', clientId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from('portal_sessions').delete().eq('token', sessionToken);
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify organization matches
    if (session.organization_id !== organizationId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the client is still active
    const { data: client } = await supabase
      .from('portal_clients')
      .select('id, client_name, client_email, client_phone')
      .eq('id', clientId)
      .eq('is_active', true)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any = null;

    switch (dataType) {
      case 'shipments': {
        const { data } = await supabase
          .from('shipments')
          .select(`
            id, tracking_number, status, waste_type, quantity, unit,
            pickup_address, delivery_address, created_at, updated_at,
            estimated_delivery, actual_delivery, notes
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      case 'invoices': {
        const { data } = await supabase
          .from('invoices')
          .select(`
            id, invoice_number, total_amount, currency, status,
            issue_date, due_date, paid_at, notes
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      case 'collection_requests': {
        const { data } = await supabase
          .from('collection_requests')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('customer_name', client.client_name)
          .order('created_at', { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      case 'service_requests': {
        const { data } = await supabase
          .from('portal_service_requests')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(50);
        result = data || [];
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown dataType' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal data error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

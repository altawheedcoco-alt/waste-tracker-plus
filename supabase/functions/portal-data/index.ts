import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, organizationId, dataType, portalId } = await req.json();
    if (!clientId || !organizationId || !dataType) {
      return new Response(JSON.stringify({ error: 'Missing params' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the client still exists and is active
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
        // Get shipments related to this client's organization
        // Match by client name in generator/recycler or external partner
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
        // Get collection requests created by this client
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

      case 'create_collection_request': {
        // Create a new collection request from the portal
        const { requestData } = await req.json().catch(() => ({ requestData: null }));
        // Re-parse body since we already consumed it
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

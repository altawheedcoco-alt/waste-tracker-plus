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
    const { slug, access_code } = await req.json();
    if (!slug || !access_code) {
      return new Response(JSON.stringify({ error: 'Missing slug or access_code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find portal by slug
    const { data: portal, error: portalError } = await supabase
      .from('client_portals')
      .select('id, organization_id, portal_name, primary_color, secondary_color, logo_url, welcome_message, is_active')
      .eq('portal_slug', slug)
      .eq('is_active', true)
      .single();

    if (portalError || !portal) {
      return new Response(JSON.stringify({ error: 'Portal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find client by access code
    const { data: client, error: clientError } = await supabase
      .from('portal_clients')
      .select('id, client_name, client_email, client_phone, is_active')
      .eq('portal_id', portal.id)
      .eq('access_code', access_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Invalid access code' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last login
    await supabase
      .from('portal_clients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', client.id);

    // Get portal settings (permissions)
    const { data: settings } = await supabase
      .from('customer_portal_settings')
      .select('*')
      .eq('organization_id', portal.organization_id)
      .maybeSingle();

    // Get organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, phone, email, address')
      .eq('id', portal.organization_id)
      .single();

    // Generate a session token (simple, time-limited)
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    return new Response(JSON.stringify({
      success: true,
      portal: {
        id: portal.id,
        name: portal.portal_name,
        primaryColor: portal.primary_color,
        secondaryColor: portal.secondary_color,
        logoUrl: portal.logo_url,
        welcomeMessage: portal.welcome_message,
      },
      client: {
        id: client.id,
        name: client.client_name,
        email: client.client_email,
      },
      organization: org ? {
        name: org.name,
        logoUrl: org.logo_url,
        phone: org.phone,
        email: org.email,
      } : null,
      permissions: {
        trackShipments: settings?.allow_shipment_tracking ?? true,
        viewInvoices: settings?.allow_invoices_view ?? false,
        downloadDocuments: settings?.allow_document_download ?? false,
        requestServices: settings?.allow_service_requests ?? true,
      },
      organizationId: portal.organization_id,
      sessionToken,
      sessionExpiry,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal auth error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

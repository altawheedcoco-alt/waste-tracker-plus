import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IP_ATTEMPTS = 10;
const MAX_ACCOUNT_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const RATE_WINDOW_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, access_code } = await req.json();
    if (!slug || !access_code || typeof slug !== 'string' || typeof access_code !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid slug/access_code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (slug.length > 100 || access_code.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // === IP-based Rate Limiting ===
    const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { count: ipAttempts } = await supabase
      .from('portal_auth_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('portal_slug', slug)
      .gte('attempted_at', windowStart);

    if ((ipAttempts ?? 0) >= MAX_IP_ATTEMPTS) {
      return new Response(JSON.stringify({ 
        error: 'عدد المحاولات كثير جداً. حاول مرة أخرى لاحقاً.',
        error_en: 'Too many attempts. Please try again later.',
        retry_after_minutes: RATE_WINDOW_MINUTES
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('portal_auth_attempts').insert({
      ip_address: ipAddress,
      portal_slug: slug,
    });

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
      .select('id, client_name, client_email, client_phone, is_active, failed_login_attempts, locked_until')
      .eq('portal_id', portal.id)
      .eq('access_code', access_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'رمز الوصول غير صحيح', error_en: 'Invalid access code' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === Account Lockout Check ===
    if (client.locked_until) {
      const lockExpiry = new Date(client.locked_until);
      if (lockExpiry > new Date()) {
        const remainingMinutes = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
        return new Response(JSON.stringify({ 
          error: `الحساب مقفل. حاول بعد ${remainingMinutes} دقيقة.`,
          error_en: `Account locked. Try again in ${remainingMinutes} minutes.`,
          locked: true,
          retry_after_minutes: remainingMinutes
        }), {
          status: 423,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // === Successful login - reset failed attempts ===
    await supabase
      .from('portal_clients')
      .update({ 
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
        last_failed_attempt: null,
      })
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

    // Generate a session token and PERSIST it in portal_sessions
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    // Clean up old sessions for this client
    await supabase
      .from('portal_sessions')
      .delete()
      .eq('client_id', client.id)
      .lt('expires_at', new Date().toISOString());

    // Store the new session
    await supabase.from('portal_sessions').insert({
      token: sessionToken,
      client_id: client.id,
      portal_id: portal.id,
      organization_id: portal.organization_id,
      ip_address: ipAddress,
      expires_at: sessionExpiry,
    });

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

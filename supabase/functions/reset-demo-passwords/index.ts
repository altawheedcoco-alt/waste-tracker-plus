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
    const confirmHeader = req.headers.get('x-confirm-reset');
    if (confirmHeader !== 'yes-reset-demo') {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const NEW_PASSWORD = 'Demo@575757';

    // Get all demo accounts
    const demoEmails = [
      'demo-generator@irecycle.test', 'demo-recycler@irecycle.test',
      'demo-disposal@irecycle.test', 'demo-transporter@irecycle.test',
      'demo-driver@irecycle.test', 'demo-employee@irecycle.test',
      'demo-consultant@irecycle.test', 'demo-consulting-office@irecycle.test',
      'demo-iso-body@irecycle.test', 'demo-transport-office@irecycle.test',
      'generator@demo.com', 'generator2@demo.com',
      'recycler@demo.com', 'disposal@demo.com',
      'transporter@demo.com', 'driver@demo.com',
      'wmra@irecycle.demo', 'eeaa@irecycle.demo',
      'ltra@irecycle.demo', 'ida@irecycle.demo',
      'abdullah-generator@irecycle.test', 'abdullah-recycler@irecycle.test',
      'abdullah-transporter@irecycle.test', 'abdullah-driver@irecycle.test',
    ];

    const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const results: any[] = [];

    for (const email of demoEmails) {
      const user = allUsers?.users?.find((u: any) => u.email === email);
      if (!user) {
        results.push({ email, status: 'not_found' });
        continue;
      }

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: NEW_PASSWORD,
        email_confirm: true,
        ban_duration: 'none',
      });

      if (error) {
        results.push({ email, status: 'error', error: error.message });
      } else {
        results.push({ email, status: 'updated' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      password: NEW_PASSWORD,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

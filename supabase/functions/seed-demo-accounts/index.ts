import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_PASSWORD = 'Demo@2026!';

// Only the admin account is kept
const ADMIN_ACCOUNT = {
  email: 'demo-admin@irecycle.test',
  fullName: 'مدير النظام',
  orgType: 'admin',
  role: 'admin',
  phone: '01000000007',
  icon: '🔑',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }

    if (body?.reset) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const demoUser = existingUsers?.users?.find(u => u.email === ADMIN_ACCOUNT.email);
      if (demoUser) {
        await supabase.auth.admin.deleteUser(demoUser.id);
      }
      return new Response(
        JSON.stringify({ success: true, message: 'تم حذف حساب الأدمن التجريبي' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_ACCOUNT.email);

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: true, accounts: [{ email: ADMIN_ACCOUNT.email, status: 'exists' }] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: ADMIN_ACCOUNT.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_ACCOUNT.fullName },
    });

    if (authErr) {
      return new Response(
        JSON.stringify({ success: false, error: authErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user!.id;

    // Create profile
    await supabase.from('profiles').upsert({
      id: userId,
      user_id: userId,
      full_name: ADMIN_ACCOUNT.fullName,
      email: ADMIN_ACCOUNT.email,
      phone: ADMIN_ACCOUNT.phone,
      is_active: true,
    }, { onConflict: 'id' });

    // Assign admin role
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'admin' as any,
    });

    return new Response(
      JSON.stringify({
        success: true,
        accounts: [{ email: ADMIN_ACCOUNT.email, label: ADMIN_ACCOUNT.fullName, status: 'created' }],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

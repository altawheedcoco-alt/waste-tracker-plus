import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Password loaded from environment secret - never hardcoded
const DEMO_PASSWORD = Deno.env.get('DEMO_ACCOUNT_PASSWORD') || crypto.randomUUID() + '!A1';

const DEMO_ACCOUNTS = [
  { email: 'demo-generator@irecycle.test', fullName: 'مولد مخلفات', orgType: 'generator', role: 'generator', phone: '01000000001' },
  { email: 'demo-recycler@irecycle.test', fullName: 'معيد تدوير', orgType: 'recycler', role: 'recycler', phone: '01000000002' },
  { email: 'demo-transporter@irecycle.test', fullName: 'ناقل مخلفات', orgType: 'transporter', role: 'transporter', phone: '01000000003' },
  { email: 'demo-disposal@irecycle.test', fullName: 'جهة تخلص آمن', orgType: 'disposal', role: 'disposal', phone: '01000000004' },
  { email: 'demo-driver@irecycle.test', fullName: 'سائق', orgType: 'driver', role: 'driver', phone: '01000000005' },
  { email: 'demo-employee@irecycle.test', fullName: 'موظف', orgType: 'employee', role: 'employee', phone: '01000000006' },
  { email: 'demo-admin@irecycle.test', fullName: 'مدير النظام', orgType: 'admin', role: 'admin', phone: '01000000007' },
  { email: 'demo-consultant@irecycle.test', fullName: 'استشاري بيئي', orgType: 'consultant', role: 'consultant', phone: '01000000008' },
  { email: 'demo-consulting-office@irecycle.test', fullName: 'مكتب استشاري', orgType: 'consulting_office', role: 'consultant', phone: '01000000009' },
  { email: 'demo-iso-body@irecycle.test', fullName: 'جهة مانحة للأيزو', orgType: 'iso_body', role: 'consultant', phone: '01000000010' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // === Admin Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - يتطلب تسجيل الدخول' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - جلسة غير صالحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - للمديرين فقط' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === Proceed with demo account operations ===
    const supabase = adminClient;

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }

    if (body?.reset) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let deleted = 0;
      for (const account of DEMO_ACCOUNTS) {
        const demoUser = existingUsers?.users?.find(u => u.email === account.email);
        if (demoUser) {
          await supabase.auth.admin.deleteUser(demoUser.id);
          deleted++;
        }
      }
      return new Response(
        JSON.stringify({ success: true, message: `تم حذف ${deleted} حسابات تجريبية` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const results: any[] = [];

    for (const account of DEMO_ACCOUNTS) {
      const existing = existingUsers?.users?.find(u => u.email === account.email);
      if (existing) {
        results.push({ email: account.email, label: account.fullName, status: 'exists' });
        continue;
      }

      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (authErr) {
        results.push({ email: account.email, label: account.fullName, status: 'error', error: authErr.message });
        continue;
      }

      const newUserId = authData.user!.id;

      await supabase.from('profiles').upsert({
        id: newUserId,
        user_id: newUserId,
        full_name: account.fullName,
        email: account.email,
        phone: account.phone,
        is_active: true,
      }, { onConflict: 'id' });

      await supabase.from('user_roles').insert({
        user_id: newUserId,
        role: account.role as any,
      });

      results.push({ email: account.email, label: account.fullName, status: 'created' });
    }

    return new Response(
      JSON.stringify({ success: true, accounts: results, password: DEMO_PASSWORD }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

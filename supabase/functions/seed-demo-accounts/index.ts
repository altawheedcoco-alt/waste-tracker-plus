import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Password loaded from environment secret - never hardcoded
const DEMO_PASSWORD = Deno.env.get('DEMO_ACCOUNT_PASSWORD') || crypto.randomUUID() + '!A1';

const ORG_NAMES: Record<string, string> = {
  generator: 'شركة المولد التجريبية',
  transporter: 'شركة النقل التجريبية',
  transport_office: 'مكتب النقل التجريبي',
  recycler: 'شركة التدوير التجريبية',
  disposal: 'شركة التخلص الآمن التجريبية',
  consultant: 'مكتب الاستشارات البيئية التجريبي',
  consulting_office: 'المكتب الاستشاري التجريبي',
  iso_body: 'جهة الأيزو التجريبية',
};

const DEMO_ACCOUNTS = [
  { email: 'demo-generator@irecycle.test', fullName: 'مولد مخلفات', orgType: 'generator', orgName: 'شركة المولد التجريبية', role: 'company_admin', phone: '01000000001' },
  { email: 'demo-recycler@irecycle.test', fullName: 'معيد تدوير', orgType: 'recycler', orgName: 'شركة التدوير التجريبية', role: 'company_admin', phone: '01000000002' },
  { email: 'demo-transporter@irecycle.test', fullName: 'ناقل مخلفات', orgType: 'transporter', orgName: 'شركة النقل التجريبية', role: 'company_admin', phone: '01000000003' },
  { email: 'demo-transport-office@irecycle.test', fullName: 'مكتب نقل', orgType: 'transporter', orgName: 'مكتب النقل التجريبي', role: 'company_admin', phone: '01000000011' },
  { email: 'demo-disposal@irecycle.test', fullName: 'جهة تخلص آمن', orgType: 'disposal', orgName: 'شركة التخلص الآمن التجريبية', role: 'company_admin', phone: '01000000004' },
  { email: 'demo-driver@irecycle.test', fullName: 'سائق', orgType: 'transporter', orgName: 'شركة سائق النقل التجريبية', role: 'driver', phone: '01000000005' },
  { email: 'demo-employee@irecycle.test', fullName: 'موظف', orgType: 'transporter', orgName: 'شركة الموظف التجريبية', role: 'employee', phone: '01000000006' },
  { email: 'demo-admin@irecycle.test', fullName: 'مدير النظام', orgType: 'transporter', orgName: 'شركة المدير التجريبية', role: 'admin', phone: '01000000007' },
  { email: 'demo-consultant@irecycle.test', fullName: 'استشاري بيئي', orgType: 'consultant', orgName: 'مكتب الاستشارات البيئية التجريبي', role: 'company_admin', phone: '01000000008' },
  { email: 'demo-consulting-office@irecycle.test', fullName: 'مكتب استشاري', orgType: 'consulting_office', orgName: 'المكتب الاستشاري التجريبي', role: 'company_admin', phone: '01000000009' },
  { email: 'demo-iso-body@irecycle.test', fullName: 'جهة مانحة للأيزو', orgType: 'iso_body', orgName: 'جهة الأيزو التجريبية', role: 'company_admin', phone: '01000000010' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // === Authentication: Admin session OR access PIN ===
    const adminClient = createClient(supabaseUrl, serviceKey);
    let authorized = false;

    // Method 1: Check access PIN from body
    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    
    const ACCESS_PIN = Deno.env.get('DEMO_ACCESS_PIN') || '575757';
    if (body?.pin === ACCESS_PIN) {
      authorized = true;
    }

    // Method 2: Check admin session
    if (!authorized) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const authClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) {
          const { data: roleData } = await adminClient
            .from('user_roles')
            .select('role')
            .eq('user_id', claimsData.claims.sub)
            .eq('role', 'admin')
            .single();
          if (roleData) authorized = true;
        }
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - رمز الدخول غير صحيح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === Proceed with demo account operations ===
    const supabase = adminClient;

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

      // Find or create independent organization for each account
      let orgId: string | null = null;
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', account.orgName)
        .eq('organization_type', account.orgType)
        .limit(1)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: account.orgName,
            organization_type: account.orgType,
            email: account.email,
            phone: account.phone,
            is_active: true,
          })
          .select('id')
          .single();
        orgId = newOrg?.id || null;
      }

      await supabase.from('profiles').upsert({
        id: newUserId,
        user_id: newUserId,
        full_name: account.fullName,
        email: account.email,
        phone: account.phone,
        organization_id: orgId,
        is_active: true,
      }, { onConflict: 'id' });

      await supabase.from('user_roles').insert({
        user_id: newUserId,
        role: account.role as any,
      }).then(() => {});

      results.push({ email: account.email, label: account.fullName, status: 'created', orgId });
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

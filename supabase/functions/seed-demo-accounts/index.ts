import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_PASSWORD = 'Demo@2026!';

const DEMO_ACCOUNTS = [
  {
    email: 'demo-generator@irecycle.test',
    fullName: 'مولد مخلفات تجريبي',
    orgName: 'شركة المولد التجريبية',
    orgNameEn: 'Demo Generator Co',
    orgType: 'generator',
    role: 'company_admin',
    phone: '01000000001',
    icon: '🏭',
  },
  {
    email: 'demo-recycler@irecycle.test',
    fullName: 'معيد تدوير تجريبي',
    orgName: 'شركة التدوير التجريبية',
    orgNameEn: 'Demo Recycler Co',
    orgType: 'recycler',
    role: 'company_admin',
    phone: '01000000002',
    icon: '♻️',
  },
  {
    email: 'demo-transporter@irecycle.test',
    fullName: 'ناقل مخلفات تجريبي',
    orgName: 'شركة النقل التجريبية',
    orgNameEn: 'Demo Transport Co',
    orgType: 'transporter',
    role: 'company_admin',
    phone: '01000000003',
    icon: '🚛',
  },
  {
    email: 'demo-disposal@irecycle.test',
    fullName: 'جهة تخلص آمن تجريبية',
    orgName: 'شركة التخلص الآمن التجريبية',
    orgNameEn: 'Demo Disposal Co',
    orgType: 'disposal',
    role: 'company_admin',
    phone: '01000000004',
    icon: '🛡️',
  },
  {
    email: 'demo-driver@irecycle.test',
    fullName: 'سائق تجريبي',
    orgName: null, // will be linked to transporter
    orgType: 'driver',
    role: 'driver',
    phone: '01000000005',
    icon: '🚗',
  },
  {
    email: 'demo-employee@irecycle.test',
    fullName: 'موظف تجريبي',
    orgName: null, // will be linked to transporter
    orgType: 'employee',
    role: 'employee',
    phone: '01000000006',
    icon: '👤',
  },
  {
    email: 'demo-admin@irecycle.test',
    fullName: 'مدير النظام التجريبي',
    orgName: null,
    orgType: 'admin',
    role: 'admin',
    phone: '01000000007',
    icon: '🔑',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: any[] = [];
    const orgIds: Record<string, string> = {};

    // Step 1: Create organizations for company accounts
    for (const account of DEMO_ACCOUNTS) {
      if (!account.orgName) continue;

      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('email', `${account.orgType}@demo.test`)
        .maybeSingle();

      if (existing) {
        orgIds[account.orgType] = existing.id;
        continue;
      }

      // Also check by name
      const { data: existingByName } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', account.orgName)
        .maybeSingle();

      if (existingByName) {
        orgIds[account.orgType] = existingByName.id;
        continue;
      }

      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: account.orgName,
          name_en: account.orgNameEn,
          organization_type: account.orgType,
          email: `${account.orgType}@demo.test`,
          phone: account.phone,
          city: 'القاهرة',
          region: 'القاهرة الكبرى',
          address: 'عنوان تجريبي',
          is_verified: true,
          is_active: true,
          representative_name: account.fullName,
          commercial_register: `CR-DEMO-${account.orgType.toUpperCase()}`,
          environmental_license: `ENV-DEMO-${account.orgType.toUpperCase()}`,
        })
        .select('id')
        .single();

      if (orgErr) {
        results.push({ email: account.email, status: 'org_error', error: orgErr.message });
        continue;
      }
      orgIds[account.orgType] = newOrg!.id;
    }

    // Step 2: Create user accounts
    for (const account of DEMO_ACCOUNTS) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      if (existingUser) {
        // Ensure user_organizations entry exists for existing users too
        let orgId: string | null = null;
        if (account.orgName) {
          orgId = orgIds[account.orgType] || null;
        } else if (account.orgType === 'driver' || account.orgType === 'employee') {
          orgId = orgIds['transporter'] || null;
        } else if (account.orgType === 'admin') {
          orgId = orgIds['transporter'] || null;
        }
        if (orgId) {
          await supabase.from('user_organizations').upsert({
            user_id: existingUser.id,
            organization_id: orgId,
            role_in_organization: account.role,
            is_primary: true,
            is_active: true,
          }, { onConflict: 'user_id,organization_id' });
        }
        results.push({
          email: account.email,
          label: account.fullName,
          icon: account.icon,
          orgType: account.orgType,
          status: 'exists_fixed',
        });
        continue;
      }

      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (authErr) {
        results.push({ email: account.email, status: 'auth_error', error: authErr.message });
        continue;
      }

      const userId = authData.user!.id;

      // Determine org ID
      let orgId: string | null = null;
      if (account.orgName) {
        orgId = orgIds[account.orgType] || null;
      } else if (account.orgType === 'driver' || account.orgType === 'employee') {
        orgId = orgIds['transporter'] || null;
      } else if (account.orgType === 'admin') {
        orgId = orgIds['transporter'] || null; // admin needs an org too
      }

      // Update profile
      await supabase.from('profiles').update({
        full_name: account.fullName,
        organization_id: orgId,
        phone: account.phone,
      }).eq('user_id', userId);

      // Assign role
      const roleToAssign = account.role as any;
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: roleToAssign,
      });

      // Create user_organizations entry (critical for dashboard routing)
      if (orgId) {
        await supabase.from('user_organizations').upsert({
          user_id: userId,
          organization_id: orgId,
          role_in_organization: account.role,
          is_primary: true,
          is_active: true,
        }, { onConflict: 'user_id,organization_id' });
      }

      // Create driver record if needed
      if (account.orgType === 'driver' && orgId) {
        await supabase.from('drivers').insert({
          profile_id: userId,
          organization_id: orgId,
          license_number: 'DL-DEMO-DRIVER',
          license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vehicle_type: 'شاحنة نقل مخلفات',
          vehicle_plate: 'ط ج ر 9999',
          is_available: true,
        });
      }

      results.push({
        email: account.email,
        label: account.fullName,
        icon: account.icon,
        orgType: account.orgType,
        status: 'created',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        password: DEMO_PASSWORD,
        accounts: results,
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

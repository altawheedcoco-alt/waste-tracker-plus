import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_PASSWORD = '57575757';

const regulatorAccounts = [
  {
    email: 'wmra@irecycle.demo',
    fullName: 'جهاز تنظيم إدارة المخلفات',
    orgName: 'جهاز تنظيم إدارة المخلفات (WMRA)',
    orgNameEn: 'Waste Management Regulatory Agency',
    levelCode: 'WMRA',
    phone: '0227928360',
    address: 'القاهرة، مصر',
    governorate: 'القاهرة',
    authorityRef: 'قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية',
    jurisdictionArea: ['جمهورية مصر العربية'],
  },
  {
    email: 'eeaa@irecycle.demo',
    fullName: 'وزارة البيئة - جهاز شؤون البيئة',
    orgName: 'جهاز شؤون البيئة (EEAA)',
    orgNameEn: 'Egyptian Environmental Affairs Agency',
    levelCode: 'EEAA',
    phone: '0225256452',
    address: 'القاهرة، مصر',
    governorate: 'القاهرة',
    authorityRef: 'قانون البيئة رقم 4 لسنة 1994 وتعديلاته ولائحته التنفيذية',
    jurisdictionArea: ['جمهورية مصر العربية'],
  },
  {
    email: 'ltra@irecycle.demo',
    fullName: 'جهاز تنظيم النقل البري',
    orgName: 'جهاز تنظيم النقل البري (LTRA)',
    orgNameEn: 'Land Transport Regulatory Authority',
    levelCode: 'LTRA',
    phone: '0227706090',
    address: 'القاهرة، مصر',
    governorate: 'القاهرة',
    authorityRef: 'قانون تنظيم النقل البري الداخلي والدولي رقم 73 لسنة 2019',
    jurisdictionArea: ['جمهورية مصر العربية'],
  },
  {
    email: 'ida@irecycle.demo',
    fullName: 'الهيئة العامة للتنمية الصناعية',
    orgName: 'الهيئة العامة للتنمية الصناعية (IDA)',
    orgNameEn: 'Industrial Development Authority',
    levelCode: 'IDA',
    phone: '0227701030',
    address: 'القاهرة، مصر',
    governorate: 'القاهرة',
    authorityRef: 'قانون التنمية الصناعية رقم 15 لسنة 2017 ولائحته التنفيذية',
    jurisdictionArea: ['جمهورية مصر العربية'],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const confirmHeader = req.headers.get('x-confirm-seed');
    if (confirmHeader !== 'yes-seed-regulators') {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: any[] = [];

    for (const account of regulatorAccounts) {
      console.log(`Processing regulator: ${account.email}`);

      // 1. Create or get auth user
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === account.email);

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
        await supabase.auth.admin.updateUserById(userId, {
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
        console.log(`User ${account.email} already exists: ${userId}`);
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
        if (createError) {
          console.error(`Error creating ${account.email}:`, createError);
          results.push({ email: account.email, status: 'error', error: createError.message });
          continue;
        }
        userId = newUser.user.id;
        console.log(`Created user: ${account.email} → ${userId}`);
      }

      // 2. Create or get organization
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', account.orgName)
        .single();

      let orgId: string;
      if (existingOrg) {
        orgId = existingOrg.id;
        console.log(`Org already exists: ${orgId}`);
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: account.orgName,
            name_en: account.orgNameEn,
            organization_type: 'regulator',
            email: account.email,
            phone: account.phone,
            address: account.address,
            is_verified: true,
            is_active: true,
          })
          .select('id')
          .single();

        if (orgError) {
          console.error(`Error creating org for ${account.email}:`, orgError);
          results.push({ email: account.email, status: 'error', error: orgError.message });
          continue;
        }
        orgId = newOrg.id;
        console.log(`Created org: ${account.orgName} → ${orgId}`);
      }

      // 3. Upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        user_id: userId,
        full_name: account.fullName,
        email: account.email,
        organization_id: orgId,
        active_organization_id: orgId,
      }, { onConflict: 'id' });

      // 4. Link user to organization
      const { data: existingLink } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .single();

      if (!existingLink) {
        await supabase.from('user_organizations').insert({
          user_id: userId,
          organization_id: orgId,
          role_in_organization: 'owner',
          is_primary: true,
        });
      }

      // 5. Create regulator config
      const { data: existingConfig } = await supabase
        .from('regulator_configs')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (!existingConfig) {
        await supabase.from('regulator_configs').insert({
          organization_id: orgId,
          regulator_level_code: account.levelCode,
          authority_reference: account.authorityRef,
          jurisdiction_area: account.jurisdictionArea,
        });
      }

      results.push({ email: account.email, orgName: account.orgName, status: 'success', userId, orgId });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'تم إنشاء حسابات الجهات الرقابية بنجاح',
      accounts: results,
      loginPassword: DEMO_PASSWORD,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seed regulator error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

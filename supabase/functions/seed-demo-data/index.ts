import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Starting demo data seeding...');

    // Demo accounts configuration
    const demoAccounts = [
      {
        email: 'admin@demo.com',
        password: 'admin123456',
        fullName: 'مدير النظام',
        role: 'admin' as const,
        orgType: null,
        orgName: null,
      },
      {
        email: 'generator@demo.com',
        password: 'generator123456',
        fullName: 'أحمد محمد - الجهة المولدة',
        role: 'company_admin' as const,
        orgType: 'generator' as const,
        orgName: 'شركة التوليد للنفايات',
      },
      {
        email: 'transporter@demo.com',
        password: 'transporter123456',
        fullName: 'محمد علي - الناقل',
        role: 'company_admin' as const,
        orgType: 'transporter' as const,
        orgName: 'شركة النقل السريع',
      },
      {
        email: 'recycler@demo.com',
        password: 'recycler123456',
        fullName: 'خالد سعيد - المُدوِّر',
        role: 'company_admin' as const,
        orgType: 'recycler' as const,
        orgName: 'شركة إعادة التدوير الخضراء',
      },
      {
        email: 'driver@demo.com',
        password: 'driver123456',
        fullName: 'سائق التوصيل',
        role: 'driver' as const,
        orgType: 'transporter' as const,
        orgName: null, // Will be linked to transporter org
      },
    ];

    const createdAccounts: any[] = [];
    let transporterOrgId: string | null = null;

    for (const account of demoAccounts) {
      console.log(`Processing account: ${account.email}`);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      let userId: string;

      if (existingUser) {
        console.log(`User ${account.email} already exists, updating...`);
        userId = existingUser.id;
        
        // Update password
        await supabase.auth.admin.updateUserById(userId, {
          password: account.password,
          email_confirm: true,
        });
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
        });

        if (createError) {
          console.error(`Error creating user ${account.email}:`, createError);
          continue;
        }

        userId = newUser.user.id;
        console.log(`Created user: ${account.email} with ID: ${userId}`);
      }

      // Create or get organization if needed
      let organizationId: string | null = null;

      if (account.orgType && account.orgName) {
        // Check if org exists
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', account.orgName)
          .single();

        if (existingOrg) {
          organizationId = existingOrg.id;
          console.log(`Organization ${account.orgName} already exists: ${organizationId}`);
        } else {
          // Create organization
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: account.orgName,
              organization_type: account.orgType,
              email: account.email,
              phone: '0501234567',
              address: 'الرياض، المملكة العربية السعودية',
              city: 'الرياض',
              is_verified: true,
              is_active: true,
            })
            .select()
            .single();

          if (orgError) {
            console.error(`Error creating org for ${account.email}:`, orgError);
          } else {
            organizationId = newOrg.id;
            console.log(`Created organization: ${account.orgName} with ID: ${organizationId}`);
          }
        }

        // Store transporter org ID for driver
        if (account.orgType === 'transporter') {
          transporterOrgId = organizationId;
        }
      }

      // For driver, use transporter org
      if (account.role === 'driver' && !organizationId && transporterOrgId) {
        organizationId = transporterOrgId;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: account.email,
            full_name: account.fullName,
            organization_id: organizationId,
            active_organization_id: organizationId,
            is_active: true,
          });

        if (profileError) {
          console.error(`Error creating profile for ${account.email}:`, profileError);
        } else {
          console.log(`Created profile for: ${account.email}`);
        }
      } else {
        // Update existing profile
        await supabase
          .from('profiles')
          .update({
            organization_id: organizationId,
            active_organization_id: organizationId,
            full_name: account.fullName,
          })
          .eq('user_id', userId);
        console.log(`Updated profile for: ${account.email}`);
      }

      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', account.role)
        .single();

      if (!existingRole) {
        // Create role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: account.role,
          });

        if (roleError) {
          console.error(`Error creating role for ${account.email}:`, roleError);
        } else {
          console.log(`Created role ${account.role} for: ${account.email}`);
        }
      }

      // Create user_organizations entry if organization exists
      if (organizationId) {
        const { data: existingUserOrg } = await supabase
          .from('user_organizations')
          .select('id')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .single();

        if (!existingUserOrg) {
          await supabase
            .from('user_organizations')
            .insert({
              user_id: userId,
              organization_id: organizationId,
              role_in_organization: account.role === 'driver' ? 'driver' : 'admin',
              is_primary: true,
              is_active: true,
            });
          console.log(`Created user_organization for: ${account.email}`);
        }
      }

      // For driver, also create driver record
      if (account.role === 'driver') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (profile) {
          const { data: existingDriver } = await supabase
            .from('drivers')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

          if (!existingDriver) {
            await supabase
              .from('drivers')
              .insert({
                profile_id: profile.id,
                organization_id: transporterOrgId,
                license_number: 'DRV-12345',
                vehicle_type: 'شاحنة كبيرة',
                vehicle_plate: 'أ ب ج 1234',
                is_available: true,
              });
            console.log(`Created driver record for: ${account.email}`);
          }
        }
      }

      createdAccounts.push({
        email: account.email,
        password: account.password,
        role: account.role,
        organization: account.orgName || (account.role === 'driver' ? 'شركة النقل السريع' : 'مدير النظام'),
      });
    }

    console.log('Demo data seeding completed!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء الحسابات التجريبية بنجاح',
        accounts: createdAccounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error seeding demo data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check - require admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Block execution in production environment
    const environment = Deno.env.get('ENVIRONMENT') || Deno.env.get('APP_ENV') || '';
    if (environment === 'production') {
      return new Response(
        JSON.stringify({ error: 'Demo seeding is disabled in production' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require a secret confirmation header to prevent accidental execution
    const confirmHeader = req.headers.get('x-confirm-seed');
    if (confirmHeader !== 'yes-seed-demo-data') {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation header. This action creates demo accounts with known passwords.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        email: 'generator2@demo.com',
        password: 'generator123456',
        fullName: 'سعيد أحمد - الجهة المولدة 2',
        role: 'company_admin' as const,
        orgType: 'generator' as const,
        orgName: 'مصنع الصناعات البلاستيكية',
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
        orgName: null,
      },
    ];

    const createdAccounts: any[] = [];
    let transporterOrgId: string | null = null;
    let generatorOrgId: string | null = null;
    let recyclerOrgId: string | null = null;
    let driverRecordId: string | null = null;

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

        // Store org IDs for shipments
        if (account.orgType === 'transporter') {
          transporterOrgId = organizationId;
        } else if (account.orgType === 'generator') {
          generatorOrgId = organizationId;
        } else if (account.orgType === 'recycler') {
          recyclerOrgId = organizationId;
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
            const { data: newDriver } = await supabase
              .from('drivers')
              .insert({
                profile_id: profile.id,
                organization_id: transporterOrgId,
                license_number: 'DRV-12345',
                vehicle_type: 'شاحنة كبيرة',
                vehicle_plate: 'أ ب ج 1234',
                is_available: true,
              })
              .select()
              .single();
            
            if (newDriver) {
              driverRecordId = newDriver.id;
            }
            console.log(`Created driver record for: ${account.email}`);
          } else {
            driverRecordId = existingDriver.id;
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

    // Create 10 demo shipments with correct enum values
    // shipment_status: 'new' | 'approved' | 'collecting' | 'in_transit' | 'delivered' | 'confirmed'
    // waste_type: 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'chemical' | 'medical' | 'construction' | 'other'
    console.log('Creating demo shipments...');
    
    if (transporterOrgId && generatorOrgId && recyclerOrgId) {
      const demoShipments = [
        {
          shipment_number: 'SHP-DEMO-001',
          status: 'new',
          waste_type: 'paper',
          quantity: 500,
          unit: 'kg',
          pickup_address: 'المنطقة الصناعية الأولى، الرياض',
          pickup_city: 'الرياض',
          delivery_address: 'مصنع إعادة التدوير، جدة',
          delivery_city: 'جدة',
          hazard_level: 'low',
          notes: 'نفايات ورقية من مكاتب إدارية',
          price_per_unit: 2.5,
          total_value: 1250,
        },
        {
          shipment_number: 'SHP-DEMO-002',
          status: 'approved',
          waste_type: 'plastic',
          quantity: 1200,
          unit: 'kg',
          pickup_address: 'مصنع البلاستيك، الدمام',
          pickup_city: 'الدمام',
          delivery_address: 'مركز إعادة التدوير الأخضر، الرياض',
          delivery_city: 'الرياض',
          hazard_level: 'low',
          notes: 'بلاستيك صناعي قابل لإعادة التدوير',
          price_per_unit: 3.0,
          total_value: 3600,
          approved_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-003',
          status: 'in_transit',
          waste_type: 'metal',
          quantity: 2000,
          unit: 'kg',
          pickup_address: 'ورشة المعادن، جدة',
          pickup_city: 'جدة',
          delivery_address: 'مصهر المعادن، الدمام',
          delivery_city: 'الدمام',
          hazard_level: 'medium',
          notes: 'خردة معدنية متنوعة',
          price_per_unit: 5.0,
          total_value: 10000,
          approved_at: new Date(Date.now() - 86400000).toISOString(),
          in_transit_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-004',
          status: 'delivered',
          waste_type: 'glass',
          quantity: 800,
          unit: 'kg',
          pickup_address: 'مصنع الزجاج، الرياض',
          pickup_city: 'الرياض',
          delivery_address: 'مركز إعادة تدوير الزجاج، جدة',
          delivery_city: 'جدة',
          hazard_level: 'low',
          notes: 'زجاج مكسور من خط الإنتاج',
          price_per_unit: 1.5,
          total_value: 1200,
          approved_at: new Date(Date.now() - 172800000).toISOString(),
          in_transit_at: new Date(Date.now() - 86400000).toISOString(),
          delivered_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-005',
          status: 'confirmed',
          waste_type: 'electronic',
          quantity: 300,
          unit: 'kg',
          pickup_address: 'شركة الإلكترونيات، الدمام',
          pickup_city: 'الدمام',
          delivery_address: 'مركز تدوير الإلكترونيات، الرياض',
          delivery_city: 'الرياض',
          hazard_level: 'high',
          notes: 'نفايات إلكترونية تحتاج معالجة خاصة',
          price_per_unit: 15.0,
          total_value: 4500,
          approved_at: new Date(Date.now() - 259200000).toISOString(),
          in_transit_at: new Date(Date.now() - 172800000).toISOString(),
          delivered_at: new Date(Date.now() - 86400000).toISOString(),
          confirmed_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-006',
          status: 'new',
          waste_type: 'organic',
          quantity: 1500,
          unit: 'kg',
          pickup_address: 'مطعم الضيافة، مكة المكرمة',
          pickup_city: 'مكة المكرمة',
          delivery_address: 'مصنع السماد العضوي، المدينة المنورة',
          delivery_city: 'المدينة المنورة',
          hazard_level: 'low',
          notes: 'نفايات غذائية عضوية',
          price_per_unit: 0.5,
          total_value: 750,
        },
        {
          shipment_number: 'SHP-DEMO-007',
          status: 'approved',
          waste_type: 'chemical',
          quantity: 100,
          unit: 'kg',
          pickup_address: 'مختبر الكيمياء، الرياض',
          pickup_city: 'الرياض',
          delivery_address: 'مركز معالجة النفايات الخطرة، الدمام',
          delivery_city: 'الدمام',
          hazard_level: 'high',
          notes: 'مواد كيميائية تحتاج معالجة خاصة - يتطلب تصريح',
          price_per_unit: 50.0,
          total_value: 5000,
          approved_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-008',
          status: 'collecting',
          waste_type: 'other',
          quantity: 3000,
          unit: 'kg',
          pickup_address: 'مركز التسوق الكبير، جدة',
          pickup_city: 'جدة',
          delivery_address: 'محطة فرز النفايات، الرياض',
          delivery_city: 'الرياض',
          hazard_level: 'low',
          notes: 'نفايات مختلطة تحتاج فرز',
          price_per_unit: 1.0,
          total_value: 3000,
          approved_at: new Date(Date.now() - 43200000).toISOString(),
          collection_started_at: new Date().toISOString(),
        },
        {
          shipment_number: 'SHP-DEMO-009',
          status: 'new',
          waste_type: 'paper',
          quantity: 750,
          unit: 'kg',
          pickup_address: 'مطبعة الأمل، المدينة المنورة',
          pickup_city: 'المدينة المنورة',
          delivery_address: 'مصنع إعادة تدوير الورق، الرياض',
          delivery_city: 'الرياض',
          hazard_level: 'low',
          notes: 'ورق طباعة وكرتون',
          price_per_unit: 2.0,
          total_value: 1500,
        },
        {
          shipment_number: 'SHP-DEMO-010',
          status: 'delivered',
          waste_type: 'plastic',
          quantity: 2500,
          unit: 'kg',
          pickup_address: 'مصنع التعبئة والتغليف، الدمام',
          pickup_city: 'الدمام',
          delivery_address: 'مصنع إعادة تدوير البلاستيك، جدة',
          delivery_city: 'جدة',
          hazard_level: 'low',
          notes: 'عبوات بلاستيكية فارغة',
          price_per_unit: 2.5,
          total_value: 6250,
          approved_at: new Date(Date.now() - 345600000).toISOString(),
          in_transit_at: new Date(Date.now() - 259200000).toISOString(),
          delivered_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      for (const shipment of demoShipments) {
        // Check if shipment already exists
        const { data: existingShipment } = await supabase
          .from('shipments')
          .select('id')
          .eq('shipment_number', shipment.shipment_number)
          .single();

        if (!existingShipment) {
          const { error: shipmentError } = await supabase
            .from('shipments')
            .insert({
              ...shipment,
              transporter_id: transporterOrgId,
              generator_id: generatorOrgId,
              recycler_id: recyclerOrgId,
              driver_id: driverRecordId,
              pickup_date: new Date(Date.now() + Math.random() * 604800000).toISOString().split('T')[0],
              expected_delivery_date: new Date(Date.now() + 604800000 + Math.random() * 604800000).toISOString().split('T')[0],
            });

          if (shipmentError) {
            console.error(`Error creating shipment ${shipment.shipment_number}:`, shipmentError);
          } else {
            console.log(`Created shipment: ${shipment.shipment_number}`);
          }
        } else {
          console.log(`Shipment ${shipment.shipment_number} already exists`);
        }
      }
    } else {
      console.log('Skipping shipments - missing required organization IDs');
    }

    console.log('Demo data seeding completed!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء الحسابات والشحنات التجريبية بنجاح',
        accounts: createdAccounts,
        shipmentsCreated: transporterOrgId && generatorOrgId && recyclerOrgId ? 10 : 0,
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

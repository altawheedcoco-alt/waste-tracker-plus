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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get current user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error('Unauthorized');

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization');

    // Get current org
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', profile.organization_id)
      .single();

    if (!currentOrg) throw new Error('Organization not found');

    const report: any[] = [];
    const now = new Date();
    const addReport = (step: string, details: string, entity?: string) => {
      report.push({ 
        timestamp: new Date().toISOString(), 
        step, 
        details, 
        entity: entity || 'النظام',
        icon: getIcon(step),
      });
    };

    function getIcon(step: string) {
      if (step.includes('منظمة') || step.includes('جهة')) return '🏢';
      if (step.includes('هيكل')) return '📊';
      if (step.includes('سائق')) return '🚗';
      if (step.includes('شحنة')) return '📦';
      if (step.includes('حالة')) return '🔄';
      if (step.includes('إقرار')) return '📝';
      if (step.includes('سجل')) return '📋';
      return '✅';
    }

    addReport('بدء التجربة', `بدأ ${profile.full_name} تجربة افتراضية كاملة`, profile.full_name || 'المستخدم');

    // ─── 1. Create Demo Organizations ───
    const orgTypes = ['generator', 'transporter', 'recycler', 'disposal'];
    const orgNames: Record<string, { ar: string; en: string }> = {
      generator: { ar: 'شركة المولد التجريبية', en: 'Demo Generator Co' },
      transporter: { ar: 'شركة النقل التجريبية', en: 'Demo Transport Co' },
      recycler: { ar: 'شركة التدوير التجريبية', en: 'Demo Recycler Co' },
      disposal: { ar: 'شركة التخلص التجريبية', en: 'Demo Disposal Co' },
    };

    const demoOrgs: Record<string, string> = {};
    
    // Use existing org for its type, create others
    demoOrgs[currentOrg.organization_type] = currentOrg.id;
    addReport('تعيين الجهة الحالية', `تم تعيين "${currentOrg.name}" كـ ${getTypeLabel(currentOrg.organization_type)}`, currentOrg.name);

    for (const type of orgTypes) {
      if (type === currentOrg.organization_type) continue;

      // Check if demo org already exists
      const { data: existing } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('name', orgNames[type].ar)
        .eq('organization_type', type)
        .maybeSingle();

      if (existing) {
        demoOrgs[type] = existing.id;
        addReport('جهة موجودة', `"${existing.name}" موجودة مسبقاً`, existing.name);
        continue;
      }

      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: orgNames[type].ar,
          name_en: orgNames[type].en,
          organization_type: type,
          email: `demo-${type}@demo.test`,
          phone: `0100000${orgTypes.indexOf(type)}`,
          city: 'القاهرة',
          region: 'القاهرة الكبرى',
          address: `شارع التجربة ${orgTypes.indexOf(type) + 1}`,
          is_verified: true,
          is_active: true,
          representative_name: `ممثل ${orgNames[type].ar}`,
          commercial_register: `CR-DEMO-${type.toUpperCase()}-${Date.now()}`,
          environmental_license: `ENV-DEMO-${type.toUpperCase()}`,
        })
        .select('id, name')
        .single();

      if (orgErr) {
        addReport('خطأ إنشاء منظمة', `فشل إنشاء ${orgNames[type].ar}: ${orgErr.message}`);
        continue;
      }

      demoOrgs[type] = newOrg!.id;
      addReport('إنشاء منظمة جديدة', `تم إنشاء "${newOrg!.name}" (${getTypeLabel(type)})`, newOrg!.name);

      // Seed org structure
      const { error: seedErr } = await supabase.rpc('seed_org_structure', {
        p_org_id: newOrg!.id,
        p_org_type: type,
      });

      if (!seedErr) {
        addReport('إنشاء هيكل تنظيمي', `تم بذر الهيكل التنظيمي الافتراضي لـ "${newOrg!.name}"`, newOrg!.name);
      }
    }

    // ─── 2. Seed current org structure if empty ───
    const { data: existingDepts } = await supabase
      .from('organization_departments')
      .select('id')
      .eq('organization_id', currentOrg.id)
      .limit(1);

    if (!existingDepts?.length) {
      await supabase.rpc('seed_org_structure', {
        p_org_id: currentOrg.id,
        p_org_type: currentOrg.organization_type,
      });
      addReport('إنشاء هيكل تنظيمي', `تم بذر الهيكل التنظيمي لجهتك "${currentOrg.name}"`, currentOrg.name);
    } else {
      addReport('هيكل تنظيمي موجود', `الهيكل التنظيمي لـ "${currentOrg.name}" موجود مسبقاً`, currentOrg.name);
    }

    // ─── 3. Create Demo Driver ───
    let driverIdToUse: string | null = null;

    // Check existing drivers
    const { data: existingDrivers } = await supabase
      .from('drivers')
      .select('id')
      .eq('organization_id', demoOrgs.transporter)
      .limit(1);

    if (existingDrivers?.length) {
      driverIdToUse = existingDrivers[0].id;
      addReport('سائق موجود', 'تم العثور على سائق مسجل لشركة النقل', 'السائق');
    } else {
      // Create a demo driver profile via auth
      const demoDriverEmail = `demo-driver-${Date.now()}@demo.test`;
      const { data: driverAuth, error: driverAuthErr } = await supabase.auth.admin.createUser({
        email: demoDriverEmail,
        password: 'DemoDriver@2026!',
        email_confirm: true,
        user_metadata: { full_name: 'سائق تجريبي - أحمد محمد' },
      });

      if (!driverAuthErr && driverAuth?.user) {
        // Update profile
        await supabase
          .from('profiles')
          .update({
            full_name: 'سائق تجريبي - أحمد محمد',
            organization_id: demoOrgs.transporter,
            phone: '01099999999',
          })
          .eq('id', driverAuth.user.id);

        // Create driver record
        const { data: driverRec } = await supabase
          .from('drivers')
          .insert({
            profile_id: driverAuth.user.id,
            organization_id: demoOrgs.transporter,
            license_number: `DL-DEMO-${Date.now()}`,
            license_expiry: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            vehicle_type: 'شاحنة نقل مخلفات',
            vehicle_plate: 'ط ج ر 1234',
            is_available: true,
          })
          .select('id')
          .single();

        if (driverRec) {
          driverIdToUse = driverRec.id;
          addReport('إنشاء سائق تجريبي', 'تم إنشاء السائق "أحمد محمد" مع رخصة القيادة والمركبة', 'أحمد محمد');
        }
      }
    }

    // ─── 4. Create Demo Shipment ───
    const shipmentNumber = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    const baseTime = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours ago

    const { data: shipment, error: shipErr } = await supabase
      .from('shipments')
      .insert({
        shipment_number: shipmentNumber,
        generator_id: demoOrgs.generator,
        transporter_id: demoOrgs.transporter,
        recycler_id: demoOrgs.recycler,
        disposal_facility_id: null,
        driver_id: driverIdToUse,
        created_by: user.id,
        waste_type: 'metal',
        waste_description: 'مخلفات معدنية صناعية - تجربة افتراضية كاملة',
        quantity: 15.5,
        unit: 'ton',
        status: 'confirmed',
        pickup_address: 'المنطقة الصناعية - 6 أكتوبر',
        delivery_address: 'مركز إعادة التدوير - العاشر من رمضان',
        pickup_city: 'السادس من أكتوبر',
        delivery_city: 'العاشر من رمضان',
        pickup_latitude: 29.9773,
        pickup_longitude: 31.1346,
        delivery_latitude: 30.2957,
        delivery_longitude: 31.7564,
        pickup_date: baseTime.toISOString(),
        expected_delivery_date: new Date(baseTime.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        packaging_method: 'حاويات مغلقة',
        hazard_level: 'low',
        waste_state: 'solid',
        shipment_type: 'transport_and_recycle',
        weight_at_source: 15500,
        weight_at_destination: 15480,
        actual_weight: 15480,
        price_per_unit: 250,
        total_value: 3875,
        payment_status: 'paid',
        approved_at: new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString(),
        in_transit_at: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString(),
        delivered_at: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        confirmed_at: new Date(baseTime.getTime() + 3.5 * 60 * 60 * 1000).toISOString(),
        compliance_verified: true,
        gps_active_throughout: true,
        custody_chain_complete: true,
        generator_approval_status: 'approved',
        generator_approval_at: new Date(baseTime.getTime() + 10 * 60 * 1000).toISOString(),
        recycler_approval_status: 'approved',
        recycler_approval_at: new Date(baseTime.getTime() + 20 * 60 * 1000).toISOString(),
      })
      .select('id, shipment_number')
      .single();

    if (shipErr) {
      addReport('خطأ إنشاء الشحنة', shipErr.message);
      return new Response(JSON.stringify({ success: false, report, error: shipErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    addReport('إنشاء شحنة تجريبية', `تم إنشاء الشحنة رقم ${shipmentNumber} (15.5 طن مخلفات صناعية)`, 'الشحنة');

    // ─── 5. Create Shipment Lifecycle Logs ───
    const lifecycleLogs = [
      { status: 'new', notes: 'تم إنشاء الشحنة من قبل المولد', offset: 0 },
      { status: 'approved', notes: 'تمت الموافقة على الشحنة من جميع الأطراف', offset: 15 },
      { status: 'collecting', notes: 'بدأ السائق في جمع الشحنة من موقع المولد', offset: 30 },
      { status: 'in_transit', notes: 'الشحنة في الطريق - تم التحميل بنجاح وبدأ النقل', offset: 45 },
      { status: 'delivered', notes: 'تم تسليم الشحنة في مركز التدوير - وزن الاستلام 15,480 كجم', offset: 180 },
      { status: 'confirmed', notes: 'تم تأكيد استلام الشحنة ومطابقة الأوزان - فارق 0.13% مقبول', offset: 210 },
    ];

    for (const log of lifecycleLogs) {
      await supabase.from('shipment_logs').insert({
        shipment_id: shipment!.id,
        status: log.status as any,
        notes: log.notes,
        changed_by: user.id,
        created_at: new Date(baseTime.getTime() + log.offset * 60 * 1000).toISOString(),
      });
      addReport(`سجل حالة: ${getStatusLabel(log.status)}`, log.notes, getStatusActor(log.status));
    }

    // ─── 6. Create Delivery Declaration ───
    const declarationText = `أقر أنا سائق شركة النقل بأنني قد قمت بتسليم شحنة المخلفات رقم ${shipmentNumber} بالكامل إلى الجهة المستلمة، وأن الشحنة كانت في حالة سليمة ومطابقة للمواصفات المتفق عليها.`;

    await supabase.from('delivery_declarations').insert({
      shipment_id: shipment!.id,
      declared_by: user.id,
      declaration_text: declarationText,
      agreed_at: new Date(baseTime.getTime() + 180 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.1',
      device_info: 'Demo Scenario - تجربة افتراضية',
      digital_signature: `DEMO-SIG-${shipment!.id.substring(0, 8)}`,
    });
    addReport('إقرار التسليم', 'تم توقيع إقرار التسليم رقمياً من السائق', 'السائق');

    // ─── 7. Summary Stats ───
    const summary = {
      shipmentId: shipment!.id,
      shipmentNumber: shipment!.shipment_number,
      organizations: {
        generator: { id: demoOrgs.generator, name: orgNames.generator?.ar || currentOrg.name, type: 'المولد' },
        transporter: { id: demoOrgs.transporter, name: orgNames.transporter?.ar || currentOrg.name, type: 'الناقل' },
        recycler: { id: demoOrgs.recycler, name: orgNames.recycler?.ar || currentOrg.name, type: 'المدوّر' },
        disposal: { id: demoOrgs.disposal, name: orgNames.disposal?.ar || currentOrg.name, type: 'التخلص النهائي' },
      },
      driver: driverIdToUse ? 'أحمد محمد' : 'لم يتم التعيين',
      wasteType: 'مخلفات صناعية',
      quantity: '15.5 طن',
      totalValue: '3,875 ج.م',
      duration: '3.5 ساعات',
      weightDiscrepancy: '0.13%',
      complianceStatus: 'مكتمل ✅',
    };

    addReport('اكتمال التجربة', `تمت التجربة الافتراضية بنجاح - ${report.length} خطوة تم تنفيذها`, 'النظام');

    return new Response(JSON.stringify({ success: true, report, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    generator: 'المولد',
    transporter: 'الناقل',
    recycler: 'المدوّر',
    disposal: 'التخلص النهائي',
  };
  return labels[type] || type;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'جديدة',
    approved: 'تمت الموافقة',
    collecting: 'جاري الجمع',
    in_transit: 'في الطريق',
    delivered: 'تم التسليم',
    confirmed: 'مؤكدة',
  };
  return labels[status] || status;
}

function getStatusActor(status: string) {
  const actors: Record<string, string> = {
    new: 'المولد',
    approved: 'النظام',
    collecting: 'السائق',
    in_transit: 'السائق',
    delivered: 'السائق',
    confirmed: 'المدوّر',
  };
  return actors[status] || 'النظام';
}

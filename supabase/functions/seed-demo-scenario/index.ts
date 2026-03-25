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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization');

    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', profile.organization_id)
      .single();

    if (!currentOrg) throw new Error('Organization not found');

    const report: any[] = [];
    const now = new Date();
    const addReport = (step: string, details: string, entity?: string, scenario?: string) => {
      report.push({
        timestamp: new Date().toISOString(),
        step,
        details,
        entity: entity || 'النظام',
        icon: getIcon(step),
        scenario: scenario || '',
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
      if (step.includes('تخلص') || step.includes('مدفن')) return '🏭';
      if (step.includes('تدوير')) return '♻️';
      return '✅';
    }

    addReport('بدء التجربة', `بدأ ${profile.full_name} تجربة افتراضية كاملة (سيناريوهين)`, profile.full_name || 'المستخدم');

    // ─── 1. Ensure Demo Organizations ───
    const orgTypes = ['generator', 'transporter', 'recycler', 'disposal'];
    const orgNames: Record<string, { ar: string; en: string }> = {
      generator: { ar: 'شركة المولد التجريبية', en: 'Demo Generator Co' },
      transporter: { ar: 'شركة النقل التجريبية', en: 'Demo Transport Co' },
      recycler: { ar: 'شركة التدوير التجريبية', en: 'Demo Recycler Co' },
      disposal: { ar: 'شركة التخلص التجريبية', en: 'Demo Disposal Co' },
    };

    const demoOrgs: Record<string, string> = {};
    demoOrgs[currentOrg.organization_type] = currentOrg.id;
    addReport('تعيين الجهة الحالية', `تم تعيين "${currentOrg.name}" كـ ${getTypeLabel(currentOrg.organization_type)}`, currentOrg.name);

    for (const type of orgTypes) {
      if (type === currentOrg.organization_type) continue;

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

      const { error: seedErr } = await supabase.rpc('seed_org_structure', {
        p_org_id: newOrg!.id,
        p_org_type: type,
      });
      if (!seedErr) {
        addReport('إنشاء هيكل تنظيمي', `تم بذر الهيكل التنظيمي لـ "${newOrg!.name}"`, newOrg!.name);
      }
    }

    // Seed current org structure if empty
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

    // ─── 2. Ensure Demo Driver ───
    let driverIdToUse: string | null = null;
    const { data: existingDrivers } = await supabase
      .from('drivers')
      .select('id')
      .eq('organization_id', demoOrgs.transporter)
      .limit(1);

    if (existingDrivers?.length) {
      driverIdToUse = existingDrivers[0].id;
      addReport('سائق موجود', 'تم العثور على سائق مسجل لشركة النقل', 'السائق');
    } else {
      const demoDriverEmail = `demo-driver-${Date.now()}@demo.test`;
      const { data: driverAuth, error: driverAuthErr } = await supabase.auth.admin.createUser({
        email: demoDriverEmail,
        password: 'DemoDriver@2026!',
        email_confirm: true,
        user_metadata: { full_name: 'سائق تجريبي - أحمد محمد' },
      });

      if (!driverAuthErr && driverAuth?.user) {
        await supabase.from('profiles').update({
          full_name: 'سائق تجريبي - أحمد محمد',
          organization_id: demoOrgs.transporter,
          phone: '01099999999',
        }).eq('user_id', driverAuth.user.id);

        const { data: driverRec } = await supabase.from('drivers').insert({
          profile_id: driverAuth.user.id,
          organization_id: demoOrgs.transporter,
          license_number: `DL-DEMO-${Date.now()}`,
          license_expiry: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vehicle_type: 'شاحنة نقل مخلفات',
          vehicle_plate: 'ط ج ر 1234',
          is_available: true,
        }).select('id').single();

        if (driverRec) {
          driverIdToUse = driverRec.id;
          addReport('إنشاء سائق تجريبي', 'تم إنشاء السائق "أحمد محمد" مع رخصة القيادة والمركبة', 'أحمد محمد');
        }
      }
    }

    // ─── Get a disposal facility ───
    const { data: disposalFacility } = await supabase
      .from('disposal_facilities')
      .select('id, name')
      .limit(1)
      .maybeSingle();

    // ═══════════════════════════════════════════════════
    // ─── SCENARIO 1: شحنة إلى المدوّر (Recycler) ───
    // ═══════════════════════════════════════════════════
    addReport('═══ السيناريو الأول ═══', 'شحنة نقل وتدوير: من المولد → الناقل → المدوّر', 'النظام', 'recycler');

    const shipNum1 = `DEMO-R-${Date.now().toString(36).toUpperCase()}`;
    const base1 = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const { data: ship1, error: shipErr1 } = await supabase.from('shipments').insert({
      shipment_number: shipNum1,
      generator_id: demoOrgs.generator,
      transporter_id: demoOrgs.transporter,
      recycler_id: demoOrgs.recycler,
      disposal_facility_id: null,
      driver_id: driverIdToUse,
      created_by: user.id,
      waste_type: 'plastic',
      waste_description: 'مخلفات بلاستيكية قابلة للتدوير - بولي إيثيلين عالي الكثافة',
      quantity: 12.8,
      unit: 'ton',
      status: 'confirmed',
      pickup_address: 'مصنع البلاستيك - المنطقة الصناعية الثالثة، 6 أكتوبر',
      delivery_address: 'مركز إعادة تدوير البلاستيك - العاشر من رمضان',
      pickup_city: 'السادس من أكتوبر',
      delivery_city: 'العاشر من رمضان',
      pickup_latitude: 29.9773,
      pickup_longitude: 31.1346,
      delivery_latitude: 30.2957,
      delivery_longitude: 31.7564,
      pickup_date: base1.toISOString(),
      expected_delivery_date: new Date(base1.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      packaging_method: 'بالات مضغوطة',
      hazard_level: 'none',
      waste_state: 'solid',
      shipment_type: 'transport_and_recycle',
      weight_at_source: 12800,
      weight_at_destination: 12790,
      actual_weight: 12790,
      price_per_unit: 180,
      total_value: 2304,
      payment_status: 'paid',
      approved_at: new Date(base1.getTime() + 10 * 60 * 1000).toISOString(),
      in_transit_at: new Date(base1.getTime() + 25 * 60 * 1000).toISOString(),
      delivered_at: new Date(base1.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      confirmed_at: new Date(base1.getTime() + 3.5 * 60 * 60 * 1000).toISOString(),
      compliance_verified: true,
      gps_active_throughout: true,
      custody_chain_complete: true,
      generator_approval_status: 'approved',
      generator_approval_at: new Date(base1.getTime() + 5 * 60 * 1000).toISOString(),
      recycler_approval_status: 'approved',
      recycler_approval_at: new Date(base1.getTime() + 15 * 60 * 1000).toISOString(),
    }).select('id, shipment_number').single();

    if (shipErr1) {
      addReport('خطأ إنشاء شحنة التدوير', shipErr1.message, 'النظام', 'recycler');
    } else {
      addReport('إنشاء شحنة التدوير', `شحنة رقم ${shipNum1} — 12.8 طن بلاستيك HDPE`, 'الشحنة', 'recycler');

      // Lifecycle logs for recycler scenario
      const logs1 = [
        { status: 'new', notes: 'إنشاء طلب شحنة بلاستيك من مصنع البولي إيثيلين', offset: 0, actor: 'المولد' },
        { status: 'approved', notes: 'موافقة المولد (5 دقائق) + المدوّر (15 دقيقة) - تطابق خطاب الترسية', offset: 15, actor: 'النظام' },
        { status: 'collecting', notes: 'وصول السائق أحمد محمد لموقع المولد - بدء التحميل والوزن', offset: 25, actor: 'السائق' },
        { status: 'in_transit', notes: 'تحميل 12.8 طن في بالات مضغوطة - صورة ميزان المصدر ✅ - بدء النقل', offset: 40, actor: 'السائق' },
        { status: 'delivered', notes: 'وصول لمركز التدوير - وزن الاستلام 12,790 كجم - فارق 0.08% مقبول', offset: 180, actor: 'السائق' },
        { status: 'confirmed', notes: 'تأكيد المدوّر للاستلام - فحص الجودة مطابق - إصدار شهادة تدوير', offset: 210, actor: 'المدوّر' },
      ];
      for (const log of logs1) {
        await supabase.from('shipment_logs').insert({
          shipment_id: ship1!.id, status: log.status as any, notes: log.notes,
          changed_by: user.id,
          created_at: new Date(base1.getTime() + log.offset * 60 * 1000).toISOString(),
        });
        addReport(`سجل حالة: ${getStatusLabel(log.status)}`, log.notes, log.actor, 'recycler');
      }

      // Delivery declaration
      await supabase.from('delivery_declarations').insert({
        shipment_id: ship1!.id,
        declared_by: user.id,
        declaration_text: `أقر أنا السائق بتسليم شحنة البلاستيك رقم ${shipNum1} كاملة إلى مركز التدوير وأن البضاعة مطابقة للمواصفات.`,
        agreed_at: new Date(base1.getTime() + 180 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.10',
        device_info: 'Demo - سيناريو التدوير',
        digital_signature: `DEMO-R-SIG-${ship1!.id.substring(0, 8)}`,
      });
      addReport('إقرار تسليم التدوير', 'توقيع إقرار التسليم رقمياً - سلسلة الحيازة مكتملة', 'السائق', 'recycler');
    }

    // ═══════════════════════════════════════════════════════
    // ─── SCENARIO 2: شحنة إلى التخلص النهائي (Disposal) ───
    // ═══════════════════════════════════════════════════════
    addReport('═══ السيناريو الثاني ═══', 'شحنة نقل وتخلص نهائي: من المولد → الناقل → مرفق التخلص', 'النظام', 'disposal');

    const shipNum2 = `DEMO-D-${Date.now().toString(36).toUpperCase()}`;
    const base2 = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const { data: ship2, error: shipErr2 } = await supabase.from('shipments').insert({
      shipment_number: shipNum2,
      generator_id: demoOrgs.generator,
      transporter_id: demoOrgs.transporter,
      recycler_id: null,
      disposal_facility_id: disposalFacility?.id || null,
      driver_id: driverIdToUse,
      created_by: user.id,
      waste_type: 'chemical',
      waste_description: 'مخلفات كيميائية خطرة - مذيبات عضوية منتهية الصلاحية',
      quantity: 5.2,
      unit: 'ton',
      status: 'confirmed',
      pickup_address: 'مصنع الدهانات والكيماويات - المنطقة الصناعية، برج العرب',
      delivery_address: disposalFacility ? `${disposalFacility.name}` : 'مدفن أبو زعبل الصحي',
      pickup_city: 'برج العرب',
      delivery_city: 'أبو زعبل',
      pickup_latitude: 31.0088,
      pickup_longitude: 29.7533,
      delivery_latitude: 30.2781,
      delivery_longitude: 31.3727,
      pickup_date: base2.toISOString(),
      expected_delivery_date: new Date(base2.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      packaging_method: 'براميل محكمة الغلق 200 لتر',
      hazard_level: 'high',
      waste_state: 'liquid',
      shipment_type: 'transport_and_dispose',
      disposal_type: 'incineration',
      weight_at_source: 5200,
      weight_at_destination: 5200,
      actual_weight: 5200,
      price_per_unit: 450,
      total_value: 2340,
      payment_status: 'paid',
      approved_at: new Date(base2.getTime() + 8 * 60 * 1000).toISOString(),
      in_transit_at: new Date(base2.getTime() + 20 * 60 * 1000).toISOString(),
      delivered_at: new Date(base2.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
      confirmed_at: new Date(base2.getTime() + 2.8 * 60 * 60 * 1000).toISOString(),
      compliance_verified: true,
      gps_active_throughout: true,
      custody_chain_complete: true,
      generator_approval_status: 'approved',
      generator_approval_at: new Date(base2.getTime() + 5 * 60 * 1000).toISOString(),
    }).select('id, shipment_number').single();

    if (shipErr2) {
      addReport('خطأ إنشاء شحنة التخلص', shipErr2.message, 'النظام', 'disposal');
    } else {
      addReport('إنشاء شحنة التخلص النهائي', `شحنة رقم ${shipNum2} — 5.2 طن مخلفات كيميائية خطرة`, 'الشحنة', 'disposal');

      const logs2 = [
        { status: 'new', notes: 'إنشاء طلب تخلص من مذيبات عضوية خطرة - تصنيف: خطر عالي 🔴', offset: 0, actor: 'المولد' },
        { status: 'approved', notes: 'موافقة المولد - التحقق من ترخيص النقل الخطر ✅ ورخصة السائق للمواد الخطرة ✅', offset: 8, actor: 'النظام' },
        { status: 'collecting', notes: 'وصول السائق - ارتداء معدات الحماية PPE - فحص البراميل (26 برميل × 200 لتر)', offset: 20, actor: 'السائق' },
        { status: 'in_transit', notes: 'تحميل 5.2 طن في حاوية مخلفات خطرة - تتبع GPS مستمر - سرعة محدودة 60 كم/س', offset: 35, actor: 'السائق' },
        { status: 'delivered', notes: `وصول لـ ${disposalFacility?.name || 'مدفن أبو زعبل'} - وزن مطابق 5,200 كجم - فحص إشعاعي سلبي`, offset: 150, actor: 'السائق' },
        { status: 'confirmed', notes: 'تأكيد الاستلام - بدء إجراءات الحرق الآمن - إصدار شهادة تخلص نهائي', offset: 168, actor: 'جهة التخلص' },
      ];
      for (const log of logs2) {
        await supabase.from('shipment_logs').insert({
          shipment_id: ship2!.id, status: log.status as any, notes: log.notes,
          changed_by: user.id,
          created_at: new Date(base2.getTime() + log.offset * 60 * 1000).toISOString(),
        });
        addReport(`سجل حالة: ${getStatusLabel(log.status)}`, log.notes, log.actor, 'disposal');
      }

      // Delivery declaration for disposal
      await supabase.from('delivery_declarations').insert({
        shipment_id: ship2!.id,
        declared_by: user.id,
        declaration_text: `أقر أنا السائق بتسليم شحنة المخلفات الكيميائية الخطرة رقم ${shipNum2} (26 برميل مذيبات عضوية) كاملة إلى مرفق التخلص النهائي وفقاً لاشتراطات قانون إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية.`,
        agreed_at: new Date(base2.getTime() + 150 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.20',
        device_info: 'Demo - سيناريو التخلص النهائي',
        digital_signature: `DEMO-D-SIG-${ship2!.id.substring(0, 8)}`,
      });
      addReport('إقرار تسليم التخلص', 'توقيع إقرار تسليم المواد الخطرة - Chain of Custody مكتملة', 'السائق', 'disposal');
    }

    // ─── Summary ───
    const summary = {
      scenarios: [
        {
          name: 'سيناريو التدوير ♻️',
          shipmentId: ship1?.id,
          shipmentNumber: ship1?.shipment_number || shipNum1,
          destination: 'المدوّر',
          wasteType: 'بلاستيك HDPE',
          quantity: '12.8 طن',
          hazardLevel: 'غير خطر',
          totalValue: '2,304 ج.م',
          duration: '3.5 ساعات',
          weightDiscrepancy: '0.08%',
          status: shipErr1 ? 'فشل ❌' : 'مكتمل ✅',
        },
        {
          name: 'سيناريو التخلص النهائي 🏭',
          shipmentId: ship2?.id,
          shipmentNumber: ship2?.shipment_number || shipNum2,
          destination: disposalFacility?.name || 'مدفن أبو زعبل',
          wasteType: 'مذيبات كيميائية خطرة',
          quantity: '5.2 طن',
          hazardLevel: 'خطر عالي 🔴',
          totalValue: '2,340 ج.م',
          duration: '2.8 ساعات',
          weightDiscrepancy: '0%',
          status: shipErr2 ? 'فشل ❌' : 'مكتمل ✅',
        },
      ],
      organizations: {
        generator: { id: demoOrgs.generator, name: orgNames.generator?.ar || currentOrg.name, type: 'المولد' },
        transporter: { id: demoOrgs.transporter, name: orgNames.transporter?.ar || currentOrg.name, type: 'الناقل' },
        recycler: { id: demoOrgs.recycler, name: orgNames.recycler?.ar || currentOrg.name, type: 'المدوّر' },
        disposal: { id: demoOrgs.disposal, name: orgNames.disposal?.ar || currentOrg.name, type: 'التخلص النهائي' },
        disposalFacility: disposalFacility ? { id: disposalFacility.id, name: disposalFacility.name, type: 'مرفق التخلص' } : null,
      },
      driver: driverIdToUse ? 'أحمد محمد' : 'لم يتم التعيين',
      complianceStatus: 'مكتمل ✅',
    };

    addReport('اكتمال التجربة', `تمت التجربة بنجاح - سيناريوهين، ${report.length} خطوة`, 'النظام');

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
  const labels: Record<string, string> = { generator: 'المولد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص النهائي' };
  return labels[type] || type;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = { new: 'جديدة', approved: 'تمت الموافقة', collecting: 'جاري الجمع', in_transit: 'في الطريق', delivered: 'تم التسليم', confirmed: 'مؤكدة' };
  return labels[status] || status;
}

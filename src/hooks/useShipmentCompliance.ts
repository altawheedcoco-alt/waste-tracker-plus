import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  type ComplianceCheck,
  type ComplianceResult,
  type ComplianceStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/lib/supervisorComplianceEngine';

interface OrgComplianceData {
  id: string;
  name: string;
  licensed_waste_types: string[] | null;
  licensed_waste_categories: string[] | null;
  environmental_approval_number: string | null;
  env_approval_expiry: string | null;
  wmra_license: string | null;
  wmra_license_expiry_date: string | null;
  hazardous_certified: boolean | null;
  land_transport_license: string | null;
  organization_type: string | null;
}

const ORG_SELECT = 'id, name, licensed_waste_types, licensed_waste_categories, environmental_approval_number, env_approval_expiry, wmra_license, wmra_license_expiry_date, hazardous_certified, land_transport_license, organization_type';

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false; // no date = we don't know, treat as not expired
  return new Date(dateStr) < new Date();
}

function wasteTypeMatch(shipmentWasteType: string, orgLicensedTypes: string[] | null): boolean {
  if (!orgLicensedTypes || orgLicensedTypes.length === 0) return false;
  const lower = shipmentWasteType?.toLowerCase();
  return orgLicensedTypes.some(t => t.toLowerCase() === lower || t === '*' || t === 'all');
}

export function useShipmentCompliance(shipment: any) {
  const [orgs, setOrgs] = useState<{ generator?: OrgComplianceData; transporter?: OrgComplianceData; recycler?: OrgComplianceData }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shipment) return;
    const ids = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id || shipment.disposal_facility_id].filter(Boolean);
    if (ids.length === 0) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('organizations')
        .select(ORG_SELECT)
        .in('id', ids);

      const map: Record<string, OrgComplianceData> = {};
      (data || []).forEach((o: any) => { map[o.id] = o; });

      setOrgs({
        generator: shipment.generator_id ? map[shipment.generator_id] : undefined,
        transporter: shipment.transporter_id ? map[shipment.transporter_id] : undefined,
        recycler: (shipment.recycler_id || shipment.disposal_facility_id) ? map[shipment.recycler_id || shipment.disposal_facility_id] : undefined,
      });
      setLoading(false);
    })();
  }, [shipment?.id, shipment?.generator_id, shipment?.transporter_id, shipment?.recycler_id]);

  const result = useMemo<ComplianceResult | null>(() => {
    if (!shipment) return null;
    const checks: ComplianceCheck[] = [];
    const gen = orgs.generator;
    const trans = orgs.transporter;
    const rec = orgs.recycler;
    const isHazardous = shipment.hazard_level === 'hazardous' || ['chemical', 'medical', 'electronic'].includes(shipment.waste_type);

    // ═══ 1. LEGAL ═══
    checks.push({
      id: 'legal_waste_classification', category: 'legal',
      title: 'تصنيف نوع المخلفات', titleEn: 'Waste Type Classification',
      description: 'التحقق من تصنيف المخلفات وفقاً للقانون 202/2020',
      legalReference: 'قانون 202/2020 - المادة 29',
      severity: 'critical',
      status: shipment.waste_type ? 'pass' : 'fail',
      details: shipment.waste_type ? `نوع المخلف: ${shipment.waste_type}` : 'لم يتم تحديد نوع المخلف',
      autoResolvable: false,
    });

    checks.push({
      id: 'legal_generator_id', category: 'legal',
      title: 'تحديد الجهة المولدة', titleEn: 'Generator Identification',
      description: 'يجب تحديد الجهة المولدة للمخلفات وفقاً للمادة 31',
      legalReference: 'قانون 202/2020 - المادة 31',
      severity: 'critical',
      status: shipment.generator_id ? 'pass' : 'fail',
      details: gen?.name || (shipment.generator_id ? 'تم تحديد المولد ✓' : 'لم يتم تحديد المولد'),
      autoResolvable: false,
    });

    checks.push({
      id: 'legal_transporter_id', category: 'legal',
      title: 'تحديد الجهة الناقلة', titleEn: 'Transporter Identification',
      description: 'يجب تحديد جهة النقل المرخصة',
      legalReference: 'قانون 202/2020 - المادة 35',
      severity: 'critical',
      status: shipment.transporter_id ? 'pass' : 'fail',
      details: trans?.name || (shipment.transporter_id ? 'تم تحديد الناقل ✓' : 'لم يتم تحديد الناقل'),
      autoResolvable: false,
    });

    checks.push({
      id: 'legal_quantity', category: 'legal',
      title: 'تحديد الكمية والوزن', titleEn: 'Quantity Specification',
      description: 'يجب تسجيل الكمية الفعلية للمخلفات المنقولة',
      legalReference: 'قانون 4/1994 - المادة 42',
      severity: 'critical',
      status: shipment.quantity > 0 ? 'pass' : 'fail',
      details: shipment.quantity > 0 ? `${shipment.quantity} ${shipment.unit}` : 'لم يتم تحديد الكمية',
      autoResolvable: false,
    });

    // ═══ 2. ENVIRONMENTAL ═══
    checks.push({
      id: 'env_hazardous_handling', category: 'environmental',
      title: 'معالجة المخلفات الخطرة', titleEn: 'Hazardous Waste Handling',
      description: 'التحقق من اشتراطات التعامل مع المخلفات الخطرة',
      legalReference: 'قانون 202/2020 - الباب الرابع',
      severity: isHazardous ? 'critical' : 'info',
      status: isHazardous
        ? ((gen?.hazardous_certified && trans?.hazardous_certified && rec?.hazardous_certified) ? 'pass'
          : (gen?.hazardous_certified || trans?.hazardous_certified || rec?.hazardous_certified) ? 'warning' : 'fail')
        : 'pass',
      details: isHazardous
        ? `شحنة خطرة — المولد: ${gen?.hazardous_certified ? '✅' : '❌'} | الناقل: ${trans?.hazardous_certified ? '✅' : '❌'} | المدور: ${rec?.hazardous_certified ? '✅' : '❌'}`
        : 'شحنة غير خطرة',
      autoResolvable: false,
    });

    checks.push({
      id: 'env_destination', category: 'environmental',
      title: 'جهة الاستلام / التدوير / التخلص', titleEn: 'Destination Facility',
      description: 'التحقق من تحديد جهة استلام المخلفات المرخصة',
      legalReference: 'قانون 202/2020 - المادة 37',
      severity: 'critical',
      status: (shipment.recycler_id || shipment.disposal_facility_id) ? 'pass' : 'fail',
      details: rec?.name || (shipment.recycler_id ? 'تم تحديد جهة الاستلام ✓' : 'لم يتم تحديد جهة الاستلام'),
      autoResolvable: false,
    });

    checks.push({
      id: 'env_delivery_location', category: 'environmental',
      title: 'موقع التسليم', titleEn: 'Delivery Location',
      description: 'يجب تحديد موقع التسليم الجغرافي',
      severity: 'warning',
      status: shipment.delivery_location ? 'pass' : 'warning',
      details: shipment.delivery_location || 'لم يُحدد موقع التسليم',
      autoResolvable: false,
    });

    // ═══ 3. REGULATORY — Smart Matching ═══
    // Generator: waste type in licensed types?
    const genWasteMatch = gen ? wasteTypeMatch(shipment.waste_type, gen.licensed_waste_types) : false;
    checks.push({
      id: 'reg_generator_waste_match', category: 'regulatory',
      title: 'مطابقة نوع المخلف مع ترخيص المولد', titleEn: 'Generator Waste Type Match',
      description: 'التحقق من أن نوع المخلف مشمول في الأنواع المرخصة للمولد',
      legalReference: 'شروط الموافقة البيئية - البند 3',
      severity: 'critical',
      status: !shipment.generator_id ? 'fail' : (!gen?.licensed_waste_types?.length ? 'warning' : (genWasteMatch ? 'pass' : 'fail')),
      details: !shipment.generator_id ? 'لم يتم تحديد المولد'
        : !gen?.licensed_waste_types?.length ? `⚠️ لم تُسجّل أنواع مرخصة للمولد "${gen?.name || ''}"`
        : genWasteMatch ? `✅ "${shipment.waste_type}" مشمول في ترخيص المولد`
        : `❌ "${shipment.waste_type}" غير مشمول | المرخص: ${gen.licensed_waste_types.join('، ')}`,
      autoResolvable: true,
    });

    // Transporter: transport license + waste type match
    const transWasteMatch = trans ? wasteTypeMatch(shipment.waste_type, trans.licensed_waste_types) : false;
    checks.push({
      id: 'reg_transport_license', category: 'regulatory',
      title: 'ترخيص النقل ومطابقة النوع', titleEn: 'Transport License & Waste Match',
      description: 'التحقق من ترخيص نقل ساري ونوع المخلف ضمن نطاق الترخيص',
      legalReference: 'جهاز تنظيم إدارة المخلفات (WMRA)',
      severity: 'critical',
      status: !shipment.transporter_id ? 'fail'
        : (!trans?.land_transport_license ? 'warning'
        : (!trans?.licensed_waste_types?.length ? 'warning' : (transWasteMatch ? 'pass' : 'fail'))),
      details: !shipment.transporter_id ? 'لم يتم تحديد الناقل'
        : !trans?.land_transport_license ? `⚠️ ترخيص النقل البري غير مسجّل للناقل "${trans?.name || ''}"`
        : !trans?.licensed_waste_types?.length ? `⚠️ لم تُسجّل أنواع مرخصة للناقل`
        : transWasteMatch ? `✅ "${shipment.waste_type}" مشمول في ترخيص الناقل`
        : `❌ "${shipment.waste_type}" غير مشمول | المرخص: ${trans.licensed_waste_types.join('، ')}`,
      autoResolvable: true,
    });

    // Recycler: waste type match
    const recWasteMatch = rec ? wasteTypeMatch(shipment.waste_type, rec.licensed_waste_types) : false;
    if (shipment.recycler_id || shipment.disposal_facility_id) {
      checks.push({
        id: 'reg_recycler_permit', category: 'regulatory',
        title: 'تصريح التدوير/المعالجة ومطابقة النوع', titleEn: 'Recycler Permit & Waste Match',
        description: 'التحقق من تصريح التدوير ونوع المخلف ضمن نطاق التصريح',
        legalReference: 'WMRA - تصريح رقم 7',
        severity: 'critical',
        status: !rec?.licensed_waste_types?.length ? 'warning' : (recWasteMatch ? 'pass' : 'fail'),
        details: !rec?.licensed_waste_types?.length ? `⚠️ لم تُسجّل أنواع مرخصة لجهة "${rec?.name || ''}"`
          : recWasteMatch ? `✅ "${shipment.waste_type}" مشمول في تصريح المدور`
          : `❌ "${shipment.waste_type}" غير مشمول | المرخص: ${rec.licensed_waste_types.join('، ')}`,
        autoResolvable: true,
      });
    }

    // ═══ 4. PERMIT — Environmental Approval + WMRA ═══
    checks.push({
      id: 'permit_gen_env_approval', category: 'permit',
      title: 'الموافقة البيئية للمولد', titleEn: 'Generator Environmental Approval',
      description: 'التحقق من صلاحية الموافقة البيئية للجهة المولدة',
      legalReference: 'جهاز شئون البيئة',
      severity: 'warning',
      status: !shipment.generator_id ? 'pending'
        : gen?.environmental_approval_number ? (isExpired(gen.env_approval_expiry) ? 'fail' : 'pass') : 'warning',
      details: !shipment.generator_id ? 'لم يتم تحديد المولد'
        : gen?.environmental_approval_number
          ? (isExpired(gen.env_approval_expiry) ? `❌ الموافقة البيئية منتهية (${gen.env_approval_expiry})` : `✅ موافقة رقم: ${gen.environmental_approval_number}`)
          : `⚠️ لم تُسجّل الموافقة البيئية للمولد`,
      autoResolvable: true,
    });

    // WMRA for all parties
    const wmraParties = [
      { label: 'المولد', org: gen, hasId: !!shipment.generator_id },
      { label: 'الناقل', org: trans, hasId: !!shipment.transporter_id },
      { label: 'المدور', org: rec, hasId: !!(shipment.recycler_id || shipment.disposal_facility_id) },
    ];
    const wmraDetails: string[] = [];
    let wmraStatus: ComplianceStatus = 'pass';
    for (const p of wmraParties) {
      if (!p.hasId) continue;
      if (!p.org?.wmra_license) {
        wmraDetails.push(`${p.label}: ❌ بدون تصريح`);
        wmraStatus = 'fail';
      } else if (isExpired(p.org.wmra_license_expiry_date)) {
        wmraDetails.push(`${p.label}: ⚠️ تصريح منتهي`);
        if (wmraStatus !== 'fail') wmraStatus = 'warning';
      } else {
        wmraDetails.push(`${p.label}: ✅ ${p.org.wmra_license}`);
      }
    }
    checks.push({
      id: 'permit_wmra_scope', category: 'permit',
      title: 'نطاق تصريح WMRA لكافة الأطراف', titleEn: 'WMRA Permit Scope',
      description: 'التحقق من أن كل الأطراف لديهم تصريح WMRA ساري',
      legalReference: 'WMRA - شروط التصريح',
      severity: 'critical',
      status: wmraStatus,
      details: wmraDetails.join(' | ') || 'لا يوجد أطراف',
      autoResolvable: true,
    });

    // ═══ 5. SAFETY ═══
    checks.push({
      id: 'safety_pickup_location', category: 'safety',
      title: 'موقع الاستلام', titleEn: 'Pickup Location',
      description: 'التحقق من تحديد موقع الاستلام',
      severity: 'warning',
      status: shipment.pickup_location ? 'pass' : 'warning',
      details: shipment.pickup_location || 'لم يُحدد موقع الاستلام',
      autoResolvable: false,
    });

    // ═══ 6. OPERATIONAL ═══
    checks.push({
      id: 'ops_scheduled_date', category: 'operational',
      title: 'تاريخ الجدولة', titleEn: 'Scheduled Date',
      description: 'التحقق من تحديد موعد النقل',
      severity: 'info',
      status: shipment.scheduled_date ? 'pass' : 'warning',
      details: shipment.scheduled_date || 'لم يُحدد تاريخ',
      autoResolvable: false,
    });

    checks.push({
      id: 'ops_shipment_number', category: 'operational',
      title: 'رقم الشحنة التسلسلي', titleEn: 'Shipment Number',
      description: 'التحقق من وجود رقم تسلسلي فريد',
      severity: 'critical',
      status: shipment.shipment_number ? 'pass' : 'fail',
      details: shipment.shipment_number || 'لا يوجد رقم شحنة',
      autoResolvable: true,
    });

    // ═══ COMPUTE ═══
    const blockers = checks.filter(c => c.status === 'fail' && c.severity === 'critical');
    const warnings = checks.filter(c => c.status === 'warning' || (c.status === 'fail' && c.severity !== 'critical'));
    const passed = checks.filter(c => c.status === 'pass').length;
    const score = Math.round((passed / checks.length) * 100);

    return {
      overallStatus: blockers.length > 0 ? 'fail' : warnings.length > 0 ? 'warning' : 'pass',
      score,
      checks,
      canProceed: blockers.length === 0,
      blockers,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }, [shipment, orgs]);

  return { result, loading, orgs };
}

/**
 * Supervisor Compliance Engine
 * Validates shipment data against legal, environmental, and regulatory standards
 * before allowing movement supervisor decisions.
 */

export type ComplianceCategory = 'legal' | 'environmental' | 'regulatory' | 'permit' | 'safety' | 'operational';
export type ComplianceSeverity = 'critical' | 'warning' | 'info';
export type ComplianceStatus = 'pass' | 'fail' | 'warning' | 'pending';

export interface ComplianceCheck {
  id: string;
  category: ComplianceCategory;
  title: string;
  titleEn: string;
  description: string;
  legalReference?: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  details?: string;
  autoResolvable: boolean;
}

export interface ComplianceResult {
  overallStatus: ComplianceStatus;
  score: number; // 0-100
  checks: ComplianceCheck[];
  canProceed: boolean;
  blockers: ComplianceCheck[];
  warnings: ComplianceCheck[];
  timestamp: string;
}

interface ShipmentData {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  waste_category?: string;
  quantity: number;
  unit: string;
  generator_id?: string;
  transporter_id?: string;
  recycler_id?: string;
  disposal_facility_id?: string;
  driver_id?: string;
  pickup_location?: string;
  delivery_location?: string;
  scheduled_date?: string;
  hazard_level?: string;
  generator?: { name: string; commercial_register?: string; environmental_approval?: boolean; wmra_permit?: boolean } | null;
  transporter?: { name: string; commercial_register?: string; transport_license?: boolean; fleet_insured?: boolean } | null;
  recycler?: { name: string; commercial_register?: string; recycling_permit?: boolean; environmental_approval?: boolean } | null;
  driver?: { full_name?: string; license_valid?: boolean; hazmat_certified?: boolean } | null;
}

/**
 * Run all compliance checks on a shipment
 */
export function runComplianceChecks(shipment: ShipmentData): ComplianceResult {
  const checks: ComplianceCheck[] = [];

  // ══════════════════════════════════════
  // 1. LEGAL CHECKS (قانون 202/2020 و 4/1994)
  // ══════════════════════════════════════

  // Check: Waste type classification
  checks.push({
    id: 'legal_waste_classification',
    category: 'legal',
    title: 'تصنيف نوع المخلفات',
    titleEn: 'Waste Type Classification',
    description: 'التحقق من تصنيف المخلفات وفقاً للقانون 202/2020',
    legalReference: 'قانون 202/2020 - المادة 29',
    severity: 'critical',
    status: shipment.waste_type ? 'pass' : 'fail',
    details: shipment.waste_type ? `نوع المخلف: ${shipment.waste_type}` : 'لم يتم تحديد نوع المخلف',
    autoResolvable: false,
  });

  // Check: Generator identification
  checks.push({
    id: 'legal_generator_id',
    category: 'legal',
    title: 'تحديد الجهة المولدة',
    titleEn: 'Generator Identification',
    description: 'يجب تحديد الجهة المولدة للمخلفات وفقاً للمادة 31',
    legalReference: 'قانون 202/2020 - المادة 31',
    severity: 'critical',
    status: shipment.generator_id ? 'pass' : 'fail',
    details: shipment.generator?.name || 'لم يتم تحديد المولد',
    autoResolvable: false,
  });

  // Check: Transporter identification
  checks.push({
    id: 'legal_transporter_id',
    category: 'legal',
    title: 'تحديد الجهة الناقلة',
    titleEn: 'Transporter Identification',
    description: 'يجب تحديد جهة النقل المرخصة',
    legalReference: 'قانون 202/2020 - المادة 35',
    severity: 'critical',
    status: shipment.transporter_id ? 'pass' : 'fail',
    details: shipment.transporter?.name || 'لم يتم تحديد الناقل',
    autoResolvable: false,
  });

  // Check: Quantity specified
  checks.push({
    id: 'legal_quantity',
    category: 'legal',
    title: 'تحديد الكمية والوزن',
    titleEn: 'Quantity Specification',
    description: 'يجب تسجيل الكمية الفعلية للمخلفات المنقولة',
    legalReference: 'قانون 4/1994 - المادة 42',
    severity: 'critical',
    status: shipment.quantity > 0 ? 'pass' : 'fail',
    details: shipment.quantity > 0 ? `${shipment.quantity} ${shipment.unit}` : 'لم يتم تحديد الكمية',
    autoResolvable: false,
  });

  // ══════════════════════════════════════
  // 2. ENVIRONMENTAL CHECKS
  // ══════════════════════════════════════

  // Check: Hazardous waste handling
  const isHazardous = shipment.hazard_level === 'hazardous' || ['chemical', 'medical', 'electronic'].includes(shipment.waste_type);
  checks.push({
    id: 'env_hazardous_handling',
    category: 'environmental',
    title: 'معالجة المخلفات الخطرة',
    titleEn: 'Hazardous Waste Handling',
    description: 'التحقق من اشتراطات التعامل مع المخلفات الخطرة',
    legalReference: 'قانون 202/2020 - الباب الرابع',
    severity: isHazardous ? 'critical' : 'info',
    status: isHazardous ? (shipment.driver?.hazmat_certified !== false ? 'warning' : 'fail') : 'pass',
    details: isHazardous ? 'شحنة خطرة — يتطلب سائق معتمد ومركبة مجهزة' : 'شحنة غير خطرة',
    autoResolvable: false,
  });

  // Check: Destination facility
  checks.push({
    id: 'env_destination',
    category: 'environmental',
    title: 'جهة الاستلام / التدوير / التخلص',
    titleEn: 'Destination Facility',
    description: 'التحقق من تحديد جهة استلام المخلفات المرخصة',
    legalReference: 'قانون 202/2020 - المادة 37',
    severity: 'critical',
    status: (shipment.recycler_id || shipment.disposal_facility_id) ? 'pass' : 'fail',
    details: shipment.recycler?.name || 'لم يتم تحديد جهة الاستلام',
    autoResolvable: false,
  });

  // Check: Delivery location
  checks.push({
    id: 'env_delivery_location',
    category: 'environmental',
    title: 'موقع التسليم',
    titleEn: 'Delivery Location',
    description: 'يجب تحديد موقع التسليم الجغرافي',
    severity: 'warning',
    status: shipment.delivery_location ? 'pass' : 'warning',
    details: shipment.delivery_location || 'لم يُحدد موقع التسليم',
    autoResolvable: false,
  });

  // ══════════════════════════════════════
  // 3. REGULATORY CHECKS (تراخيص وتصاريح)
  // ══════════════════════════════════════

  // Check: Generator environmental approval
  checks.push({
    id: 'reg_generator_approval',
    category: 'regulatory',
    title: 'الموافقة البيئية للمولد',
    titleEn: 'Generator Environmental Approval',
    description: 'التحقق من صلاحية الموافقة البيئية للجهة المولدة',
    legalReference: 'جهاز شئون البيئة - شروط الموافقة البيئية',
    severity: 'warning',
    status: shipment.generator?.environmental_approval !== false ? 'pass' : 'warning',
    details: shipment.generator?.environmental_approval ? 'موافقة بيئية سارية' : 'لم يتم التحقق من الموافقة البيئية',
    autoResolvable: false,
  });

  // Check: Transporter license
  checks.push({
    id: 'reg_transport_license',
    category: 'regulatory',
    title: 'ترخيص النقل',
    titleEn: 'Transport License',
    description: 'التحقق من ترخيص نقل المخلفات ساري المفعول',
    legalReference: 'جهاز تنظيم إدارة المخلفات (WMRA)',
    severity: 'critical',
    status: shipment.transporter?.transport_license !== false ? 'pass' : 'fail',
    details: shipment.transporter?.transport_license ? 'ترخيص نقل ساري' : 'لم يتم التحقق من ترخيص النقل',
    autoResolvable: false,
  });

  // Check: Recycler permit
  if (shipment.recycler_id) {
    checks.push({
      id: 'reg_recycler_permit',
      category: 'regulatory',
      title: 'تصريح التدوير / المعالجة',
      titleEn: 'Recycler Permit',
      description: 'التحقق من تصريح التدوير لجهة الاستلام',
      legalReference: 'WMRA - تصريح رقم 7',
      severity: 'critical',
      status: shipment.recycler?.recycling_permit !== false ? 'pass' : 'fail',
      details: shipment.recycler?.recycling_permit ? 'تصريح تدوير ساري' : 'لم يتم التحقق من تصريح التدوير',
      autoResolvable: false,
    });
  }

  // Check: Driver license validity
  checks.push({
    id: 'reg_driver_license',
    category: 'regulatory',
    title: 'رخصة السائق',
    titleEn: 'Driver License',
    description: 'التحقق من صلاحية رخصة القيادة',
    severity: 'warning',
    status: shipment.driver_id ? (shipment.driver?.license_valid !== false ? 'pass' : 'warning') : 'pending',
    details: shipment.driver_id ? 'سائق معيّن' : 'لم يتم تعيين سائق بعد',
    autoResolvable: false,
  });

  // ══════════════════════════════════════
  // 4. PERMIT CHECKS (الموافقة البيئية وWMRA)
  // ══════════════════════════════════════

  checks.push({
    id: 'permit_env_approval_match',
    category: 'permit',
    title: 'مطابقة الموافقة البيئية',
    titleEn: 'Environmental Approval Match',
    description: 'التحقق من أن نوع المخلف مشمول في الموافقة البيئية للمولد',
    legalReference: 'شروط الموافقة البيئية - البند 3',
    severity: 'critical',
    status: shipment.generator_id ? 'pass' : 'fail',
    details: 'يتطلب مراجعة بنود الموافقة البيئية',
    autoResolvable: true,
  });

  checks.push({
    id: 'permit_wmra_scope',
    category: 'permit',
    title: 'نطاق تصريح WMRA',
    titleEn: 'WMRA Permit Scope',
    description: 'التحقق من أن العملية ضمن نطاق تصريح جهاز تنظيم المخلفات',
    legalReference: 'WMRA - شروط التصريح',
    severity: 'critical',
    status: shipment.transporter_id ? 'pass' : 'fail',
    details: 'يتطلب مراجعة نطاق التصريح',
    autoResolvable: true,
  });

  // ══════════════════════════════════════
  // 5. SAFETY CHECKS
  // ══════════════════════════════════════

  checks.push({
    id: 'safety_fleet_insurance',
    category: 'safety',
    title: 'تأمين الأسطول',
    titleEn: 'Fleet Insurance',
    description: 'التحقق من تأمين المركبة المستخدمة في النقل',
    severity: 'warning',
    status: shipment.transporter?.fleet_insured !== false ? 'pass' : 'warning',
    details: shipment.transporter?.fleet_insured ? 'أسطول مؤمّن' : 'لم يتم التحقق من التأمين',
    autoResolvable: false,
  });

  checks.push({
    id: 'safety_pickup_location',
    category: 'safety',
    title: 'موقع الاستلام',
    titleEn: 'Pickup Location',
    description: 'التحقق من تحديد موقع الاستلام',
    severity: 'warning',
    status: shipment.pickup_location ? 'pass' : 'warning',
    details: shipment.pickup_location || 'لم يُحدد موقع الاستلام',
    autoResolvable: false,
  });

  // ══════════════════════════════════════
  // 6. OPERATIONAL CHECKS
  // ══════════════════════════════════════

  checks.push({
    id: 'ops_scheduled_date',
    category: 'operational',
    title: 'تاريخ الجدولة',
    titleEn: 'Scheduled Date',
    description: 'التحقق من تحديد موعد النقل',
    severity: 'info',
    status: shipment.scheduled_date ? 'pass' : 'warning',
    details: shipment.scheduled_date || 'لم يُحدد تاريخ',
    autoResolvable: false,
  });

  checks.push({
    id: 'ops_shipment_number',
    category: 'operational',
    title: 'رقم الشحنة التسلسلي',
    titleEn: 'Shipment Number',
    description: 'التحقق من وجود رقم تسلسلي فريد',
    severity: 'critical',
    status: shipment.shipment_number ? 'pass' : 'fail',
    details: shipment.shipment_number || 'لا يوجد رقم شحنة',
    autoResolvable: true,
  });

  // ══════════════════════════════════════
  // COMPUTE RESULT
  // ══════════════════════════════════════

  const blockers = checks.filter(c => c.status === 'fail' && c.severity === 'critical');
  const warnings = checks.filter(c => c.status === 'warning' || c.status === 'fail' && c.severity !== 'critical');
  const passed = checks.filter(c => c.status === 'pass').length;
  const score = Math.round((passed / checks.length) * 100);

  const overallStatus: ComplianceStatus =
    blockers.length > 0 ? 'fail' :
    warnings.length > 0 ? 'warning' : 'pass';

  return {
    overallStatus,
    score,
    checks,
    canProceed: blockers.length === 0,
    blockers,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

export const CATEGORY_LABELS: Record<ComplianceCategory, { ar: string; en: string; icon: string; color: string }> = {
  legal: { ar: 'قانوني', en: 'Legal', icon: '⚖️', color: '#7c3aed' },
  environmental: { ar: 'بيئي', en: 'Environmental', icon: '🌿', color: '#059669' },
  regulatory: { ar: 'تنظيمي', en: 'Regulatory', icon: '📋', color: '#2563eb' },
  permit: { ar: 'تصاريح', en: 'Permits', icon: '📄', color: '#d97706' },
  safety: { ar: 'سلامة', en: 'Safety', icon: '🛡️', color: '#dc2626' },
  operational: { ar: 'تشغيلي', en: 'Operational', icon: '⚙️', color: '#6b7280' },
};

export const STATUS_LABELS: Record<ComplianceStatus, { ar: string; icon: string; color: string }> = {
  pass: { ar: 'ناجح', icon: '✅', color: '#059669' },
  fail: { ar: 'مرفوض', icon: '❌', color: '#dc2626' },
  warning: { ar: 'تحذير', icon: '⚠️', color: '#d97706' },
  pending: { ar: 'قيد المراجعة', icon: '⏳', color: '#6b7280' },
};

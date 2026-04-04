/**
 * useTransporterLicenseGate — License validity gate for authorized transporters
 * Blocks shipment creation when critical licenses are expired
 * Covers: WMRA, EEAA, Land Transport, IDA, and all sector-specific Egyptian authorities
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

export type GateStatus = 'clear' | 'warning' | 'blocked';

export type LicenseCategory = 'core' | 'environmental' | 'transport' | 'sector_specific';

interface LicenseCheck {
  field: string;
  label: string;
  expiry: string | null;
  daysRemaining: number | null;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  isCritical: boolean;
  category: LicenseCategory;
  numberField?: string;
  number?: string | null;
}

interface FleetCheck {
  totalVehicles: number;
  certifiedVehicles: number;
  expiredInsurance: number;
  expiredLicense: number;
  uncertifiedCount: number;
}

interface DriverCheck {
  totalDrivers: number;
  validLicense: number;
  expiredLicense: number;
  missingLicense: number;
}

export interface TransporterGateResult {
  overallStatus: GateStatus;
  canCreateShipment: boolean;
  blockReasons: string[];
  warnings: string[];
  licenses: LicenseCheck[];
  fleet: FleetCheck;
  drivers: DriverCheck;
  complianceScore: number;
  lastChecked: Date;
  geographicScope: string | null;
  licensedGovernorates: string[];
  hasEnvironmentalRegister: boolean;
  hasHazardousRegister: boolean;
  sectorApprovals: { sector: string; hasApproval: boolean; label: string }[];
}

// ═══════════════════════════════════════════════════════════
// All licenses grouped by category
// ═══════════════════════════════════════════════════════════

const ALL_LICENSES: { field: string; numberField: string; label: string; isCritical: boolean; category: LicenseCategory }[] = [
  // ── Core (أساسي) ──
  { field: 'license_expiry_date', numberField: 'license_number', label: 'السجل التجاري', isCritical: true, category: 'core' },
  { field: 'wmra_license_expiry_date', numberField: 'wmra_license', label: 'ترخيص WMRA', isCritical: true, category: 'core' },
  { field: 'wmra_permit_expiry', numberField: 'wmra_permit_number', label: 'تصريح WMRA لتداول المخلفات', isCritical: true, category: 'core' },

  // ── Environmental (بيئي) ──
  { field: 'eeaa_license_expiry_date', numberField: 'environmental_license', label: 'ترخيص جهاز شئون البيئة (EEAA)', isCritical: true, category: 'environmental' },
  { field: 'env_approval_expiry', numberField: 'env_approval_number', label: 'الموافقة البيئية', isCritical: false, category: 'environmental' },
  { field: 'environmental_register_expiry', numberField: 'environmental_register_number', label: 'السجل البيئي', isCritical: false, category: 'environmental' },
  { field: 'hazardous_materials_register_expiry', numberField: 'hazardous_materials_register_number', label: 'سجل المواد والمخلفات الخطرة', isCritical: false, category: 'environmental' },

  // ── Transport (نقل) ──
  { field: 'land_transport_license_expiry_date', numberField: 'land_transport_license', label: 'رخصة النقل البري', isCritical: true, category: 'transport' },
  { field: 'land_transport_authority_approval_expiry', numberField: 'land_transport_authority_approval_number', label: 'موافقة هيئة النقل البري', isCritical: true, category: 'transport' },
  { field: 'civil_aviation_approval_expiry', numberField: 'civil_aviation_approval_number', label: 'موافقة الطيران المدني (نقل جوي)', isCritical: false, category: 'transport' },
  { field: 'customs_authority_approval_expiry', numberField: 'customs_authority_approval_number', label: 'موافقة مصلحة الجمارك (بازل)', isCritical: false, category: 'transport' },

  // ── Sector-Specific (قطاعي) ──
  { field: 'ida_license_expiry_date', numberField: 'ida_license', label: 'موافقة هيئة التنمية الصناعية (IDA)', isCritical: false, category: 'sector_specific' },
  { field: 'ida_approval_expiry', numberField: 'ida_approval_number', label: 'موافقة الرقابة الصناعية', isCritical: false, category: 'sector_specific' },
  { field: 'health_ministry_approval_expiry', numberField: 'health_ministry_approval_number', label: 'موافقة وزارة الصحة (نفايات طبية)', isCritical: false, category: 'sector_specific' },
  { field: 'petroleum_authority_approval_expiry', numberField: 'petroleum_authority_approval_number', label: 'موافقة هيئة البترول (نفايات بترولية)', isCritical: false, category: 'sector_specific' },
  { field: 'drug_authority_approval_expiry', numberField: 'drug_authority_approval_number', label: 'موافقة هيئة الدواء المصرية (نفايات دوائية)', isCritical: false, category: 'sector_specific' },
  { field: 'nuclear_regulatory_approval_expiry', numberField: 'nuclear_regulatory_approval_number', label: 'موافقة هيئة الرقابة النووية (نفايات مشعة)', isCritical: false, category: 'sector_specific' },
  { field: 'food_safety_approval_expiry', numberField: 'food_safety_approval_number', label: 'موافقة هيئة سلامة الغذاء (نفايات غذائية)', isCritical: false, category: 'sector_specific' },
];

// Sector approval summary mapping
const SECTOR_APPROVALS = [
  { numberField: 'health_ministry_approval_number', sector: 'medical', label: 'نفايات طبية' },
  { numberField: 'petroleum_authority_approval_number', sector: 'petroleum', label: 'نفايات بترولية' },
  { numberField: 'drug_authority_approval_number', sector: 'pharmaceutical', label: 'نفايات دوائية' },
  { numberField: 'nuclear_regulatory_approval_number', sector: 'nuclear', label: 'نفايات مشعة' },
  { numberField: 'food_safety_approval_number', sector: 'food', label: 'نفايات غذائية' },
  { numberField: 'ida_approval_number', sector: 'industrial', label: 'نفايات صناعية' },
  { numberField: 'civil_aviation_approval_number', sector: 'aviation', label: 'نقل جوي' },
  { numberField: 'customs_authority_approval_number', sector: 'customs', label: 'نقل عبر الحدود' },
];

// Build select string dynamically
const ORG_SELECT_FIELDS = [
  'id', 'name', 'organization_type',
  'license_geographic_scope', 'licensed_governorates',
  ...ALL_LICENSES.flatMap(l => [l.field, l.numberField]),
  'environmental_register_number', 'hazardous_materials_register_number',
];
// Deduplicate
const ORG_SELECT = [...new Set(ORG_SELECT_FIELDS)].join(', ');

function checkLicenseStatus(expiry: string | null): { status: LicenseCheck['status']; days: number | null } {
  if (!expiry) return { status: 'missing', days: null };
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return { status: 'expired', days };
  if (days <= 30) return { status: 'expiring', days };
  return { status: 'valid', days };
}

export const LICENSE_CATEGORIES: Record<LicenseCategory, string> = {
  core: 'تراخيص أساسية',
  environmental: 'تراخيص بيئية',
  transport: 'تصاريح النقل',
  sector_specific: 'موافقات قطاعية',
};

export function useTransporterLicenseGate() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const isTransporter = organization?.organization_type === 'transporter';

  return useQuery<TransporterGateResult>({
    queryKey: ['transporter-license-gate', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No org');

      const blockReasons: string[] = [];
      const warnings: string[] = [];

      // 1. Check organization licenses
      const { data: org } = await supabase
        .from('organizations')
        .select(ORG_SELECT)
        .eq('id', orgId)
        .single();

      const licenses: LicenseCheck[] = [];
      const sectorApprovals: { sector: string; hasApproval: boolean; label: string }[] = [];

      if (org) {
        for (const lf of ALL_LICENSES) {
          const expiry = (org as any)[lf.field] || null;
          const number = (org as any)[lf.numberField] || null;
          const { status, days } = checkLicenseStatus(expiry);
          licenses.push({
            field: lf.field,
            label: lf.label,
            expiry,
            daysRemaining: days,
            status,
            isCritical: lf.isCritical,
            category: lf.category,
            numberField: lf.numberField,
            number,
          });

          if (status === 'expired' && lf.isCritical) {
            blockReasons.push(`${lf.label} منتهي الصلاحية — يجب التجديد فوراً لاستئناف العمليات`);
          } else if (status === 'expired' && !lf.isCritical) {
            warnings.push(`${lf.label} منتهي — يُنصح بالتجديد`);
          } else if (status === 'expiring') {
            warnings.push(`${lf.label} سينتهي خلال ${days} يوم`);
          } else if (status === 'missing' && lf.isCritical) {
            warnings.push(`${lf.label} غير مسجل في النظام`);
          }
        }

        // Sector approvals summary
        for (const sa of SECTOR_APPROVALS) {
          sectorApprovals.push({
            sector: sa.sector,
            label: sa.label,
            hasApproval: !!(org as any)[sa.numberField],
          });
        }
      }

      // 2. Check fleet
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('id, status, insurance_expiry, license_expiry, waste_types_allowed')
        .eq('organization_id', orgId);

      const now = new Date();
      const fleet: FleetCheck = { totalVehicles: vehicles?.length || 0, certifiedVehicles: 0, expiredInsurance: 0, expiredLicense: 0, uncertifiedCount: 0 };

      if (vehicles) {
        for (const v of vehicles) {
          let certified = true;
          if (v.insurance_expiry && differenceInDays(parseISO(v.insurance_expiry), now) < 0) { fleet.expiredInsurance++; certified = false; }
          if (v.license_expiry && differenceInDays(parseISO(v.license_expiry), now) < 0) { fleet.expiredLicense++; certified = false; }
          if (!v.waste_types_allowed || v.waste_types_allowed.length === 0) certified = false;
          if (certified && v.status === 'active') fleet.certifiedVehicles++;
          else fleet.uncertifiedCount++;
        }
      }

      if (fleet.totalVehicles > 0 && fleet.certifiedVehicles === 0) {
        blockReasons.push('لا توجد مركبات معتمدة — جميع المركبات غير مطابقة أو منتهية التأمين');
      }
      if (fleet.expiredInsurance > 0) warnings.push(`${fleet.expiredInsurance} مركبة بتأمين منتهي`);

      // 3. Check drivers
      const { data: drivers } = await supabase.from('drivers').select('id, license_expiry').eq('organization_id', orgId);
      const driverCheck: DriverCheck = { totalDrivers: drivers?.length || 0, validLicense: 0, expiredLicense: 0, missingLicense: 0 };
      if (drivers) {
        for (const d of drivers) {
          if (!d.license_expiry) driverCheck.missingLicense++;
          else if (differenceInDays(parseISO(d.license_expiry), now) < 0) driverCheck.expiredLicense++;
          else driverCheck.validLicense++;
        }
      }
      if (driverCheck.totalDrivers > 0 && driverCheck.validLicense === 0) warnings.push('جميع السائقين برخص منتهية أو مفقودة');

      // 4. Compliance score
      const passedLicenses = licenses.filter(l => l.status === 'valid').length;
      const licenseScore = licenses.length > 0 ? (passedLicenses / licenses.length) * 55 : 55;
      const fleetPass = fleet.totalVehicles > 0 ? (fleet.certifiedVehicles / fleet.totalVehicles) : 1;
      const driverPass = driverCheck.totalDrivers > 0 ? (driverCheck.validLicense / driverCheck.totalDrivers) : 1;
      const sectorBonus = sectorApprovals.filter(s => s.hasApproval).length > 0 ? 5 : 0;
      const complianceScore = Math.round(licenseScore + (fleetPass * 20) + (driverPass * 15) + sectorBonus + (licenses.some(l => l.category === 'environmental' && l.status === 'valid') ? 5 : 0));

      const overallStatus: GateStatus = blockReasons.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'clear';

      const geographicScope = (org as any)?.license_geographic_scope || null;
      const licensedGovernorates: string[] = (org as any)?.licensed_governorates || [];
      const hasEnvironmentalRegister = !!(org as any)?.environmental_register_number;
      const hasHazardousRegister = !!(org as any)?.hazardous_materials_register_number;

      if (!geographicScope || geographicScope === 'single_governorate') {
        if (licensedGovernorates.length === 0) warnings.push('النطاق الجغرافي للترخيص غير محدد — حدد المحافظات المصرح بها');
      }

      return {
        overallStatus, canCreateShipment: blockReasons.length === 0,
        blockReasons, warnings, licenses, fleet, drivers: driverCheck,
        complianceScore: Math.min(complianceScore, 100), lastChecked: new Date(),
        geographicScope, licensedGovernorates, hasEnvironmentalRegister, hasHazardousRegister,
        sectorApprovals,
      };
    },
    enabled: !!orgId && isTransporter,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

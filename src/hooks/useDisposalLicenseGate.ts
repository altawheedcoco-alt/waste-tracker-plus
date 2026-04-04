/**
 * useDisposalLicenseGate — License validity gate for disposal facilities
 * Blocks operations when critical licenses are expired
 * Covers: WMRA, EEAA, EIA, incineration, landfill, chemical treatment, emissions, and sector-specific
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

export type GateStatus = 'clear' | 'warning' | 'blocked';

export type DisposalLicenseCategory = 'core' | 'environmental' | 'disposal_ops' | 'safety' | 'sector_specific';

interface LicenseCheck {
  field: string;
  label: string;
  expiry: string | null;
  daysRemaining: number | null;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  isCritical: boolean;
  category: DisposalLicenseCategory;
  numberField?: string;
  number?: string | null;
}

export interface DisposalGateResult {
  overallStatus: GateStatus;
  canAcceptWaste: boolean;
  blockReasons: string[];
  warnings: string[];
  licenses: LicenseCheck[];
  complianceScore: number;
  lastChecked: Date;
  facilityType: string | null;
  sectorApprovals: { sector: string; hasApproval: boolean; label: string }[];
}

// ═══════════════════════════════════════════════════════════
// All disposal licenses grouped by category
// ═══════════════════════════════════════════════════════════

const ALL_LICENSES: { field: string; numberField: string; label: string; isCritical: boolean; category: DisposalLicenseCategory }[] = [
  // ── Core (أساسي) ──
  { field: 'license_expiry_date', numberField: 'license_number', label: 'السجل التجاري', isCritical: true, category: 'core' },
  { field: 'wmra_license_expiry_date', numberField: 'wmra_license', label: 'ترخيص WMRA', isCritical: true, category: 'core' },
  { field: 'wmra_permit_expiry', numberField: 'wmra_permit_number', label: 'تصريح WMRA لتداول المخلفات', isCritical: true, category: 'core' },

  // ── Environmental (بيئي) ──
  { field: 'eeaa_license_expiry_date', numberField: 'environmental_license', label: 'ترخيص جهاز شئون البيئة (EEAA)', isCritical: true, category: 'environmental' },
  { field: 'eia_certificate_expiry', numberField: 'eia_certificate_number', label: 'شهادة تقييم الأثر البيئي (EIA)', isCritical: true, category: 'environmental' },
  { field: 'env_approval_expiry', numberField: 'env_approval_number', label: 'الموافقة البيئية', isCritical: false, category: 'environmental' },
  { field: 'environmental_register_expiry', numberField: 'environmental_register_number', label: 'السجل البيئي', isCritical: false, category: 'environmental' },
  { field: 'hazardous_materials_register_expiry', numberField: 'hazardous_materials_register_number', label: 'سجل المواد والمخلفات الخطرة', isCritical: false, category: 'environmental' },
  { field: 'emissions_permit_expiry', numberField: 'emissions_permit_number', label: 'تصريح الانبعاثات الهوائية', isCritical: false, category: 'environmental' },
  { field: 'industrial_discharge_permit_expiry', numberField: 'industrial_discharge_permit_number', label: 'تصريح الصرف الصناعي', isCritical: false, category: 'environmental' },
  { field: 'groundwater_monitoring_license_expiry', numberField: 'groundwater_monitoring_license_number', label: 'ترخيص رصد المياه الجوفية', isCritical: false, category: 'environmental' },

  // ── Disposal Operations (عمليات التخلص) ──
  { field: 'incineration_permit_expiry', numberField: 'incineration_permit_number', label: 'تصريح الحرق', isCritical: false, category: 'disposal_ops' },
  { field: 'landfill_license_expiry', numberField: 'landfill_license_number', label: 'ترخيص المدفن الصحي', isCritical: false, category: 'disposal_ops' },
  { field: 'chemical_treatment_permit_expiry', numberField: 'chemical_treatment_permit_number', label: 'تصريح المعالجة الكيميائية', isCritical: false, category: 'disposal_ops' },
  { field: 'temp_storage_permit_expiry', numberField: 'temp_storage_permit_number', label: 'تصريح التخزين المؤقت', isCritical: false, category: 'disposal_ops' },

  // ── Safety (سلامة) ──
  { field: 'civil_defense_approval_expiry', numberField: 'civil_defense_approval_number', label: 'موافقة الحماية المدنية', isCritical: false, category: 'safety' },
  { field: 'occupational_safety_approval_expiry', numberField: 'occupational_safety_approval_number', label: 'السلامة والصحة المهنية', isCritical: false, category: 'safety' },
  { field: 'governorate_activity_license_expiry', numberField: 'governorate_activity_license_number', label: 'ترخيص المحافظة المختصة', isCritical: false, category: 'safety' },

  // ── Sector-Specific (قطاعي) ──
  { field: 'health_ministry_approval_expiry', numberField: 'health_ministry_approval_number', label: 'موافقة وزارة الصحة (نفايات طبية)', isCritical: false, category: 'sector_specific' },
  { field: 'petroleum_authority_approval_expiry', numberField: 'petroleum_authority_approval_number', label: 'موافقة هيئة البترول (نفايات بترولية)', isCritical: false, category: 'sector_specific' },
  { field: 'drug_authority_approval_expiry', numberField: 'drug_authority_approval_number', label: 'موافقة هيئة الدواء (نفايات دوائية)', isCritical: false, category: 'sector_specific' },
  { field: 'nuclear_regulatory_approval_expiry', numberField: 'nuclear_regulatory_approval_number', label: 'موافقة الرقابة النووية (نفايات مشعة)', isCritical: false, category: 'sector_specific' },
  { field: 'radiation_protection_license_expiry', numberField: 'radiation_protection_license_number', label: 'ترخيص الوقاية الإشعاعية', isCritical: false, category: 'sector_specific' },
  { field: 'food_safety_approval_expiry', numberField: 'food_safety_approval_number', label: 'موافقة سلامة الغذاء (نفايات غذائية)', isCritical: false, category: 'sector_specific' },
  { field: 'veterinary_quarantine_approval_expiry', numberField: 'veterinary_quarantine_approval_number', label: 'موافقة المحاجر البيطرية', isCritical: false, category: 'sector_specific' },
  { field: 'ida_approval_expiry', numberField: 'ida_approval_number', label: 'موافقة الرقابة الصناعية', isCritical: false, category: 'sector_specific' },
];

const SECTOR_APPROVALS = [
  { numberField: 'health_ministry_approval_number', sector: 'medical', label: 'نفايات طبية' },
  { numberField: 'petroleum_authority_approval_number', sector: 'petroleum', label: 'نفايات بترولية' },
  { numberField: 'drug_authority_approval_number', sector: 'pharmaceutical', label: 'نفايات دوائية' },
  { numberField: 'nuclear_regulatory_approval_number', sector: 'nuclear', label: 'نفايات مشعة' },
  { numberField: 'radiation_protection_license_number', sector: 'radiation', label: 'وقاية إشعاعية' },
  { numberField: 'food_safety_approval_number', sector: 'food', label: 'نفايات غذائية' },
  { numberField: 'veterinary_quarantine_approval_number', sector: 'veterinary', label: 'محاجر بيطرية' },
  { numberField: 'ida_approval_number', sector: 'industrial', label: 'نفايات صناعية' },
  { numberField: 'incineration_permit_number', sector: 'incineration', label: 'حرق' },
  { numberField: 'landfill_license_number', sector: 'landfill', label: 'دفن صحي' },
  { numberField: 'chemical_treatment_permit_number', sector: 'chemical', label: 'معالجة كيميائية' },
];

const ORG_SELECT_FIELDS = [
  'id', 'name', 'organization_type', 'registered_activity',
  ...ALL_LICENSES.flatMap(l => [l.field, l.numberField]),
];
const ORG_SELECT = [...new Set(ORG_SELECT_FIELDS)].join(', ');

function checkLicenseStatus(expiry: string | null): { status: LicenseCheck['status']; days: number | null } {
  if (!expiry) return { status: 'missing', days: null };
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return { status: 'expired', days };
  if (days <= 30) return { status: 'expiring', days };
  return { status: 'valid', days };
}

export const DISPOSAL_LICENSE_CATEGORIES: Record<DisposalLicenseCategory, string> = {
  core: 'تراخيص أساسية',
  environmental: 'تراخيص بيئية وانبعاثات',
  disposal_ops: 'تصاريح عمليات التخلص',
  safety: 'السلامة والتراخيص المحلية',
  sector_specific: 'موافقات قطاعية',
};

export function useDisposalLicenseGate() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const isDisposal = organization?.organization_type === 'disposal';

  return useQuery<DisposalGateResult>({
    queryKey: ['disposal-license-gate', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('No org');

      const { data: org, error } = await (supabase as any)
        .from('organizations')
        .select(ORG_SELECT)
        .eq('id', orgId)
        .single();

      if (error || !org) throw new Error('Failed to load org');

      // Check all licenses
      const licenses: LicenseCheck[] = ALL_LICENSES.map(l => {
        const { status, days } = checkLicenseStatus(org[l.field] as string | null);
        return {
          field: l.field,
          label: l.label,
          expiry: org[l.field] as string | null,
          daysRemaining: days,
          status,
          isCritical: l.isCritical,
          category: l.category,
          numberField: l.numberField,
          number: org[l.numberField] as string | null,
        };
      });

      const blockReasons: string[] = [];
      const warnings: string[] = [];

      licenses.forEach(l => {
        if (l.status === 'expired' && l.isCritical) blockReasons.push(`${l.label} منتهي الصلاحية`);
        else if (l.status === 'expired') warnings.push(`${l.label} منتهي الصلاحية`);
        else if (l.status === 'expiring') warnings.push(`${l.label} ينتهي خلال ${l.daysRemaining} يوم`);
      });

      const overallStatus: GateStatus = blockReasons.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'clear';

      // Compliance score
      const filled = licenses.filter(l => l.number);
      const valid = licenses.filter(l => l.status === 'valid' || l.status === 'expiring');
      const complianceScore = filled.length > 0 ? Math.round((valid.length / filled.length) * 100) : 0;

      // Sector approvals
      const sectorApprovals = SECTOR_APPROVALS.map(s => ({
        sector: s.sector,
        hasApproval: !!(org[s.numberField] as string | null),
        label: s.label,
      }));

      return {
        overallStatus,
        canAcceptWaste: blockReasons.length === 0,
        blockReasons,
        warnings,
        licenses,
        complianceScore,
        lastChecked: new Date(),
        facilityType: org.registered_activity || null,
        sectorApprovals,
      };
    },
    enabled: !!orgId && isDisposal,
    staleTime: 5 * 60 * 1000,
  });
}

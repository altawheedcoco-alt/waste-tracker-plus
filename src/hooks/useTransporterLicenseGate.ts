/**
 * useTransporterLicenseGate — License validity gate for authorized transporters
 * Blocks shipment creation when critical licenses are expired
 * Checks: WMRA permit, environmental approval, land transport license, general license
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

export type GateStatus = 'clear' | 'warning' | 'blocked';

interface LicenseCheck {
  field: string;
  label: string;
  expiry: string | null;
  daysRemaining: number | null;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  isCritical: boolean; // Critical = blocks shipment creation
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
  complianceScore: number; // 0-100
  lastChecked: Date;
  geographicScope: string | null;
  licensedGovernorates: string[];
  hasEnvironmentalRegister: boolean;
  hasHazardousRegister: boolean;
}

// Critical licenses that BLOCK shipment creation if expired
const CRITICAL_LICENSES = [
  { field: 'wmra_permit_expiry', label: 'تصريح WMRA لتداول المخلفات', isCritical: true },
  { field: 'wmra_license_expiry_date', label: 'ترخيص WMRA', isCritical: true },
  { field: 'land_transport_license_expiry_date', label: 'رخصة النقل البري', isCritical: true },
  { field: 'license_expiry_date', label: 'الترخيص العام', isCritical: true },
  { field: 'eeaa_license_expiry_date', label: 'ترخيص جهاز شئون البيئة', isCritical: false },
  { field: 'env_approval_expiry', label: 'الموافقة البيئية', isCritical: false },
  { field: 'ida_license_expiry_date', label: 'ترخيص هيئة التنمية الصناعية', isCritical: false },
];

function checkLicenseStatus(expiry: string | null, isCritical: boolean): { status: LicenseCheck['status']; days: number | null } {
  if (!expiry) return { status: 'missing', days: null };
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return { status: 'expired', days };
  if (days <= 30) return { status: 'expiring', days };
  return { status: 'valid', days };
}

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
        .select('id, name, organization_type, license_expiry_date, wmra_license_expiry_date, wmra_permit_expiry, eeaa_license_expiry_date, env_approval_expiry, ida_license_expiry_date, land_transport_license_expiry_date')
        .eq('id', orgId)
        .single();

      const licenses: LicenseCheck[] = [];
      if (org) {
        for (const lf of CRITICAL_LICENSES) {
          const expiry = (org as any)[lf.field] || null;
          const { status, days } = checkLicenseStatus(expiry, lf.isCritical);
          licenses.push({
            field: lf.field,
            label: lf.label,
            expiry,
            daysRemaining: days,
            status,
            isCritical: lf.isCritical,
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
      }

      // 2. Check fleet vehicles
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('id, status, insurance_expiry, license_expiry, waste_types_allowed')
        .eq('organization_id', orgId);

      const now = new Date();
      const fleet: FleetCheck = {
        totalVehicles: vehicles?.length || 0,
        certifiedVehicles: 0,
        expiredInsurance: 0,
        expiredLicense: 0,
        uncertifiedCount: 0,
      };

      if (vehicles) {
        for (const v of vehicles) {
          let certified = true;
          if (v.insurance_expiry && differenceInDays(parseISO(v.insurance_expiry), now) < 0) {
            fleet.expiredInsurance++;
            certified = false;
          }
          if (v.license_expiry && differenceInDays(parseISO(v.license_expiry), now) < 0) {
            fleet.expiredLicense++;
            certified = false;
          }
          if (!v.waste_types_allowed || v.waste_types_allowed.length === 0) {
            certified = false;
          }
          if (certified && v.status === 'active') {
            fleet.certifiedVehicles++;
          } else {
            fleet.uncertifiedCount++;
          }
        }
      }

      if (fleet.totalVehicles > 0 && fleet.certifiedVehicles === 0) {
        blockReasons.push('لا توجد مركبات معتمدة — جميع المركبات غير مطابقة أو منتهية التأمين');
      }
      if (fleet.expiredInsurance > 0) {
        warnings.push(`${fleet.expiredInsurance} مركبة بتأمين منتهي`);
      }

      // 3. Check drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, license_expiry')
        .eq('organization_id', orgId);

      const driverCheck: DriverCheck = {
        totalDrivers: drivers?.length || 0,
        validLicense: 0,
        expiredLicense: 0,
        missingLicense: 0,
      };

      if (drivers) {
        for (const d of drivers) {
          if (!d.license_expiry) {
            driverCheck.missingLicense++;
          } else if (differenceInDays(parseISO(d.license_expiry), now) < 0) {
            driverCheck.expiredLicense++;
          } else {
            driverCheck.validLicense++;
          }
        }
      }

      if (driverCheck.totalDrivers > 0 && driverCheck.validLicense === 0) {
        warnings.push('جميع السائقين برخص منتهية أو مفقودة');
      }

      // 4. Calculate compliance score
      const totalChecks = licenses.length + (fleet.totalVehicles > 0 ? 1 : 0) + (driverCheck.totalDrivers > 0 ? 1 : 0);
      const passedLicenses = licenses.filter(l => l.status === 'valid').length;
      const fleetPass = fleet.totalVehicles > 0 ? (fleet.certifiedVehicles / fleet.totalVehicles) : 1;
      const driverPass = driverCheck.totalDrivers > 0 ? (driverCheck.validLicense / driverCheck.totalDrivers) : 1;

      const licenseScore = licenses.length > 0 ? (passedLicenses / licenses.length) * 60 : 60;
      const fleetScore = fleetPass * 25;
      const driverScore = driverPass * 15;
      const complianceScore = Math.round(licenseScore + fleetScore + driverScore);

      const overallStatus: GateStatus = blockReasons.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'clear';

      return {
        overallStatus,
        canCreateShipment: blockReasons.length === 0,
        blockReasons,
        warnings,
        licenses,
        fleet,
        drivers: driverCheck,
        complianceScore,
        lastChecked: new Date(),
      };
    },
    enabled: !!orgId && isTransporter,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

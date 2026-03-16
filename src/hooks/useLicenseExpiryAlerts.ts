/**
 * useLicenseExpiryAlerts — Proactive license/permit expiration monitoring
 * Scans organization licenses and alerts at 90/60/30/7 day thresholds
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

export type AlertSeverity = 'expired' | 'critical' | 'warning' | 'info';

export interface LicenseAlert {
  id: string;
  licenseType: string;
  licenseLabel: string;
  licenseNumber: string | null;
  expiryDate: string;
  daysRemaining: number;
  severity: AlertSeverity;
  orgId: string;
  orgName: string;
  orgType: string;
  actionRequired: string;
}

// All license fields to scan across organizations table
const ORG_LICENSE_FIELDS = [
  { field: 'license_expiry', label: 'الترخيص العام', number: 'license_number' },
  { field: 'wmra_license_expiry', label: 'تصريح WMRA', number: 'wmra_license_number' },
  { field: 'eia_permit_expiry', label: 'تقييم الأثر البيئي (EIA)', number: 'eia_permit_number' },
  { field: 'hazardous_license_expiry', label: 'ترخيص المخلفات الخطرة', number: 'hazardous_license_number' },
  { field: 'operation_license_expiry', label: 'رخصة التشغيل', number: 'operation_license_number' },
  { field: 'activity_specific_license_expiry', label: 'ترخيص النشاط التخصصي', number: 'activity_specific_license_number' },
];

// Driver license fields
const DRIVER_LICENSE_FIELDS = [
  { field: 'license_expiry', label: 'رخصة القيادة', number: 'license_number' },
  { field: 'hazmat_license_expiry', label: 'رخصة نقل المواد الخطرة', number: 'hazmat_license_number' },
];

function getSeverity(daysRemaining: number): AlertSeverity {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'info';
}

function getActionRequired(severity: AlertSeverity, label: string): string {
  switch (severity) {
    case 'expired': return `${label} منتهي الصلاحية — يجب التجديد فوراً`;
    case 'critical': return `${label} سينتهي خلال أيام — بادر بالتجديد`;
    case 'warning': return `${label} سينتهي خلال 30 يوم — خطط للتجديد`;
    case 'info': return `${label} سينتهي خلال 90 يوم — متابعة`;
  }
}

export function useLicenseExpiryAlerts() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['license-expiry-alerts', orgId],
    queryFn: async (): Promise<LicenseAlert[]> => {
      if (!orgId) return [];
      const alerts: LicenseAlert[] = [];
      const today = new Date();

      // 1. Scan own organization licenses
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, organization_type, license_expiry, license_number, wmra_license_expiry, wmra_license_number, eia_permit_expiry, eia_permit_number, hazardous_license_expiry, hazardous_license_number, operation_license_expiry, operation_license_number, activity_specific_license_expiry, activity_specific_license_number')
        .eq('id', orgId)
        .single();

      if (org) {
        for (const lf of ORG_LICENSE_FIELDS) {
          const expiry = (org as any)[lf.field];
          if (!expiry) continue;
          const days = differenceInDays(parseISO(expiry), today);
          if (days <= 90) {
            const severity = getSeverity(days);
            alerts.push({
              id: `${org.id}-${lf.field}`,
              licenseType: lf.field,
              licenseLabel: lf.label,
              licenseNumber: (org as any)[lf.number] || null,
              expiryDate: expiry,
              daysRemaining: days,
              severity,
              orgId: org.id,
              orgName: org.name || '',
              orgType: org.organization_type || '',
              actionRequired: getActionRequired(severity, lf.label),
            });
          }
        }
      }

      // 2. Scan drivers linked to org
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, full_name, license_expiry, license_number, hazmat_license_expiry, hazmat_license_number, organization_id')
        .eq('organization_id', orgId);

      if (drivers) {
        for (const driver of drivers) {
          for (const lf of DRIVER_LICENSE_FIELDS) {
            const expiry = (driver as any)[lf.field];
            if (!expiry) continue;
            const days = differenceInDays(parseISO(expiry), today);
            if (days <= 90) {
              const severity = getSeverity(days);
              alerts.push({
                id: `driver-${driver.id}-${lf.field}`,
                licenseType: lf.field,
                licenseLabel: `${lf.label} — ${driver.full_name || 'سائق'}`,
                licenseNumber: (driver as any)[lf.number] || null,
                expiryDate: expiry,
                daysRemaining: days,
                severity,
                orgId: orgId,
                orgName: driver.full_name || 'سائق',
                orgType: 'driver',
                actionRequired: getActionRequired(severity, lf.label),
              });
            }
          }
        }
      }

      // Sort by severity (expired first, then critical, warning, info)
      const severityOrder: Record<AlertSeverity, number> = { expired: 0, critical: 1, warning: 2, info: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.daysRemaining - b.daysRemaining);

      return alerts;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useLicenseAlertsSummary() {
  const { data: alerts = [] } = useLicenseExpiryAlerts();
  return {
    total: alerts.length,
    expired: alerts.filter(a => a.severity === 'expired').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    hasUrgent: alerts.some(a => a.severity === 'expired' || a.severity === 'critical'),
  };
}

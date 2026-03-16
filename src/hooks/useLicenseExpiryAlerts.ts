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

// Organization license fields (matching actual DB schema)
const ORG_LICENSE_FIELDS = [
  { field: 'license_expiry_date', label: 'الترخيص العام', number: 'license_number' },
  { field: 'wmra_license_expiry_date', label: 'ترخيص WMRA', number: 'wmra_license' },
  { field: 'wmra_permit_expiry', label: 'تصريح WMRA', number: 'wmra_permit_number' },
  { field: 'eeaa_license_expiry_date', label: 'ترخيص جهاز شئون البيئة', number: 'environmental_license' },
  { field: 'env_approval_expiry', label: 'الموافقة البيئية', number: 'env_approval_number' },
  { field: 'ida_license_expiry_date', label: 'ترخيص هيئة التنمية الصناعية', number: 'ida_license' },
  { field: 'land_transport_license_expiry_date', label: 'رخصة النقل البري', number: 'land_transport_license' },
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
        .select('id, name, organization_type, license_expiry_date, license_number, wmra_license_expiry_date, wmra_license, wmra_permit_expiry, wmra_permit_number, eeaa_license_expiry_date, environmental_license, env_approval_expiry, env_approval_number, ida_license_expiry_date, ida_license, land_transport_license_expiry_date, land_transport_license')
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

      // 2. Scan drivers linked to org (drivers table has license_expiry)
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, license_expiry, license_number, organization_id, profile_id, profiles(full_name)')
        .eq('organization_id', orgId);

      if (drivers) {
        for (const driver of drivers) {
          const expiry = driver.license_expiry;
          if (!expiry) continue;
          const days = differenceInDays(parseISO(expiry), today);
          if (days <= 90) {
            const severity = getSeverity(days);
            const driverName = (driver as any).profiles?.full_name || 'سائق';
            alerts.push({
              id: `driver-${driver.id}-license`,
              licenseType: 'driver_license',
              licenseLabel: `رخصة القيادة — ${driverName}`,
              licenseNumber: driver.license_number || null,
              expiryDate: expiry,
              daysRemaining: days,
              severity,
              orgId: orgId,
              orgName: driverName,
              orgType: 'driver',
              actionRequired: getActionRequired(severity, 'رخصة القيادة'),
            });
          }
        }
      }

      // Sort: expired first, then critical, warning, info
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

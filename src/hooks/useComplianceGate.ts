import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';

export interface ComplianceStatus {
  isCompliant: boolean;
  hasExpiredLicenses: boolean;
  expiredCount: number;
  expiringCount: number;
  activeCount: number;
  totalCount: number;
  score: number;
  expiredLicenses: any[];
  blockOperations: boolean;
  message: string;
}

/**
 * Hook that checks legal compliance status for the current organization.
 * Can be used to gate operations (e.g., prevent issuing manifests when licenses are expired).
 */
export const useComplianceGate = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: status, isLoading } = useQuery({
    queryKey: ['compliance-gate', orgId],
    queryFn: async (): Promise<ComplianceStatus> => {
      if (!orgId) return {
        isCompliant: false, hasExpiredLicenses: false, expiredCount: 0,
        expiringCount: 0, activeCount: 0, totalCount: 0, score: 0,
        expiredLicenses: [], blockOperations: false, message: 'لا توجد منظمة',
      };

      const { data: licenses, error } = await supabase
        .from('legal_licenses')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;

      const all = licenses || [];
      const total = all.length;

      if (total === 0) {
        return {
          isCompliant: true, hasExpiredLicenses: false, expiredCount: 0,
          expiringCount: 0, activeCount: 0, totalCount: 0, score: 0,
          expiredLicenses: [], blockOperations: false, message: 'لم يتم إضافة تراخيص بعد',
        };
      }

      const expired: any[] = [];
      let expiring = 0;
      let active = 0;

      all.forEach((lic: any) => {
        if (!lic.expiry_date) { active++; return; }
        const days = differenceInDays(new Date(lic.expiry_date), new Date());
        if (days < 0) expired.push(lic);
        else if (days <= 30) expiring++;
        else active++;
      });

      const score = total > 0 ? Math.round((active / total) * 100) : 0;

      // Critical licenses that block operations when expired
      const criticalCategories = ['wmra', 'eeaa', 'commercial_register', 'hazardous_handling'];
      const criticalExpired = expired.filter((l: any) => criticalCategories.includes(l.license_category));
      const blockOperations = criticalExpired.length > 0;

      let message = 'ممتثل بالكامل';
      if (blockOperations) {
        message = `⛔ تراخيص سيادية منتهية (${criticalExpired.map((l: any) => l.license_name).join('، ')}) - العمليات معلقة`;
      } else if (expired.length > 0) {
        message = `تراخيص منتهية: ${expired.length}`;
      } else if (expiring > 0) {
        message = `تراخيص تنتهي قريباً: ${expiring}`;
      }

      return {
        isCompliant: expired.length === 0,
        hasExpiredLicenses: expired.length > 0,
        expiredCount: expired.length,
        expiringCount: expiring,
        activeCount: active,
        totalCount: total,
        score,
        expiredLicenses: expired,
        blockOperations,
        message,
      };
    },
    enabled: !!orgId,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    status: status || {
      isCompliant: true, hasExpiredLicenses: false, expiredCount: 0,
      expiringCount: 0, activeCount: 0, totalCount: 0, score: 0,
      expiredLicenses: [], blockOperations: false, message: '',
    },
    isLoading,
  };
};

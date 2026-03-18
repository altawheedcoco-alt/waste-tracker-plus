import { useCallback, useMemo } from 'react';
import { usePartnerRestrictions, RestrictionType, RESTRICTION_TYPES } from './usePartnerRestrictions';
import { toast } from 'sonner';

/**
 * محرك فرض التقييدات المركزي
 * يوفر واجهة موحدة للتحقق من التقييدات قبل تنفيذ أي إجراء مرتبط بالشركاء
 */

/** خريطة ربط الإجراءات التشغيلية بأنواع التقييد */
const ACTION_RESTRICTION_MAP: Record<string, RestrictionType[]> = {
  create_shipment: ['block_shipments', 'suspend_partnership', 'blacklist', 'block_all'],
  create_invoice: ['block_invoices', 'suspend_partnership', 'blacklist', 'block_all'],
  send_message: ['block_messaging', 'suspend_partnership', 'blacklist', 'block_all'],
  share_document: ['block_documents', 'suspend_partnership', 'blacklist', 'block_all'],
  view_data: ['block_visibility', 'blacklist', 'block_all'],
  share_link: ['block_visibility', 'suspend_partnership', 'blacklist', 'block_all'],
};

export type EnforceableAction = keyof typeof ACTION_RESTRICTION_MAP;

/** نتيجة فحص التقييد */
export interface RestrictionCheckResult {
  allowed: boolean;
  blockedBy: RestrictionType[];
  message: string;
}

export function useRestrictionEnforcer() {
  const { restrictions, isRestricted, getActiveRestrictions, restrictionsAgainstUs } = usePartnerRestrictions();

  /**
   * فحص ما إذا كان إجراء معين مسموحاً تجاه جهة معينة
   */
  const checkAction = useCallback(
    (orgId: string, action: EnforceableAction): RestrictionCheckResult => {
      const requiredRestrictions = ACTION_RESTRICTION_MAP[action] || [];
      const activeRestrictions = getActiveRestrictions(orgId);

      const blockedBy = activeRestrictions.filter(r => requiredRestrictions.includes(r));

      if (blockedBy.length === 0) {
        return { allowed: true, blockedBy: [], message: '' };
      }

      const labels = blockedBy
        .map(r => RESTRICTION_TYPES.find(rt => rt.type === r)?.label || r)
        .join('، ');

      return {
        allowed: false,
        blockedBy,
        message: `🚫 لا يمكن تنفيذ هذا الإجراء — تقييد نشط: ${labels}`,
      };
    },
    [getActiveRestrictions]
  );

  /**
   * تنفيذ إجراء مع فحص التقييد أولاً — يعرض تنبيه تلقائياً عند الحظر
   */
  const enforceAction = useCallback(
    (orgId: string, action: EnforceableAction, onAllowed: () => void) => {
      const result = checkAction(orgId, action);
      if (result.allowed) {
        onAllowed();
      } else {
        toast.error(result.message, { duration: 5000 });
      }
      return result;
    },
    [checkAction]
  );

  /**
   * فحص ما إذا كانت جهة ما قد فرضت علينا تقييداً معيناً
   */
  const isRestrictedAgainstUs = useCallback(
    (orgId: string, type?: RestrictionType): boolean => {
      return restrictionsAgainstUs.some(
        r =>
          r.organization_id === orgId &&
          r.is_active &&
          (type ? r.restriction_type === type || r.restriction_type === 'block_all' : true)
      );
    },
    [restrictionsAgainstUs]
  );

  /**
   * التقييدات التي تنتهي صلاحيتها خلال أيام محددة
   */
  const getExpiringRestrictions = useCallback(
    (withinDays: number = 7) => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

      return restrictions.filter(r => {
        if (!r.expires_at || !r.is_active) return false;
        const expiryDate = new Date(r.expires_at);
        return expiryDate > now && expiryDate <= futureDate;
      });
    },
    [restrictions]
  );

  /**
   * إحصائيات سريعة للتقييدات
   */
  const stats = useMemo(() => {
    const active = restrictions.filter(r => r.is_active);
    const expiringSoon = getExpiringRestrictions(7);
    const againstUs = restrictionsAgainstUs.filter(r => r.is_active);

    return {
      totalActive: active.length,
      expiringSoon: expiringSoon.length,
      restrictedAgainstUs: againstUs.length,
      byType: RESTRICTION_TYPES.reduce(
        (acc, rt) => {
          acc[rt.type] = active.filter(r => r.restriction_type === rt.type).length;
          return acc;
        },
        {} as Record<RestrictionType, number>
      ),
    };
  }, [restrictions, restrictionsAgainstUs, getExpiringRestrictions]);

  return {
    checkAction,
    enforceAction,
    isRestricted,
    isRestrictedAgainstUs,
    getExpiringRestrictions,
    stats,
    restrictions,
    restrictionsAgainstUs,
  };
}

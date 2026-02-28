/**
 * Convenience wrappers that fire impact-chain events
 * from various parts of the platform.
 *
 * Usage: call the returned helper *after* the main operation succeeds.
 */
import { useCallback } from 'react';
import { useRecordImpact } from '@/hooks/useImpactChain';

export const useImpactRecorder = () => {
  const recordImpact = useRecordImpact();

  /** After a shipment is created */
  const recordShipmentCreated = useCallback(
    (shipmentId: string, meta?: Record<string, any>) => {
      recordImpact.mutate({
        chainKey: 'shipment_lifecycle',
        stepKey: 'create',
        resourceType: 'shipment',
        resourceId: shipmentId,
        actionLabel: 'إنشاء شحنة جديدة',
        resultLabel: 'تم إنشاء الشحنة وإشعار الأطراف',
        impactLabel: 'بدء دورة حياة شحنة جديدة',
        impactData: meta || {},
      });
    },
    [recordImpact],
  );

  /** After a deposit is recorded */
  const recordDepositCreated = useCallback(
    (depositId: string, amount: number, meta?: Record<string, any>) => {
      recordImpact.mutate({
        chainKey: 'deposit_flow',
        stepKey: 'record',
        resourceType: 'deposit',
        resourceId: depositId,
        actionLabel: 'تسجيل إيداع مالي',
        resultLabel: `تم تسجيل إيداع بقيمة ${amount}`,
        impactLabel: 'تحديث الرصيد المالي للشريك',
        impactData: { amount, ...meta },
      });
    },
    [recordImpact],
  );

  /** After an SOS emergency is sent */
  const recordEmergencySent = useCallback(
    (emergencyId: string, emergencyType: string, meta?: Record<string, any>) => {
      recordImpact.mutate({
        chainKey: 'shipment_lifecycle',
        stepKey: 'emergency',
        resourceType: 'driver_emergency',
        resourceId: emergencyId,
        actionLabel: 'نداء طوارئ',
        resultLabel: `طوارئ: ${emergencyType}`,
        impactLabel: 'تنبيه الإدارة لحالة طوارئ',
        impactData: { emergencyType, ...meta },
      });
    },
    [recordImpact],
  );

  /** After shipment status changes */
  const recordShipmentStatusChange = useCallback(
    (shipmentId: string, newStatus: string, meta?: Record<string, any>) => {
      const stepMap: Record<string, string> = {
        in_transit: 'pickup',
        delivered: 'deliver',
        confirmed: 'confirm',
        completed: 'confirm',
      };
      const stepKey = stepMap[newStatus] || newStatus;

      recordImpact.mutate({
        chainKey: 'shipment_lifecycle',
        stepKey,
        resourceType: 'shipment',
        resourceId: shipmentId,
        actionLabel: `تغيير حالة الشحنة إلى ${newStatus}`,
        resultLabel: `الحالة الجديدة: ${newStatus}`,
        impactLabel: 'تقدم في دورة حياة الشحنة',
        impactData: { newStatus, ...meta },
      });
    },
    [recordImpact],
  );

  return {
    recordShipmentCreated,
    recordDepositCreated,
    recordEmergencySent,
    recordShipmentStatusChange,
  };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import FakeGPSDetector, { SpoofDetectionResult } from '@/lib/fakeGPSDetector';
import { supabase } from '@/integrations/supabase/client';

interface UseFakeGPSDetectionOptions {
  driverId: string;
  enabled: boolean;
  /** Block app if spoofing detected at this risk level or above */
  blockThreshold?: SpoofDetectionResult['riskLevel'];
  /** Notify admin on detection */
  notifyAdmin?: boolean;
}

interface FakeGPSDetectionState {
  lastResult: SpoofDetectionResult | null;
  isBlocked: boolean;
  integrityCheck: { tampered: boolean; reason?: string } | null;
  totalAlerts: number;
}

/**
 * Hook that integrates FakeGPSDetector with the app,
 * blocks the driver UI when spoofing is detected, and notifies admin.
 */
export function useFakeGPSDetection({
  driverId,
  enabled,
  blockThreshold = 'high',
  notifyAdmin = true,
}: UseFakeGPSDetectionOptions) {
  const [state, setState] = useState<FakeGPSDetectionState>({
    lastResult: null,
    isBlocked: false,
    integrityCheck: null,
    totalAlerts: 0,
  });

  const detectorRef = useRef(new FakeGPSDetector());
  const alertCountRef = useRef(0);

  const riskLevels: SpoofDetectionResult['riskLevel'][] = ['safe', 'low', 'medium', 'high', 'critical'];

  const isAtOrAboveThreshold = useCallback((level: SpoofDetectionResult['riskLevel']) => {
    return riskLevels.indexOf(level) >= riskLevels.indexOf(blockThreshold);
  }, [blockThreshold]);

  // Run initial integrity check
  useEffect(() => {
    if (!enabled) return;

    FakeGPSDetector.checkGeolocationIntegrity().then((result) => {
      setState(prev => ({ ...prev, integrityCheck: result }));

      if (result.tampered) {
        setState(prev => ({
          ...prev,
          isBlocked: true,
          lastResult: {
            isSuspicious: true,
            confidence: 90,
            reasons: [result.reason || 'تم اكتشاف تلاعب في واجهة الموقع'],
            riskLevel: 'critical',
          },
        }));

        if (notifyAdmin && driverId) {
          logSpoofAlert(driverId, 'integrity_check', result.reason || 'API tampered');
        }
      }
    });
  }, [enabled, driverId, notifyAdmin]);

  // Analyze a position
  const analyzePosition = useCallback((position: GeolocationPosition): SpoofDetectionResult => {
    const result = detectorRef.current.analyze(position);

    setState(prev => {
      const shouldBlock = isAtOrAboveThreshold(result.riskLevel);
      return {
        ...prev,
        lastResult: result,
        isBlocked: shouldBlock ? true : prev.isBlocked,
        totalAlerts: result.isSuspicious ? prev.totalAlerts + 1 : prev.totalAlerts,
      };
    });

    // Notify admin on high-risk detection
    if (result.isSuspicious && isAtOrAboveThreshold(result.riskLevel) && notifyAdmin && driverId) {
      alertCountRef.current++;
      // Throttle notifications (max 1 every 5 minutes)
      if (alertCountRef.current <= 1 || alertCountRef.current % 10 === 0) {
        logSpoofAlert(driverId, 'position_analysis', result.reasons.join('; '), result.confidence);
      }
    }

    return result;
  }, [driverId, notifyAdmin, isAtOrAboveThreshold]);

  // Reset block (admin override)
  const resetBlock = useCallback(() => {
    detectorRef.current.reset();
    alertCountRef.current = 0;
    setState({
      lastResult: null,
      isBlocked: false,
      integrityCheck: null,
      totalAlerts: 0,
    });
  }, []);

  return {
    ...state,
    analyzePosition,
    resetBlock,
  };
}

/** Log spoof alert to database and notify admins */
async function logSpoofAlert(
  driverId: string,
  detectionType: string,
  details: string,
  confidence?: number
) {
  try {
    // Get driver info with profile name
    const { data: driver } = await supabase
      .from('drivers')
      .select('organization_id, profiles:profile_id(full_name)')
      .eq('id', driverId)
      .single();

    if (!driver) return;

    const driverName = (driver as any).profiles?.full_name || 'سائق غير معروف';

    // Log the incident
    await supabase.from('transport_incidents').insert({
      organization_id: driver.organization_id,
      incident_type: 'security',
      severity: confidence && confidence >= 70 ? 'critical' : 'high',
      title: '🚨 كشف تزييف موقع GPS',
      description: `السائق: ${driverName}\nنوع الكشف: ${detectionType}\nالتفاصيل: ${details}\nالثقة: ${confidence ?? 'N/A'}%`,
      status: 'open',
    });

    // Notify admin users
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', driver.organization_id);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        title: '🚨 تنبيه أمني: تزييف GPS',
        message: `تم اكتشاف محاولة تزييف موقع من السائق ${driverName}. التفاصيل: ${details}`,
        type: 'security_alert',
      }));
      await supabase.from('notifications').insert(notifications);
    }
  } catch (err) {
    console.error('[FakeGPS] Failed to log alert:', err);
  }
}

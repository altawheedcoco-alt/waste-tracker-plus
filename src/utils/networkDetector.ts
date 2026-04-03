/**
 * كشف سرعة الشبكة وتحديد الجودة المناسبة
 * يدعم Network Information API + fallback بالقياس
 */

export type NetworkSpeed = 'slow' | 'medium' | 'fast';

export interface NetworkInfo {
  speed: NetworkSpeed;
  downlinkMbps: number;
  effectiveType: string;
  rtt: number;
}

/** حدود السرعة */
const SPEED_THRESHOLDS = {
  slow: 1.5,   // أقل من 1.5 Mbps
  medium: 5,   // 1.5 - 5 Mbps
  // أكثر من 5 = fast
};

/**
 * كشف سرعة الشبكة باستخدام Network Information API
 */
export const detectNetworkSpeed = (): NetworkInfo => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (conn) {
    const downlink = conn.downlink || 10; // Mbps
    const effectiveType = conn.effectiveType || '4g';
    const rtt = conn.rtt || 50;

    let speed: NetworkSpeed = 'fast';
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < SPEED_THRESHOLDS.slow) {
      speed = 'slow';
    } else if (effectiveType === '3g' || downlink < SPEED_THRESHOLDS.medium) {
      speed = 'medium';
    }

    return { speed, downlinkMbps: downlink, effectiveType, rtt };
  }

  // Fallback: افتراض medium
  return { speed: 'medium', downlinkMbps: 3, effectiveType: 'unknown', rtt: 100 };
};

/**
 * قياس سرعة الشبكة الفعلية بتحميل ملف صغير
 */
export const measureNetworkSpeed = async (): Promise<NetworkInfo> => {
  // حاول Network API أولاً
  const apiResult = detectNetworkSpeed();
  if (apiResult.effectiveType !== 'unknown') {
    return apiResult;
  }

  // Fallback: قياس بتحميل ملف صغير
  try {
    const testUrl = 'https://www.google.com/favicon.ico';
    const startTime = performance.now();
    const response = await fetch(testUrl, { cache: 'no-store', mode: 'no-cors' });
    const endTime = performance.now();

    const rtt = endTime - startTime;
    let speed: NetworkSpeed = 'fast';
    if (rtt > 500) speed = 'slow';
    else if (rtt > 200) speed = 'medium';

    return { speed, downlinkMbps: rtt < 200 ? 5 : rtt < 500 ? 2 : 0.5, effectiveType: 'measured', rtt };
  } catch {
    return { speed: 'medium', downlinkMbps: 3, effectiveType: 'fallback', rtt: 100 };
  }
};

/**
 * جودة الفيديو المناسبة حسب الشبكة
 */
export const getVideoQualityForNetwork = (networkSpeed: NetworkSpeed) => {
  switch (networkSpeed) {
    case 'slow':
      return { maxWidth: 480, crf: 32, label: '480p', audioBitrate: '64k' };
    case 'medium':
      return { maxWidth: 720, crf: 28, label: '720p', audioBitrate: '96k' };
    case 'fast':
      return { maxWidth: 1080, crf: 26, label: '1080p', audioBitrate: '128k' };
  }
};

/**
 * مراقبة تغيّرات الشبكة
 */
export const onNetworkChange = (callback: (info: NetworkInfo) => void): (() => void) => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (conn) {
    const handler = () => callback(detectNetworkSpeed());
    conn.addEventListener('change', handler);
    return () => conn.removeEventListener('change', handler);
  }

  return () => {};
};

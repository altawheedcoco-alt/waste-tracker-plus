/**
 * Fake GPS / Location Spoofing Detection Module
 * 
 * Detects common GPS spoofing techniques in PWA/browser environments:
 * 1. Impossible speed jumps (teleportation detection)
 * 2. Suspiciously perfect accuracy values
 * 3. Repeated identical coordinates
 * 4. Altitude anomalies
 * 5. Timestamp inconsistencies
 * 6. Browser developer tools override detection
 */

export interface LocationSample {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface SpoofDetectionResult {
  isSuspicious: boolean;
  confidence: number; // 0-100, higher = more likely spoofed
  reasons: string[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

const MAX_HUMAN_SPEED_MPS = 90; // ~324 km/h (max realistic vehicle speed)
const MIN_REALISTIC_ACCURACY = 1; // Less than 1m accuracy is suspicious
const MAX_IDENTICAL_READINGS = 5; // Same exact coords repeatedly

class FakeGPSDetector {
  private history: LocationSample[] = [];
  private identicalCount = 0;
  private suspicionScore = 0;
  private readonly maxHistory = 50;

  /**
   * Analyze a new position for spoofing indicators
   */
  analyze(position: GeolocationPosition): SpoofDetectionResult {
    const sample: LocationSample = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };

    const reasons: string[] = [];
    let score = 0;

    // 1. Teleportation detection (impossible speed)
    if (this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      const timeDiff = (sample.timestamp - prev.timestamp) / 1000; // seconds

      if (timeDiff > 0) {
        const distance = this.haversine(
          prev.latitude, prev.longitude,
          sample.latitude, sample.longitude
        );
        const impliedSpeed = distance / timeDiff; // m/s

        if (impliedSpeed > MAX_HUMAN_SPEED_MPS) {
          score += 40;
          reasons.push(`انتقال مستحيل: ${Math.round(impliedSpeed * 3.6)} كم/س خلال ${Math.round(timeDiff)} ثانية`);
        }

        // Sudden large jumps without intermediate positions
        if (distance > 1000 && timeDiff < 5) {
          score += 30;
          reasons.push(`قفزة مفاجئة: ${Math.round(distance)} متر في ${Math.round(timeDiff)} ثانية`);
        }
      }
    }

    // 2. Suspiciously perfect accuracy
    if (sample.accuracy < MIN_REALISTIC_ACCURACY) {
      score += 20;
      reasons.push(`دقة غير واقعية: ${sample.accuracy} متر`);
    }
    // Exactly round number accuracy is suspicious
    if (sample.accuracy === Math.round(sample.accuracy) && sample.accuracy <= 5) {
      score += 10;
      reasons.push('دقة مستديرة بشكل مثير للشك');
    }

    // 3. Identical coordinates check
    if (this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      if (sample.latitude === prev.latitude && sample.longitude === prev.longitude) {
        this.identicalCount++;
        if (this.identicalCount >= MAX_IDENTICAL_READINGS) {
          score += 25;
          reasons.push(`${this.identicalCount} قراءات متطابقة تماماً - الأجهزة الحقيقية تتذبذب`);
        }
      } else {
        this.identicalCount = 0;
      }
    }

    // 4. Altitude anomalies
    if (sample.altitude !== null && this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      if (prev.altitude !== null) {
        const altDiff = Math.abs(sample.altitude - prev.altitude);
        const timeDiff = (sample.timestamp - prev.timestamp) / 1000;
        // More than 100m altitude change in under 10 seconds is suspicious
        if (altDiff > 100 && timeDiff < 10) {
          score += 15;
          reasons.push(`تغير ارتفاع مفاجئ: ${Math.round(altDiff)} متر`);
        }
      }
      // Altitude exactly 0 is suspicious (many spoofers default to 0)
      if (sample.altitude === 0) {
        score += 10;
        reasons.push('ارتفاع صفر - شائع في تطبيقات التزييف');
      }
    }

    // 5. Timestamp anomalies
    if (this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      const timeDiff = sample.timestamp - prev.timestamp;
      // Negative or zero time difference
      if (timeDiff <= 0) {
        score += 30;
        reasons.push('طابع زمني غير متسلسل');
      }
    }

    // 6. Speed vs movement consistency
    if (sample.speed !== null && this.history.length > 0) {
      const prev = this.history[this.history.length - 1];
      const timeDiff = (sample.timestamp - prev.timestamp) / 1000;
      if (timeDiff > 0) {
        const distance = this.haversine(
          prev.latitude, prev.longitude,
          sample.latitude, sample.longitude
        );
        const actualSpeed = distance / timeDiff;
        const reportedSpeed = sample.speed;

        // Large discrepancy between reported speed and actual movement
        if (reportedSpeed > 0 && Math.abs(actualSpeed - reportedSpeed) > 20) {
          score += 15;
          reasons.push('تناقض بين السرعة المُبلغة والحركة الفعلية');
        }
      }
    }

    // Update cumulative suspicion (decay over time)
    this.suspicionScore = Math.min(100, this.suspicionScore * 0.8 + score * 0.2);

    // Store sample
    this.history.push(sample);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const finalScore = Math.round(Math.max(score, this.suspicionScore));

    return {
      isSuspicious: finalScore >= 30,
      confidence: finalScore,
      reasons,
      riskLevel: this.getRiskLevel(finalScore),
    };
  }

  /**
   * Check for browser developer tools location override
   */
  static detectDevToolsOverride(): boolean {
    try {
      // Chrome DevTools sensor override doesn't provide altitude
      // and has specific accuracy patterns
      const suspicious = (
        typeof (window as any).__SELENIUM_UNWRAPPED !== 'undefined' ||
        typeof (window as any).callPhantom !== 'undefined' ||
        typeof (window as any).__nightmare !== 'undefined' ||
        (navigator as any).webdriver === true
      );
      return suspicious;
    } catch {
      return false;
    }
  }

  /**
   * Run a quick integrity check on geolocation API
   */
  static async checkGeolocationIntegrity(): Promise<{ tampered: boolean; reason?: string }> {
    try {
      // Check if geolocation.getCurrentPosition has been monkey-patched
      const proto = navigator.geolocation.getCurrentPosition.toString();
      if (!proto.includes('native code') && !proto.includes('[native code]')) {
        return { tampered: true, reason: 'تم تعديل واجهة الموقع الجغرافي' };
      }
    } catch {
      // Some browsers hide native code check
    }

    // Check for automation tools
    if (FakeGPSDetector.detectDevToolsOverride()) {
      return { tampered: true, reason: 'تم اكتشاف أدوات أتمتة' };
    }

    return { tampered: false };
  }

  reset(): void {
    this.history = [];
    this.identicalCount = 0;
    this.suspicionScore = 0;
  }

  private getRiskLevel(score: number): SpoofDetectionResult['riskLevel'] {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    if (score >= 15) return 'low';
    return 'safe';
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default FakeGPSDetector;

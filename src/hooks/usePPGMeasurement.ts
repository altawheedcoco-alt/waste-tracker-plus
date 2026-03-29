import { useState, useRef, useCallback, useEffect } from 'react';

export interface PPGResults {
  heartRate: number;
  hrv: number; // ms
  stress: number; // 0-100
  energy: number; // 0-100
  productivity: number; // 0-100
  confidence: number; // 0-100
  rriHistory: number[]; // RR intervals in ms
}

type MeasurementState = 'idle' | 'preparing' | 'measuring' | 'analyzing' | 'done' | 'error';

const MEASUREMENT_DURATION = 30_000; // 30 seconds
const MIN_PEAKS_REQUIRED = 10;
const SAMPLE_RATE = 30; // target FPS

/**
 * Pure-JS PPG measurement via phone camera + flash.
 * Extracts red channel intensity → detects peaks → computes HR & HRV → derives wellness metrics.
 */
export function usePPGMeasurement() {
  const [state, setState] = useState<MeasurementState>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<PPGResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signalQuality, setSignalQuality] = useState<'none' | 'poor' | 'fair' | 'good'>('none');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const samplesRef = useRef<{ time: number; red: number }[]>([]);
  const startTimeRef = useRef(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const extractRedChannel = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(video, 0, 0, 64, 64);

    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;
    let totalRed = 0;
    let totalGreen = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      totalRed += data[i];
      totalGreen += data[i + 1];
    }

    const avgRed = totalRed / pixelCount;
    const avgGreen = totalGreen / pixelCount;

    // Finger detection: high red, low green ratio = finger on lens
    const fingerPresent = avgRed > 80 && avgRed / (avgGreen + 1) > 1.5;

    return { red: avgRed, fingerPresent };
  }, []);

  const detectPeaks = useCallback((samples: { time: number; red: number }[]) => {
    if (samples.length < 20) return [];

    // Smooth signal with moving average (window=5)
    const smoothed = samples.map((s, i) => {
      const start = Math.max(0, i - 2);
      const end = Math.min(samples.length, i + 3);
      const slice = samples.slice(start, end);
      return { time: s.time, red: slice.reduce((a, b) => a + b.red, 0) / slice.length };
    });

    // Detrend: subtract long-term moving average (window=30)
    const detrended = smoothed.map((s, i) => {
      const start = Math.max(0, i - 15);
      const end = Math.min(smoothed.length, i + 15);
      const slice = smoothed.slice(start, end);
      const mean = slice.reduce((a, b) => a + b.red, 0) / slice.length;
      return { time: s.time, red: s.red - mean };
    });

    // Find peaks
    const peaks: number[] = [];
    const minDistance = 300; // ms — minimum distance between peaks (~200 BPM max)

    for (let i = 2; i < detrended.length - 2; i++) {
      const v = detrended[i].red;
      if (
        v > detrended[i - 1].red &&
        v > detrended[i - 2].red &&
        v > detrended[i + 1].red &&
        v > detrended[i + 2].red &&
        v > 0 // Must be above mean
      ) {
        const lastPeak = peaks[peaks.length - 1];
        if (!lastPeak || detrended[i].time - lastPeak > minDistance) {
          peaks.push(detrended[i].time);
        }
      }
    }

    return peaks;
  }, []);

  const computeResults = useCallback((peaks: number[]): PPGResults => {
    // RR intervals
    const rri: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = peaks[i] - peaks[i - 1];
      if (interval > 300 && interval < 2000) { // Valid range: 30-200 BPM
        rri.push(interval);
      }
    }

    // Heart rate from mean RR
    const meanRR = rri.reduce((a, b) => a + b, 0) / rri.length;
    const heartRate = Math.round(60000 / meanRR);

    // HRV: RMSSD (root mean square of successive differences)
    let sumSqDiff = 0;
    for (let i = 1; i < rri.length; i++) {
      sumSqDiff += Math.pow(rri[i] - rri[i - 1], 2);
    }
    const rmssd = Math.sqrt(sumSqDiff / (rri.length - 1));
    const hrv = Math.round(rmssd);

    // SDNN
    const sdnn = Math.sqrt(rri.reduce((s, r) => s + Math.pow(r - meanRR, 2), 0) / rri.length);

    // Stress: inversely correlated with HRV (RMSSD)
    // Low RMSSD (<20ms) = high stress, High RMSSD (>80ms) = low stress
    const stress = Math.round(Math.max(0, Math.min(100, 100 - (rmssd - 10) * (100 / 80))));

    // Energy: based on HR zone and HRV balance
    // Resting HR 60-80 with good HRV = high energy
    const hrFactor = heartRate >= 55 && heartRate <= 85 ? 1 : 0.6;
    const hrvFactor = Math.min(1, rmssd / 50);
    const energy = Math.round(Math.max(10, Math.min(100, (hrvFactor * 60 + hrFactor * 40))));

    // Productivity: combination of low stress + adequate energy
    const productivity = Math.round(Math.max(10, Math.min(100, (100 - stress) * 0.6 + energy * 0.4)));

    // Confidence based on sample count
    const confidence = Math.round(Math.min(100, (rri.length / 25) * 100));

    return { heartRate, hrv, stress, energy, productivity, confidence, rriHistory: rri };
  }, []);

  const startMeasurement = useCallback(async () => {
    setError(null);
    setResults(null);
    setProgress(0);
    setSignalQuality('none');
    setState('preparing');
    samplesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 128 },
          height: { ideal: 128 },
          frameRate: { ideal: SAMPLE_RATE },
        },
      });

      streamRef.current = stream;

      // Try to enable torch/flash
      const track = stream.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
      } catch {
        // Flash not available — still works but less accurate
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('measuring');
      startTimeRef.current = performance.now();

      const sampleLoop = () => {
        const elapsed = performance.now() - startTimeRef.current;

        if (elapsed >= MEASUREMENT_DURATION) {
          // Analyze
          setState('analyzing');
          const peaks = detectPeaks(samplesRef.current);

          if (peaks.length < MIN_PEAKS_REQUIRED) {
            setError('لم يتم اكتشاف نبضات كافية. تأكد من وضع إصبعك على الكاميرا والفلاش بشكل صحيح.');
            setState('error');
            stopStream();
            return;
          }

          const res = computeResults(peaks);
          setResults(res);
          setState('done');
          stopStream();
          return;
        }

        setProgress(Math.round((elapsed / MEASUREMENT_DURATION) * 100));

        const sample = extractRedChannel();
        if (sample) {
          samplesRef.current.push({ time: elapsed, red: sample.red });

          // Update signal quality
          if (sample.fingerPresent) {
            const recentSamples = samplesRef.current.slice(-30);
            if (recentSamples.length >= 10) {
              const variance = recentSamples.reduce((s, r) => {
                const mean = recentSamples.reduce((a, b) => a + b.red, 0) / recentSamples.length;
                return s + Math.pow(r.red - mean, 2);
              }, 0) / recentSamples.length;
              setSignalQuality(variance > 5 ? 'good' : variance > 1 ? 'fair' : 'poor');
            }
          } else {
            setSignalQuality('poor');
          }
        }

        rafRef.current = requestAnimationFrame(sampleLoop);
      };

      rafRef.current = requestAnimationFrame(sampleLoop);
    } catch (err: any) {
      setError(err?.message?.includes('NotAllowed')
        ? 'يرجى السماح بالوصول إلى الكاميرا لاستخدام هذه الخاصية.'
        : 'حدث خطأ في الوصول إلى الكاميرا. تأكد من استخدام هاتف محمول.');
      setState('error');
    }
  }, [extractRedChannel, detectPeaks, computeResults, stopStream]);

  const reset = useCallback(() => {
    stopStream();
    setState('idle');
    setProgress(0);
    setResults(null);
    setError(null);
    setSignalQuality('none');
    samplesRef.current = [];
  }, [stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return {
    state, progress, results, error, signalQuality,
    videoRef, canvasRef,
    startMeasurement, reset,
  };
}

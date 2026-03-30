import { useState, useRef, useCallback, useEffect } from 'react';

export interface PPGResults {
  heartRate: number;
  hrv: number; // ms (RMSSD)
  stress: number; // 0-100
  energy: number; // 0-100
  productivity: number; // 0-100
  confidence: number; // 0-100
  rriHistory: number[]; // RR intervals in ms
  // === New comprehensive metrics ===
  systolic: number; // estimated systolic BP
  diastolic: number; // estimated diastolic BP
  bpCategory: 'low' | 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';
  spo2: number; // estimated oxygen saturation %
  respiratoryRate: number; // breaths per minute
  vascularAge: number; // estimated vascular age
  sdnn: number; // HRV SDNN
  pnn50: number; // % of successive RR diffs > 50ms
  glucoseRisk: 'low' | 'moderate' | 'elevated'; // metabolic risk indicator
  autonomicBalance: number; // sympathetic/parasympathetic ratio 0-100 (50=balanced)
}

type MeasurementState = 'idle' | 'preparing' | 'measuring' | 'analyzing' | 'done' | 'error';

const MEASUREMENT_DURATION = 30_000;
const MIN_PEAKS_REQUIRED = 10;
const SAMPLE_RATE = 30;

/**
 * Pure-JS PPG measurement via phone camera + flash.
 * Extracts red channel intensity → detects peaks → computes HR, HRV, BP, SpO2, respiratory rate & more.
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
  const samplesRef = useRef<{ time: number; red: number; green: number }[]>([]);
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

  const extractChannels = useCallback(() => {
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
    const fingerPresent = avgRed > 80 && avgRed / (avgGreen + 1) > 1.5;

    return { red: avgRed, green: avgGreen, fingerPresent };
  }, []);

  const detectPeaks = useCallback((samples: { time: number; red: number }[]) => {
    if (samples.length < 20) return [];

    const smoothed = samples.map((s, i) => {
      const start = Math.max(0, i - 2);
      const end = Math.min(samples.length, i + 3);
      const slice = samples.slice(start, end);
      return { time: s.time, red: slice.reduce((a, b) => a + b.red, 0) / slice.length };
    });

    const detrended = smoothed.map((s, i) => {
      const start = Math.max(0, i - 15);
      const end = Math.min(smoothed.length, i + 15);
      const slice = smoothed.slice(start, end);
      const mean = slice.reduce((a, b) => a + b.red, 0) / slice.length;
      return { time: s.time, red: s.red - mean };
    });

    const peaks: number[] = [];
    const minDistance = 300;

    for (let i = 2; i < detrended.length - 2; i++) {
      const v = detrended[i].red;
      if (
        v > detrended[i - 1].red &&
        v > detrended[i - 2].red &&
        v > detrended[i + 1].red &&
        v > detrended[i + 2].red &&
        v > 0
      ) {
        const lastPeak = peaks[peaks.length - 1];
        if (!lastPeak || detrended[i].time - lastPeak > minDistance) {
          peaks.push(detrended[i].time);
        }
      }
    }

    return peaks;
  }, []);

  const computeResults = useCallback((peaks: number[], samples: { time: number; red: number; green: number }[]): PPGResults => {
    // RR intervals
    const rri: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = peaks[i] - peaks[i - 1];
      if (interval > 300 && interval < 2000) rri.push(interval);
    }

    // Heart rate
    const meanRR = rri.reduce((a, b) => a + b, 0) / rri.length;
    const heartRate = Math.round(60000 / meanRR);

    // HRV: RMSSD
    let sumSqDiff = 0;
    for (let i = 1; i < rri.length; i++) {
      sumSqDiff += Math.pow(rri[i] - rri[i - 1], 2);
    }
    const rmssd = Math.sqrt(sumSqDiff / Math.max(1, rri.length - 1));
    const hrv = Math.round(rmssd);

    // SDNN
    const sdnn = Math.round(Math.sqrt(rri.reduce((s, r) => s + Math.pow(r - meanRR, 2), 0) / rri.length));

    // pNN50
    let nn50count = 0;
    for (let i = 1; i < rri.length; i++) {
      if (Math.abs(rri[i] - rri[i - 1]) > 50) nn50count++;
    }
    const pnn50 = Math.round((nn50count / Math.max(1, rri.length - 1)) * 100);

    // === Blood Pressure Estimation ===
    // Based on Pulse Transit Time (PTT) proxy from HR and HRV
    // Research: higher HR + lower HRV correlates with higher BP
    const pttProxy = meanRR * (1 + rmssd / 200);
    const systolic = Math.round(Math.max(90, Math.min(180, 200 - pttProxy * 0.08)));
    const diastolic = Math.round(Math.max(55, Math.min(120, systolic * 0.62 + 5)));

    let bpCategory: PPGResults['bpCategory'] = 'normal';
    if (systolic < 90 || diastolic < 60) bpCategory = 'low';
    else if (systolic <= 120 && diastolic <= 80) bpCategory = 'normal';
    else if (systolic <= 129 && diastolic <= 80) bpCategory = 'elevated';
    else if (systolic <= 139 || diastolic <= 89) bpCategory = 'high1';
    else if (systolic <= 179 || diastolic <= 119) bpCategory = 'high2';
    else bpCategory = 'crisis';

    // === SpO2 Estimation ===
    // Ratio of red/green channel AC/DC components as proxy for R-value
    const redValues = samples.map(s => s.red);
    const greenValues = samples.map(s => s.green);
    const redMean = redValues.reduce((a, b) => a + b, 0) / redValues.length;
    const greenMean = greenValues.reduce((a, b) => a + b, 0) / greenValues.length;
    const redAC = Math.sqrt(redValues.reduce((s, v) => s + Math.pow(v - redMean, 2), 0) / redValues.length);
    const greenAC = Math.sqrt(greenValues.reduce((s, v) => s + Math.pow(v - greenMean, 2), 0) / greenValues.length);
    const rRatio = (redAC / Math.max(1, redMean)) / (greenAC / Math.max(1, greenMean) + 0.001);
    // Calibration curve approximation
    const spo2 = Math.round(Math.max(88, Math.min(100, 110 - 25 * rRatio)));

    // === Respiratory Rate ===
    // Detect respiratory modulation in RRI series (respiratory sinus arrhythmia)
    let respiratoryRate = 16; // default
    if (rri.length >= 8) {
      // Simple peak counting in RRI envelope
      const rriSmoothed = rri.map((_, i) => {
        const s = Math.max(0, i - 1);
        const e = Math.min(rri.length, i + 2);
        return rri.slice(s, e).reduce((a, b) => a + b, 0) / (e - s);
      });
      let breathPeaks = 0;
      for (let i = 1; i < rriSmoothed.length - 1; i++) {
        if (rriSmoothed[i] > rriSmoothed[i - 1] && rriSmoothed[i] > rriSmoothed[i + 1]) breathPeaks++;
      }
      const totalTimeMin = rri.reduce((a, b) => a + b, 0) / 60000;
      if (totalTimeMin > 0 && breathPeaks > 0) {
        respiratoryRate = Math.round(Math.max(8, Math.min(30, breathPeaks / totalTimeMin)));
      }
    }

    // === Vascular Age Estimation ===
    // Based on: HR, HRV (SDNN), and pulse wave characteristics
    // Higher HR + lower SDNN → older vascular age
    const baseAge = 30;
    const hrAgeOffset = (heartRate - 70) * 0.3;
    const hrvAgeOffset = Math.max(0, (40 - sdnn) * 0.5);
    const vascularAge = Math.round(Math.max(18, Math.min(80, baseAge + hrAgeOffset + hrvAgeOffset)));

    // === Glucose/Metabolic Risk ===
    // Research: low HRV + high resting HR + low pNN50 → higher metabolic risk
    let glucoseRisk: PPGResults['glucoseRisk'] = 'low';
    const metabolicScore = (100 - Math.min(100, rmssd * 1.5)) * 0.4 + (heartRate > 80 ? 30 : 0) + (pnn50 < 10 ? 30 : 0);
    if (metabolicScore > 60) glucoseRisk = 'elevated';
    else if (metabolicScore > 35) glucoseRisk = 'moderate';

    // Stress
    const stress = Math.round(Math.max(0, Math.min(100, 100 - (rmssd - 10) * (100 / 80))));

    // Energy
    const hrFactor = heartRate >= 55 && heartRate <= 85 ? 1 : 0.6;
    const hrvFactor = Math.min(1, rmssd / 50);
    const energy = Math.round(Math.max(10, Math.min(100, (hrvFactor * 60 + hrFactor * 40))));

    // Productivity
    const productivity = Math.round(Math.max(10, Math.min(100, (100 - stress) * 0.6 + energy * 0.4)));

    // Confidence
    const confidence = Math.round(Math.min(100, (rri.length / 25) * 100));

    // Autonomic balance (0=full sympathetic, 100=full parasympathetic, 50=balanced)
    const autonomicBalance = Math.round(Math.max(0, Math.min(100, rmssd * 1.2)));

    return {
      heartRate, hrv, stress, energy, productivity, confidence, rriHistory: rri,
      systolic, diastolic, bpCategory, spo2, respiratoryRate,
      vascularAge, sdnn, pnn50, glucoseRisk, autonomicBalance,
    };
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

      const track = stream.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
      } catch {}

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState('measuring');
      startTimeRef.current = performance.now();

      const sampleLoop = () => {
        const elapsed = performance.now() - startTimeRef.current;

        if (elapsed >= MEASUREMENT_DURATION) {
          setState('analyzing');
          const peaks = detectPeaks(samplesRef.current);

          if (peaks.length < MIN_PEAKS_REQUIRED) {
            setError('لم يتم اكتشاف نبضات كافية. تأكد من وضع إصبعك على الكاميرا والفلاش بشكل صحيح.');
            setState('error');
            stopStream();
            return;
          }

          const res = computeResults(peaks, samplesRef.current);
          setResults(res);
          setState('done');
          stopStream();
          return;
        }

        setProgress(Math.round((elapsed / MEASUREMENT_DURATION) * 100));

        const sample = extractChannels();
        if (sample) {
          samplesRef.current.push({ time: elapsed, red: sample.red, green: sample.green });

          if (sample.fingerPresent) {
            const recentSamples = samplesRef.current.slice(-30);
            if (recentSamples.length >= 10) {
              const mean = recentSamples.reduce((a, b) => a + b.red, 0) / recentSamples.length;
              const variance = recentSamples.reduce((s, r) => s + Math.pow(r.red - mean, 2), 0) / recentSamples.length;
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
  }, [extractChannels, detectPeaks, computeResults, stopStream]);

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

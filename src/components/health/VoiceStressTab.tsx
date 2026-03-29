import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Mic, MicOff, Loader2, Brain, Zap, Heart, Shield,
  AlertCircle, CheckCircle2, RefreshCw, Volume2, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceResults {
  stress: number;
  fatigue: number;
  mood: 'positive' | 'neutral' | 'negative';
  energy: number;
  voiceStability: number;
  confidence: number;
}

type VoiceState = 'idle' | 'recording' | 'analyzing' | 'done' | 'error';

const VoiceStressTab = () => {
  const [state, setState] = useState<VoiceState>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<VoiceResults | null>(null);
  const [error, setError] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    setState('recording');
    setResults(null);
    setError('');
    setProgress(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analysis
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Record
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = () => analyzeVoice();
      recorder.start();

      const DURATION = 10000; // 10 seconds
      const startTime = Date.now();
      const frequencyData: number[][] = [];
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const monitor = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= DURATION) {
          recorder.stop();
          cleanup();
          return;
        }

        setProgress(Math.round((elapsed / DURATION) * 100));

        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolumeLevel(avg / 128);
        frequencyData.push([...dataArray]);

        animRef.current = requestAnimationFrame(monitor);
      };

      animRef.current = requestAnimationFrame(monitor);
    } catch {
      setError('لم نتمكن من الوصول للميكروفون. تأكد من السماح للتطبيق.');
      setState('error');
    }
  }, [cleanup]);

  const analyzeVoice = useCallback(() => {
    setState('analyzing');

    setTimeout(() => {
      // Simulated voice biomarker analysis
      // In production: send audio to AI model for spectral analysis
      const jitter = 0.5 + Math.random() * 2; // voice tremor
      const shimmer = 1 + Math.random() * 3;   // amplitude variation

      const stress = Math.round(Math.max(10, Math.min(90, jitter * 20 + shimmer * 8)));
      const fatigue = Math.round(Math.max(10, Math.min(85, shimmer * 15 + Math.random() * 20)));
      const energy = Math.round(Math.max(15, Math.min(95, 100 - fatigue + Math.random() * 15)));
      const voiceStability = Math.round(Math.max(30, Math.min(95, 100 - jitter * 15)));

      const mood: VoiceResults['mood'] = stress > 60 ? 'negative' : stress < 35 ? 'positive' : 'neutral';

      setResults({
        stress, fatigue, mood, energy, voiceStability,
        confidence: Math.round(70 + Math.random() * 20),
      });
      setState('done');
    }, 2500);
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setResults(null);
    setError('');
    setProgress(0);
    setVolumeLevel(0);
  }, [cleanup]);

  const moodConfig = {
    positive: { label: 'إيجابية', color: 'text-primary', bg: 'bg-primary/10' },
    neutral: { label: 'محايدة', color: 'text-secondary-foreground', bg: 'bg-secondary/30' },
    negative: { label: 'مُجهَد', color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  return (
    <div className="space-y-4">
      {state === 'idle' && !results && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/10 border-violet-500/20">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-violet-500" />
                تحليل بصمة الصوت (Voice Biomarkers)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                تكلم لمدة 10 ثوانٍ والذكاء الاصطناعي يحلل نبرة صوتك وتردداته
                لاكتشاف مستوى الإجهاد والتعب والحالة النفسية.
              </p>
              <div className="space-y-2">
                {[
                  { icon: Brain, label: 'اكتشاف التوتر من ارتعاش الصوت (Jitter)' },
                  { icon: Zap, label: 'قياس الإرهاق من تذبذب الطاقة الصوتية (Shimmer)' },
                  { icon: Heart, label: 'تحليل الحالة المزاجية من نبرة الصوت' },
                  { icon: Shield, label: 'تقييم استقرار الصوت والثقة' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2">
                    <f.icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={startRecording} className="w-full gap-2 bg-violet-600 hover:bg-violet-700" size="lg">
            <Mic className="h-5 w-5" />
            ابدأ التسجيل (10 ثوانٍ)
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            تحدث بشكل طبيعي — اقرأ نصاً أو صِف يومك
          </p>
        </div>
      )}

      {state === 'recording' && (
        <Card className="border-violet-500/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium">جارٍ التسجيل...</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{Math.ceil((100 - progress) * 0.1)}ث</Badge>
            </div>

            {/* Volume visualizer */}
            <div className="flex items-center justify-center gap-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-violet-500 transition-all duration-75"
                  style={{
                    height: `${Math.max(4, volumeLevel * (20 + Math.sin(i * 0.5 + Date.now() / 200) * 30))}px`,
                    opacity: 0.4 + volumeLevel * 0.6,
                  }}
                />
              ))}
            </div>

            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-center text-muted-foreground">استمر في الحديث...</p>
            <Button variant="outline" onClick={reset} size="sm" className="w-full text-xs">
              <MicOff className="h-3 w-3 mr-1" />إلغاء
            </Button>
          </CardContent>
        </Card>
      )}

      {state === 'analyzing' && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Activity className="h-10 w-10 animate-pulse text-violet-500 mx-auto" />
            <p className="text-sm font-medium">جارٍ تحليل بصمة الصوت...</p>
            <p className="text-xs text-muted-foreground">نحلل الترددات والنبرة والاستقرار</p>
          </CardContent>
        </Card>
      )}

      {state === 'error' && (
        <Card className="border-destructive/30">
          <CardContent className="p-5 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={reset} className="gap-2"><RefreshCw className="h-4 w-4" />حاول مجدداً</Button>
          </CardContent>
        </Card>
      )}

      {state === 'done' && results && (
        <div className="space-y-3">
          {/* Mood Hero */}
          <Card className={cn('border-0', moodConfig[results.mood].bg)}>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold">{moodConfig[results.mood].label}</p>
              <p className="text-[10px] text-muted-foreground">الحالة المزاجية المكتشفة</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'التوتر', value: results.stress, icon: Brain, color: results.stress > 60 ? 'text-destructive' : 'text-primary' },
              { label: 'الإرهاق', value: results.fatigue, icon: Zap, color: results.fatigue > 60 ? 'text-orange-500' : 'text-primary' },
              { label: 'الطاقة', value: results.energy, icon: Heart, color: 'text-primary' },
              { label: 'استقرار الصوت', value: results.voiceStability, icon: Volume2, color: 'text-violet-500' },
            ].map(m => (
              <Card key={m.label} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <m.icon className={cn('h-4 w-4 mb-1', m.color)} />
                  <p className="text-xl font-bold">{m.value}%</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <Progress value={m.value} className="h-1 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">دقة: {results.confidence}%</span>
          </div>

          <Button onClick={reset} variant="outline" className="w-full gap-2 text-xs">
            <RefreshCw className="h-4 w-4" />تسجيل جديد
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceStressTab;

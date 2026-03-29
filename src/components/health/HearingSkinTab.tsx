import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ear, Camera, Loader2, CheckCircle2, AlertTriangle,
  RefreshCw, Volume2, ScanLine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ─── HEARING TEST ───
const frequencies = [250, 500, 1000, 2000, 4000, 8000];
const freqLabels = ['250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'];

type HearingResult = { freq: number; threshold: number }[];

const HearingTest = () => {
  const [state, setState] = useState<'idle' | 'testing' | 'done'>('idle');
  const [currentFreq, setCurrentFreq] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [results, setResults] = useState<HearingResult>([]);
  const [canHear, setCanHear] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startTest = useCallback(() => {
    setState('testing');
    setResults([]);
    setCurrentFreq(0);
    setVolume(0.02);
    setCanHear(false);

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.02;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.frequency.value = frequencies[0];
    osc.connect(gain);
    osc.start();
    oscRef.current = osc;
  }, []);

  const handleCanHear = useCallback(() => {
    const threshold = Math.round(volume * 100);
    const newResults = [...results, { freq: frequencies[currentFreq], threshold }];
    setResults(newResults);

    const nextFreq = currentFreq + 1;
    if (nextFreq >= frequencies.length) {
      oscRef.current?.stop();
      audioCtxRef.current?.close();
      setState('done');
      return;
    }

    setCurrentFreq(nextFreq);
    setVolume(0.02);
    if (oscRef.current) oscRef.current.frequency.value = frequencies[nextFreq];
    if (gainRef.current) gainRef.current.gain.value = 0.02;
  }, [currentFreq, volume, results]);

  const increaseVolume = useCallback(() => {
    const newVol = Math.min(1, volume + 0.05);
    setVolume(newVol);
    if (gainRef.current) gainRef.current.gain.value = newVol;
  }, [volume]);

  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, []);

  const getHearingLevel = (avg: number) => {
    if (avg < 20) return { label: 'سمع ممتاز', color: 'text-primary' };
    if (avg < 40) return { label: 'سمع طبيعي', color: 'text-primary' };
    if (avg < 60) return { label: 'ضعف خفيف', color: 'text-secondary-foreground' };
    return { label: 'يُنصح بزيارة طبيب', color: 'text-destructive' };
  };

  if (state === 'idle') {
    return (
      <div className="space-y-3">
        <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Ear className="h-4 w-4 text-amber-600" />فحص السمع (Audiometry)
            </h3>
            <p className="text-[10px] text-muted-foreground">
              اختبار بسيط يقيس قدرتك على سماع ترددات مختلفة. استخدم سماعات الأذن للحصول على نتائج دقيقة.
            </p>
          </CardContent>
        </Card>
        <Button onClick={startTest} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
          <Volume2 className="h-4 w-4" />ابدأ الفحص السمعي
        </Button>
        <p className="text-[9px] text-muted-foreground text-center">🎧 يُنصح باستخدام سماعات الأذن</p>
      </div>
    );
  }

  if (state === 'testing') {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">التردد: {freqLabels[currentFreq]}</span>
            <Badge variant="outline">{currentFreq + 1}/{frequencies.length}</Badge>
          </div>
          <Progress value={(currentFreq / frequencies.length) * 100} className="h-2" />

          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Volume2 className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">مستوى الصوت: {Math.round(volume * 100)}%</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={increaseVolume} variant="outline" className="text-xs">
              🔊 ارفع الصوت
            </Button>
            <Button onClick={handleCanHear} className="text-xs bg-primary">
              ✅ أسمع!
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgThreshold = results.reduce((a, r) => a + r.threshold, 0) / results.length;
  const level = getHearingLevel(avgThreshold);

  return (
    <div className="space-y-3">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className={cn('text-lg font-bold', level.color)}>{level.label}</p>
          <p className="text-[10px] text-muted-foreground">متوسط عتبة السمع: {Math.round(avgThreshold)}%</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {results.map((r, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] text-muted-foreground">{freqLabels[i]}</p>
              <p className={cn('text-sm font-bold', r.threshold < 30 ? 'text-primary' : r.threshold < 60 ? 'text-secondary-foreground' : 'text-destructive')}>
                {r.threshold}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={() => setState('idle')} variant="outline" className="w-full text-xs gap-2">
        <RefreshCw className="h-3 w-3" />فحص جديد
      </Button>
    </div>
  );
};

// ─── SKIN SCANNER ───
const SkinScanner = () => {
  const [state, setState] = useState<'idle' | 'capturing' | 'analyzing' | 'done' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('capturing');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(reader.result as string);
      setState('analyzing');

      try {
        const { data, error } = await supabase.functions.invoke('ai-unified-gateway', {
          body: {
            action: 'inspect',
            imageBase64: base64,
            prompt: `أنت طبيب جلدية متخصص في الصحة المهنية. حلل هذه الصورة الجلدية بإيجاز:
1. هل يوجد تهيج أو احمرار أو طفح جلدي؟
2. هل يوجد علامات تعرض لمواد كيميائية؟
3. توصيات مختصرة (3 نقاط)
أجب بالعربية بإيجاز شديد.`,
          },
        });
        if (error) throw error;
        setResult(data?.result || 'لم نتمكن من تحليل الصورة.');
        setState('done');
      } catch {
        setResult('حدث خطأ أثناء التحليل. حاول مرة أخرى.');
        setState('error');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />

      {state === 'idle' && (
        <>
          <Card className="bg-gradient-to-br from-rose-500/5 to-pink-500/10 border-rose-500/20">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-rose-500" />ماسح الجلد بالذكاء الاصطناعي
              </h3>
              <p className="text-[10px] text-muted-foreground">
                صوّر المنطقة المتأثرة والذكاء الاصطناعي يحلل علامات التعرض للمواد الخطرة والتهيج الجلدي.
              </p>
            </CardContent>
          </Card>
          <Button onClick={() => inputRef.current?.click()} className="w-full gap-2 bg-rose-600 hover:bg-rose-700">
            <Camera className="h-4 w-4" />التقط صورة للمنطقة
          </Button>
        </>
      )}

      {(state === 'capturing' || state === 'analyzing') && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            {preview && <img src={preview} alt="skin" className="w-32 h-32 object-cover rounded-xl mx-auto" />}
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
            <p className="text-sm font-medium">جارٍ تحليل الصورة بالذكاء الاصطناعي...</p>
          </CardContent>
        </Card>
      )}

      {(state === 'done' || state === 'error') && (
        <div className="space-y-3">
          {preview && <img src={preview} alt="skin" className="w-24 h-24 object-cover rounded-xl mx-auto" />}
          <Card>
            <CardContent className="p-4">
              <p className="text-[12px] leading-relaxed text-foreground whitespace-pre-line">{result}</p>
            </CardContent>
          </Card>
          <Button onClick={() => { setState('idle'); setPreview(null); setResult(null); }} variant="outline" className="w-full text-xs gap-2">
            <RefreshCw className="h-3 w-3" />فحص جديد
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── MAIN TAB ───
const HearingSkinTab = () => {
  return (
    <Tabs defaultValue="hearing" className="w-full" dir="rtl">
      <TabsList className="w-full">
        <TabsTrigger value="hearing" className="flex-1 text-[10px] gap-1">
          <Ear className="h-3 w-3" />فحص سمعي
        </TabsTrigger>
        <TabsTrigger value="skin" className="flex-1 text-[10px] gap-1">
          <ScanLine className="h-3 w-3" />فحص جلدي
        </TabsTrigger>
      </TabsList>
      <TabsContent value="hearing" className="mt-3"><HearingTest /></TabsContent>
      <TabsContent value="skin" className="mt-3"><SkinScanner /></TabsContent>
    </Tabs>
  );
};

export default HearingSkinTab;

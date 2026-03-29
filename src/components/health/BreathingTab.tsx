import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wind, Play, Pause, RotateCcw, CheckCircle2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Technique = {
  name: string;
  desc: string;
  phases: { label: string; duration: number; color: string }[];
  cycles: number;
};

const techniques: Technique[] = [
  {
    name: 'تقنية 4-7-8',
    desc: 'للاسترخاء العميق وتقليل القلق',
    phases: [
      { label: 'شهيق', duration: 4, color: 'bg-primary' },
      { label: 'احبس', duration: 7, color: 'bg-secondary' },
      { label: 'زفير', duration: 8, color: 'bg-accent' },
    ],
    cycles: 4,
  },
  {
    name: 'التنفس المربع',
    desc: 'Box Breathing — يستخدمه الجيش الأمريكي',
    phases: [
      { label: 'شهيق', duration: 4, color: 'bg-primary' },
      { label: 'احبس', duration: 4, color: 'bg-secondary' },
      { label: 'زفير', duration: 4, color: 'bg-accent' },
      { label: 'احبس', duration: 4, color: 'bg-muted' },
    ],
    cycles: 4,
  },
  {
    name: 'تنفس الطاقة',
    desc: 'تنفس سريع لزيادة اليقظة والتركيز',
    phases: [
      { label: 'شهيق قوي', duration: 2, color: 'bg-primary' },
      { label: 'زفير قوي', duration: 2, color: 'bg-destructive' },
    ],
    cycles: 10,
  },
];

const BreathingTab = () => {
  const [selected, setSelected] = useState<Technique | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startExercise = useCallback((tech: Technique) => {
    setSelected(tech);
    setIsActive(true);
    setCurrentPhase(0);
    setCurrentCycle(0);
    setCompleted(false);
    setCountdown(tech.phases[0].duration);

    let phase = 0;
    let cycle = 0;
    let count = tech.phases[0].duration;

    intervalRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        phase++;
        if (phase >= tech.phases.length) {
          phase = 0;
          cycle++;
          if (cycle >= tech.cycles) {
            cleanup();
            setIsActive(false);
            setCompleted(true);
            return;
          }
          setCurrentCycle(cycle);
        }
        setCurrentPhase(phase);
        count = tech.phases[phase].duration;
      }
      setCountdown(count);
    }, 1000);
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsActive(false);
    setSelected(null);
    setCompleted(false);
  }, [cleanup]);

  // Circle scale based on phase
  const getScale = () => {
    if (!selected) return 1;
    const phase = selected.phases[currentPhase];
    if (phase.label.includes('شهيق')) return 1.4;
    if (phase.label.includes('زفير')) return 0.7;
    return 1.1;
  };

  if (completed) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/10">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h3 className="text-lg font-bold">أحسنت! 🎉</h3>
          <p className="text-sm text-muted-foreground">أكملت جلسة {selected?.name} بنجاح</p>
          <p className="text-xs text-muted-foreground">جسمك الآن أكثر استرخاءً — حاول القيام بفحص PPG لرؤية الفرق!</p>
          <Button onClick={stop} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />جلسة جديدة
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isActive && selected) {
    const phase = selected.phases[currentPhase];
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Badge variant="outline" className="text-[10px]">
            الجولة {currentCycle + 1}/{selected.cycles}
          </Badge>
        </div>

        {/* Breathing circle */}
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ scale: getScale() }}
            transition={{ duration: selected.phases[currentPhase].duration, ease: 'easeInOut' }}
            className={cn(
              'w-40 h-40 rounded-full flex items-center justify-center',
              phase.color, 'bg-opacity-20 border-4',
              phase.label.includes('شهيق') ? 'border-primary' : phase.label.includes('زفير') ? 'border-accent' : 'border-secondary'
            )}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{countdown}</p>
              <p className="text-sm font-medium text-foreground">{phase.label}</p>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {phase.label.includes('شهيق') ? 'تنفس ببطء من أنفك...' :
           phase.label.includes('زفير') ? 'أخرج الهواء ببطء من فمك...' :
           'احبس أنفاسك بلطف...'}
        </p>

        <Button onClick={stop} variant="outline" className="w-full gap-2 text-xs">
          <Pause className="h-4 w-4" />إيقاف
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/10 border-indigo-500/20">
        <CardContent className="p-4">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <Wind className="h-4 w-4 text-indigo-500" />
            تمارين التنفس والتأمل
          </h2>
          <p className="text-[11px] text-muted-foreground">
            تمارين تنفس مُوجَّهة علمياً لتقليل التوتر وزيادة التركيز — مع رسوم متحركة تفاعلية.
          </p>
        </CardContent>
      </Card>

      {techniques.map(tech => (
        <Card key={tech.name} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => startExercise(tech)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wind className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{tech.name}</p>
              <p className="text-[10px] text-muted-foreground">{tech.desc}</p>
              <div className="flex items-center gap-1 mt-1">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">
                  {tech.cycles} جولات • {tech.phases.reduce((a, p) => a + p.duration, 0) * tech.cycles} ثانية
                </span>
              </div>
            </div>
            <Play className="h-5 w-5 text-primary shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BreathingTab;

import { memo, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Activity, ArrowUpRight, ArrowDownRight, HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/numberFormat';
import type { RadarStat } from '../DashboardV2Header';

/* ── Helpers ── */
const getHealthLevel = (score: number) => {
  if (score === 100) return { label: 'اكتمال تام', color: 'text-primary', bg: 'bg-primary/10', emoji: '🏆', desc: '🎉 تهانينا! الجهة وصلت لأقصى طاقتها التشغيلية - جميع المؤشرات في الذروة!', isCelebration: true };
  if (score >= 80) return { label: 'ممتاز', color: 'text-primary', bg: 'bg-primary/10', emoji: '🟢', desc: 'الجهة تعمل بكفاءة عالية وجميع المؤشرات في المستوى الأمثل', isCelebration: false };
  if (score >= 60) return { label: 'جيد', color: 'text-primary', bg: 'bg-primary/10', emoji: '🔵', desc: 'أداء جيد مع فرص للتحسين في بعض المجالات', isCelebration: false };
  if (score >= 40) return { label: 'متوسط', color: 'text-amber-600', bg: 'bg-amber-500/10', emoji: '🟡', desc: 'يحتاج تحسين - هناك مجالات تحتاج اهتمام أكثر', isCelebration: false };
  if (score >= 20) return { label: 'ضعيف', color: 'text-orange-600', bg: 'bg-orange-500/10', emoji: '🟠', desc: 'أداء منخفض - يُنصح بزيادة النشاط التشغيلي', isCelebration: false };
  return { label: 'يحتاج تفعيل', color: 'text-destructive', bg: 'bg-destructive/10', emoji: '🔴', desc: 'الجهة في بداية نشاطها أو لديها عمليات محدودة جداً', isCelebration: false };
};

const getStatAdvice = (_label: string, value: number, max: number) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  if (pct >= 80) return 'ممتاز';
  if (pct >= 50) return 'جيد';
  if (pct >= 20) return 'يحتاج تحسين';
  if (value === 0) return 'لم يبدأ بعد';
  return 'قيد النمو';
};

/* ── Animated counter ── */
export const AnimDigit = ({ value, suffix }: { value: number; suffix?: string }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (value === 0) { setCurrent(0); return; }
    const start = performance.now();
    const dur = 900;
    const from = current;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setCurrent(Math.round(from + (1 - Math.pow(1 - p, 3)) * (value - from)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{formatNumber(current)}{suffix || ''}</>;
};

/* ── Trend arrow ── */
export const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
  if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-destructive" />;
  return <Activity className="w-2.5 h-2.5 text-muted-foreground" />;
};

/* ── Pulse ring ── */
export const PulseRing = ({ color, delay = 0 }: { color: string; delay?: number }) => (
  <motion.span
    className={cn("absolute inset-0 rounded-full border-2", color)}
    initial={{ scale: 0.8, opacity: 0.8 }}
    animate={{ scale: 1.8, opacity: 0 }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
  />
);

/* ── Mini sparkline ── */
export const MiniSpark = ({ color = 'hsl(var(--primary))' }: { color?: string }) => {
  const pts = useMemo(() => [8, 12, 6, 14, 10, 16, 9, 13], []);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * 6},${20 - y}`).join(' ');
  return (
    <svg width="42" height="20" className="opacity-40">
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
    </svg>
  );
};

/* ═══════════ PERFORMANCE GAUGE ═══════════ */
const PerformanceGauge = memo(({ score, label, radarStats }: { score: number; label: string; radarStats?: RadarStat[] }) => {
  const size = 90;
  const strokeW = 6;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const startAngle = 135;
  const sweepAngle = 270;
  const pct = Math.min(Math.max(score / 100, 0), 1);
  const dashLen = circ * (sweepAngle / 360) * pct;
  const dashGap = circ - dashLen;
  const color = score >= 80 ? 'hsl(var(--primary))' : score >= 50 ? 'hsl(45, 93%, 47%)' : 'hsl(var(--destructive))';
  const glowColor = score >= 80 ? 'hsl(var(--primary) / 0.4)' : score >= 50 ? 'hsl(45, 93%, 47%, 0.4)' : 'hsl(var(--destructive) / 0.4)';
  const level = getHealthLevel(score);

  const gaugeElement = (
    <div className="relative flex flex-col items-center cursor-pointer">
      {level.isCelebration && (
        <motion.div className="absolute -inset-2 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }} />
      )}
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <filter id="gaugeGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          {level.isCelebration && (
            <linearGradient id="celebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(142, 76%, 36%)" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          )}
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeW}
          strokeDasharray={`${circ * sweepAngle / 360} ${circ * (1 - sweepAngle / 360)}`}
          strokeDashoffset={-circ * startAngle / 360} strokeLinecap="round" opacity="0.2" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={level.isCelebration ? 'url(#celebGrad)' : color} strokeWidth={level.isCelebration ? strokeW + 1 : strokeW}
          strokeDasharray={`${dashLen} ${dashGap}`}
          strokeDashoffset={-circ * startAngle / 360} strokeLinecap="round" filter="url(#gaugeGlow)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dashLen} ${dashGap}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const ang = ((startAngle + sweepAngle * t) * Math.PI) / 180;
          const x1 = size / 2 + (r + 4) * Math.cos(ang);
          const y1 = size / 2 + (r + 4) * Math.sin(ang);
          const x2 = size / 2 + (r + 8) * Math.cos(ang);
          const y2 = size / 2 + (r + 8) * Math.sin(ang);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        {level.isCelebration ? (
          <motion.span className="text-lg leading-none" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🏆</motion.span>
        ) : (
          <motion.span className="text-xl font-black font-mono tabular-nums leading-none" style={{ color }} key={score} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{formatNumber(score)}</motion.span>
        )}
        <span className="text-[7px] font-mono text-muted-foreground mt-0.5">{label}</span>
      </div>
      <motion.div className="absolute inset-2 rounded-full"
        style={{ boxShadow: `0 0 ${level.isCelebration ? '30' : '20'}px ${glowColor}` }}
        animate={{ opacity: level.isCelebration ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3] }}
        transition={{ duration: level.isCelebration ? 1 : 2, repeat: Infinity }} />
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{gaugeElement}</PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl overflow-hidden" align="center" dir="rtl">
        {level.isCelebration && (
          <motion.div className="bg-gradient-to-l from-primary/20 via-primary/10 to-primary/20 p-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="text-3xl mb-1" animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🎉🏆🎉</motion.div>
            <p className="text-sm font-bold text-primary">تهانينا! إنجاز استثنائي</p>
            <p className="text-[11px] text-muted-foreground">جميع المؤشرات وصلت للذروة</p>
          </motion.div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><HeartPulse className="w-5 h-5 text-primary" /><span className="font-bold text-sm">مؤشر صحة الأداء</span></div>
            <Badge variant="outline" className={`${level.color} text-xs font-bold`}>{level.emoji} {level.label}</Badge>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">النتيجة الإجمالية</span><span className={`font-bold ${level.color}`}>{score}%</span></div>
            <Progress value={score} className="h-2.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>0% - ضعيف</span><span>50% - متوسط</span><span>100% - ممتاز</span></div>
          </div>
          <p className={`text-xs leading-relaxed p-2 rounded-lg ${level.isCelebration ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/50 text-muted-foreground'}`}>{level.desc}</p>
          {level.isCelebration && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">🥇</div>
              <div><p className="text-xs font-bold text-foreground">شارة الأداء المثالي</p><p className="text-[10px] text-muted-foreground">حققت الجهة أقصى معدل تشغيلي ممكن</p></div>
            </motion.div>
          )}
          {radarStats && radarStats.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">تفصيل المؤشرات:</p>
              {radarStats.map((stat) => {
                const max = stat.max || Math.max(stat.value, 1);
                const statPct = Math.round(Math.min(stat.value / max, 1) * 100);
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30">
                    <StatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: stat.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px]"><span className="font-medium truncate">{stat.label}</span><span className="text-muted-foreground">{stat.value}/{max}</span></div>
                      <div className="w-full h-1 rounded-full bg-border/50 mt-0.5"><motion.div className="h-full rounded-full" style={{ backgroundColor: stat.color }} initial={{ width: 0 }} animate={{ width: `${statPct}%` }} transition={{ duration: 0.8 }} /></div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{statPct === 100 ? '✅ مكتمل' : getStatAdvice(stat.label, stat.value, max)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-[10px] font-semibold text-foreground">كيف يُحسب هذا المؤشر؟</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">يقيس المؤشر كفاءة العمليات التشغيلية بدون حدود ثابتة — لا يوجد سقف لعدد الشحنات أو السائقين أو أي مورد. يتم حساب نسبة الإنجاز لكل مؤشر نسبةً لإجمالي النشاط الفعلي، ثم يُؤخذ المتوسط العام. المؤشر ينمو مع نمو الجهة بلا قيود.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
PerformanceGauge.displayName = 'PerformanceGauge';

export default PerformanceGauge;

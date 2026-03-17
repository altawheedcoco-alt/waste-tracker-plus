import { memo, useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Sparkles, Activity, Shield, Zap, Signal, Wifi, Database, Cpu, BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye, Radio, Satellite, Gauge, Timer, Target, ArrowUpRight, ArrowDownRight, Flame, Boxes, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/numberFormat';

export interface RadarStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  max?: number;
  trend?: 'up' | 'down' | 'stable';
  suffix?: string;
}

interface DashboardV2HeaderProps {
  userName: string;
  orgName: string;
  orgLabel: string;
  icon: LucideIcon;
  gradient?: string;
  children?: React.ReactNode;
  radarStats?: RadarStat[];
}

/* ── English animated counter ── */
const AnimDigit = ({ value, suffix }: { value: number; suffix?: string }) => {
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

/* ── Trend arrow icon ── */
const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
  if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-destructive" />;
  return <Activity className="w-2.5 h-2.5 text-muted-foreground" />;
};

/* ── Pulse ring indicator ── */
const PulseRing = ({ color, delay = 0 }: { color: string; delay?: number }) => (
  <motion.span
    className={cn("absolute inset-0 rounded-full border-2", color)}
    initial={{ scale: 0.8, opacity: 0.8 }}
    animate={{ scale: 1.8, opacity: 0 }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
  />
);

/* ── Mini sparkline SVG ── */
const MiniSpark = ({ color = 'hsl(var(--primary))' }: { color?: string }) => {
  const pts = useMemo(() => Array.from({ length: 8 }, () => 4 + Math.random() * 12), []);
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * 6},${20 - y}`).join(' ');
  return (
    <svg width="42" height="20" className="opacity-40">
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
    </svg>
  );
};

/* ── Radar polygon SVG ── */
const RadarChart = ({ stats }: { stats: RadarStat[] }) => {
  const size = 130;
  const cx = size / 2, cy = size / 2, radius = 50;
  const n = stats.length;

  const getPoint = (i: number, pct: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = radius * pct;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const rings = [0.33, 0.66, 1];
  const gridPaths = rings.map(r => {
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, r));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  });

  const dataPts = stats.map((s, i) => {
    const pct = Math.min(s.value / (s.max || Math.max(s.value, 1)), 1);
    return getPoint(i, Math.max(pct, 0.1));
  });
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  const axes = Array.from({ length: n }, (_, i) => getPoint(i, 1));

  return (
    <svg width={size} height={size} className="shrink-0 drop-shadow-lg">
      <defs>
        <linearGradient id="radarFill2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <filter id="rGlow2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.3 + i * 0.15} />)}
      {axes.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.25" />)}
      <motion.path d={dataPath} fill="url(#radarFill2)" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round" filter="url(#rGlow2)"
        initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {dataPts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08, type: 'spring' }} />
      ))}
      <motion.circle cx={cx} cy={cy} r="2.5" fill="hsl(var(--primary))" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.line x1={cx} y1={cy} x2={cx} y2={cy - radius} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.25"
        style={{ transformOrigin: `${cx}px ${cy}px` }} animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
      {/* Outer labels */}
      {stats.map((s, i) => {
        const pt = getPoint(i, 1.28);
        return <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="hsl(var(--muted-foreground))" className="font-mono">{formatNumber(s.value)}</text>;
      })}
    </svg>
  );
};

/* ── System status ticker icons ── */
const systemIcons = [
  { icon: Wifi, label: 'NET', ok: true },
  { icon: Database, label: 'DB', ok: true },
  { icon: Cpu, label: 'CPU', ok: true },
  { icon: Shield, label: 'SEC', ok: true },
  { icon: Signal, label: 'SIG', ok: true },
  { icon: Satellite, label: 'GPS', ok: true },
];

/* ══════════════════════════════════════════ MAIN COMPONENT ══════════════════════════════════════════ */
const DashboardV2Header = memo(({ userName, orgName, orgLabel, icon: Icon, gradient = 'from-primary to-primary/70', children, radarStats }: DashboardV2HeaderProps) => {
  const displayName = userName || orgName || 'المستخدم';
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); setTick(p => p + 1); }, 1000);
    return () => clearInterval(t);
  }, []);

  const hasRadar = radarStats && radarStats.length > 0;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'صباح النور' : hour < 18 ? 'مساء النور' : 'مساء الخير';

  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const totalValue = useMemo(() => radarStats?.reduce((s, r) => s + r.value, 0) || 0, [radarStats]);

  return (
    <div className="flex flex-col gap-3">
      {hasRadar ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">

          {/* BG grid + glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <motion.div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/[0.04] rounded-full blur-[100px]"
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
            <motion.div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/[0.03] rounded-full blur-[80px]"
              animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 8, repeat: Infinity }} />
          </div>

          <div className="relative z-10 p-3 sm:p-4">
            {/* ── TOP BAR ── */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* LIVE badge */}
                <motion.div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
                  animate={{ borderColor: ['hsl(var(--primary) / 0.2)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-[10px] font-mono text-primary font-black tracking-wider">LIVE</span>
                </motion.div>

                {/* Digital clock */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/40 border border-border/30" dir="ltr">
                  <Timer className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] font-mono font-bold text-foreground tabular-nums">{timeStr}</span>
                  <span className="text-border/60">|</span>
                  <span className="text-[9px] font-mono text-muted-foreground tabular-nums">{dateStr}</span>
                </div>

                {/* System status icons */}
                <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/20">
                  {systemIcons.map((si, i) => (
                    <motion.div key={si.label} className="flex items-center gap-0.5 px-1" title={si.label}
                      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
                      <si.icon className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[7px] font-mono text-muted-foreground">{si.label}</span>
                    </motion.div>
                  ))}
                </div>

                <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-[16px] gap-0.5 border-primary/20 text-primary">
                  <Sparkles className="w-2 h-2" /> v4.0
                </Badge>
              </div>

              {/* Name + org */}
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <h1 className="font-black text-base sm:text-xl text-foreground leading-tight">
                    {greeting}، <span className="text-primary">{displayName}</span>
                  </h1>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    {orgName && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="w-3 h-3 text-primary/60" />
                        <span className="truncate">{orgName} — {orgLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
                <motion.div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 relative", gradient)}
                  whileHover={{ scale: 1.1, rotate: 5 }}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  <PulseRing color="border-primary/30" />
                </motion.div>
              </div>
            </div>

            {/* ── MAIN: Radar + Stats Grid ── */}
            <div className="flex items-stretch gap-3 sm:gap-4">
              {/* Radar */}
              <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                <RadarChart stats={radarStats!} />
                <div className="flex items-center gap-1 mt-1">
                  <Radio className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[8px] font-mono text-muted-foreground">RADAR ACTIVE</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-3 gap-1.5 sm:gap-2">
                {radarStats!.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                    className="group relative rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-2 sm:p-2.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-default">
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center justify-between mb-1.5 relative z-10">
                      {/* Status dot + sparkline */}
                      <div className="flex items-center gap-1">
                        <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
                        <MiniSpark />
                      </div>
                      {/* Icon */}
                      <motion.div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", `bg-${stat.color.replace('text-', '')}/10`)}
                        whileHover={{ scale: 1.15, rotate: 10 }}>
                        <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                      </motion.div>
                    </div>

                    <div className="text-right relative z-10">
                      <div className="flex items-baseline gap-1 justify-end">
                        <p className={cn("text-lg sm:text-2xl font-black tabular-nums tracking-tight leading-none font-mono", stat.color)} dir="ltr">
                          <AnimDigit value={stat.value} suffix={stat.suffix} />
                        </p>
                        {stat.trend && <TrendIcon trend={stat.trend} />}
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 truncate">{stat.label}</p>
                    </div>

                    {/* Bottom progress bar */}
                    <div className="mt-1.5 h-[2px] w-full bg-border/20 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary/40 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min((stat.value / (stat.max || Math.max(stat.value, 1))) * 100, 100)}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: 'easeOut' }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── BOTTOM TICKER ── */}
            <motion.div className="mt-3 flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <div className="flex items-center gap-3">
                {/* Total counter */}
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground">TOTAL:</span>
                  <span className="text-xs font-mono font-black text-primary tabular-nums" dir="ltr">
                    <AnimDigit value={totalValue} />
                  </span>
                </div>
                <span className="text-border/40">|</span>
                {/* Uptime */}
                <div className="hidden sm:flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-mono text-muted-foreground">UPTIME:</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-500" dir="ltr">99.9%</span>
                </div>
                <span className="text-border/40 hidden sm:inline">|</span>
                {/* Throughput */}
                <div className="hidden sm:flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-mono text-muted-foreground">PERF:</span>
                  <span className="text-[10px] font-mono font-bold text-amber-500" dir="ltr">HIGH</span>
                </div>
              </div>

              {/* Right side: more status icons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">REGION: EG</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">MONITOR: ON</span>
                </div>
                <motion.div className="flex items-center gap-0.5"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-[8px] font-mono text-orange-500 font-bold">ACTIVE</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Bottom scan line */}
          <motion.div className="h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
        </motion.div>
      ) : (
        /* ═══ CLASSIC MODE ═══ */
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0 text-right">
            <h1 className="font-bold text-lg sm:text-2xl bg-gradient-to-l from-foreground via-foreground to-foreground/60 bg-clip-text truncate">
              {greeting}، {displayName}
            </h1>
            <div className="flex items-center gap-1.5 justify-end mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-[18px] gap-0.5 border-primary/20 text-primary shrink-0">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> v4.0
              </Badge>
              {orgName && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">{orgName} - {orgLabel}</span>
                </p>
              )}
            </div>
          </div>
          <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0", gradient)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
      )}

      {children && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
          {children}
        </div>
      )}
    </div>
  );
});

DashboardV2Header.displayName = 'DashboardV2Header';

export default DashboardV2Header;

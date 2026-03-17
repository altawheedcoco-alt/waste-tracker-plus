import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  LucideIcon, Sparkles, Activity, Shield, Zap, Signal, Wifi, Database, Cpu,
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye, Radio,
  Satellite, Gauge, Timer, Target, ArrowUpRight, ArrowDownRight, Flame, Boxes,
  Globe2, CloudRain, Sun, CloudSun, Wind, Thermometer, AlertCircle, Bell,
  MapPin, Navigation, Truck, CloudLightning, Snowflake, Cloud, BellRing,
  ShieldAlert, CircleAlert, Info, XCircle, ChevronLeft, ChevronRight,
  Radar, Waves, Fingerprint, ScanLine, MonitorCheck, ServerCrash, BatteryCharging,
  CircuitBoard, Antenna, LocateFixed, Siren, HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/numberFormat';

/* ═══════════ TYPES ═══════════ */
export interface RadarStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  max?: number;
  trend?: 'up' | 'down' | 'stable';
  suffix?: string;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp?: string;
  icon?: LucideIcon;
}

export interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' | 'snowy';
  humidity: number;
  windSpeed: number;
  roadWarning?: string;
}

export interface HeatmapCell {
  region: string;
  value: number;
  max: number;
}

interface DashboardV2HeaderProps {
  userName: string;
  orgName: string;
  orgLabel: string;
  icon: LucideIcon;
  gradient?: string;
  children?: React.ReactNode;
  radarStats?: RadarStat[];
  alerts?: AlertItem[];
  weather?: WeatherData;
  heatmapData?: HeatmapCell[];
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

/* ── Trend arrow ── */
const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
  if (trend === 'down') return <ArrowDownRight className="w-3 h-3 text-destructive" />;
  return <Activity className="w-2.5 h-2.5 text-muted-foreground" />;
};

/* ── Pulse ring ── */
const PulseRing = ({ color, delay = 0 }: { color: string; delay?: number }) => (
  <motion.span
    className={cn("absolute inset-0 rounded-full border-2", color)}
    initial={{ scale: 0.8, opacity: 0.8 }}
    animate={{ scale: 1.8, opacity: 0 }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
  />
);

/* ── Mini sparkline ── */
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

/* ═══════════ CIRCULAR GAUGE METER ═══════════ */
const PerformanceGauge = memo(({ score, label }: { score: number; label: string }) => {
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

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        <defs>
          <filter id="gaugeGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* BG arc */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeW}
          strokeDasharray={`${circ * sweepAngle / 360} ${circ * (1 - sweepAngle / 360)}`}
          strokeDashoffset={-circ * startAngle / 360} strokeLinecap="round" opacity="0.2" />
        {/* Value arc */}
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${dashLen} ${dashGap}`}
          strokeDashoffset={-circ * startAngle / 360} strokeLinecap="round" filter="url(#gaugeGlow)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dashLen} ${dashGap}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
        {/* Tick marks */}
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
        <motion.span className="text-xl font-black font-mono tabular-nums leading-none"
          style={{ color }}
          key={score}
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {formatNumber(score)}
        </motion.span>
        <span className="text-[7px] font-mono text-muted-foreground mt-0.5">{label}</span>
      </div>
      {/* Glow ring */}
      <motion.div className="absolute inset-2 rounded-full"
        style={{ boxShadow: `0 0 20px ${glowColor}` }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }} />
    </div>
  );
});
PerformanceGauge.displayName = 'PerformanceGauge';

/* ═══════════ SMART ALERT TICKER ═══════════ */
const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
};

const AlertTicker = memo(({ alerts }: { alerts: AlertItem[] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (alerts.length <= 1) return;
    const t = setInterval(() => setIdx(p => (p + 1) % alerts.length), 4000);
    return () => clearInterval(t);
  }, [alerts.length]);

  if (!alerts.length) return null;
  const alert = alerts[idx];
  const cfg = SEVERITY_CONFIG[alert.severity];
  const AlertIcon = alert.icon || cfg.icon;

  return (
    <motion.div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px]", cfg.bg, cfg.border)}
      layout>
      <motion.div animate={alert.severity === 'critical' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}>
        <AlertIcon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span key={idx} className={cn("font-medium truncate", cfg.color)}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}>
          {alert.message}
        </motion.span>
      </AnimatePresence>
      {alerts.length > 1 && (
        <div className="flex items-center gap-0.5 shrink-0 mr-auto">
          <button onClick={() => setIdx(p => (p - 1 + alerts.length) % alerts.length)}
            className="hover:bg-muted/50 rounded p-0.5"><ChevronRight className="w-3 h-3 text-muted-foreground" /></button>
          <span className="text-[8px] font-mono text-muted-foreground tabular-nums" dir="ltr">{idx + 1}/{alerts.length}</span>
          <button onClick={() => setIdx(p => (p + 1) % alerts.length)}
            className="hover:bg-muted/50 rounded p-0.5"><ChevronLeft className="w-3 h-3 text-muted-foreground" /></button>
        </div>
      )}
    </motion.div>
  );
});
AlertTicker.displayName = 'AlertTicker';

/* ═══════════ MINI WEATHER WIDGET ═══════════ */
const WEATHER_ICONS: Record<string, LucideIcon> = {
  sunny: Sun, cloudy: Cloud, rainy: CloudRain, stormy: CloudLightning, windy: Wind, snowy: Snowflake,
};

const WeatherWidget = memo(({ weather }: { weather: WeatherData }) => {
  const WIcon = WEATHER_ICONS[weather.condition] || CloudSun;
  const hasRoadWarning = !!weather.roadWarning;

  return (
    <motion.div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[10px]",
      hasRoadWarning ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30 border-border/30"
    )}
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
      <motion.div animate={weather.condition === 'stormy' ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}>
        <WIcon className={cn("w-4 h-4", hasRoadWarning ? "text-amber-500" : "text-primary")} />
      </motion.div>
      <div className="flex items-center gap-2 font-mono" dir="ltr">
        <span className="font-bold text-foreground">{weather.temp}°C</span>
        <span className="text-border/50">|</span>
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <Waves className="w-2.5 h-2.5" />{weather.humidity}%
        </span>
        <span className="text-border/50">|</span>
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <Wind className="w-2.5 h-2.5" />{weather.windSpeed}km/h
        </span>
      </div>
      {hasRoadWarning && (
        <motion.span className="text-amber-500 font-bold truncate flex items-center gap-0.5"
          animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <AlertTriangle className="w-3 h-3 shrink-0" />{weather.roadWarning}
        </motion.span>
      )}
    </motion.div>
  );
});
WeatherWidget.displayName = 'WeatherWidget';

/* ═══════════ LIVE HEATMAP ═══════════ */
const LiveHeatmap = memo(({ cells }: { cells: HeatmapCell[] }) => {
  const getHeat = (val: number, max: number) => {
    const pct = Math.min(val / (max || 1), 1);
    if (pct > 0.75) return { bg: 'bg-destructive/60', text: 'text-destructive-foreground', glow: true };
    if (pct > 0.45) return { bg: 'bg-amber-500/50', text: 'text-amber-50', glow: false };
    if (pct > 0.15) return { bg: 'bg-primary/40', text: 'text-primary-foreground', glow: false };
    return { bg: 'bg-muted/40', text: 'text-muted-foreground', glow: false };
  };

  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((cell, i) => {
        const heat = getHeat(cell.value, cell.max);
        return (
          <motion.div key={cell.region}
            className={cn("relative flex flex-col items-center justify-center rounded-md px-2 py-1 min-w-[52px]", heat.bg)}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            title={`${cell.region}: ${cell.value}/${cell.max}`}>
            {heat.glow && (
              <motion.div className="absolute inset-0 rounded-md bg-destructive/20"
                animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            <span className={cn("text-xs font-black font-mono tabular-nums relative z-10", heat.text)} dir="ltr">
              {formatNumber(cell.value)}
            </span>
            <span className="text-[7px] font-mono opacity-80 relative z-10 truncate max-w-[48px]">{cell.region}</span>
          </motion.div>
        );
      })}
    </div>
  );
});
LiveHeatmap.displayName = 'LiveHeatmap';

/* ═══════════ RADAR CHART ═══════════ */
const RadarChart = ({ stats }: { stats: RadarStat[] }) => {
  const size = 120;
  const cx = size / 2, cy = size / 2, radius = 46;
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
        <linearGradient id="radarFill3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <filter id="rGlow3"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.3 + i * 0.15} />)}
      {axes.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.4" opacity="0.25" />)}
      <motion.path d={dataPath} fill="url(#radarFill3)" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round" filter="url(#rGlow3)"
        initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {dataPts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08, type: 'spring' }} />
      ))}
      <motion.circle cx={cx} cy={cy} r="2" fill="hsl(var(--primary))" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.line x1={cx} y1={cy} x2={cx} y2={cy - radius} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.2"
        style={{ transformOrigin: `${cx}px ${cy}px` }} animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
      {stats.map((s, i) => {
        const pt = getPoint(i, 1.3);
        return <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="hsl(var(--muted-foreground))" className="font-mono">{formatNumber(s.value)}</text>;
      })}
    </svg>
  );
};

/* ── System icons ── */
const systemIcons = [
  { icon: Wifi, label: 'NET' }, { icon: Database, label: 'DB' }, { icon: Cpu, label: 'CPU' },
  { icon: Shield, label: 'SEC' }, { icon: Signal, label: 'SIG' }, { icon: Satellite, label: 'GPS' },
  { icon: Fingerprint, label: 'AUTH' }, { icon: CircuitBoard, label: 'IOT' },
  { icon: BatteryCharging, label: 'PWR' }, { icon: Antenna, label: 'RF' },
];

/* ══════════════════════════════ MAIN COMPONENT ══════════════════════════════ */
const DashboardV2Header = memo(({
  userName, orgName, orgLabel, icon: Icon, gradient = 'from-primary to-primary/70',
  children, radarStats, alerts = [], weather, heatmapData
}: DashboardV2HeaderProps) => {
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

  // Performance score (derived from stats)
  const performanceScore = useMemo(() => {
    if (!radarStats?.length) return 0;
    const sum = radarStats.reduce((acc, s) => acc + Math.min(s.value / (s.max || Math.max(s.value, 1)), 1), 0);
    return Math.round((sum / radarStats.length) * 100);
  }, [radarStats]);

  return (
    <div className="flex flex-col gap-3">
      {hasRadar ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-border/40 bg-card overflow-hidden">

          {/* BG grid + glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <motion.div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/[0.04] rounded-full blur-[100px]"
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
            <motion.div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/[0.03] rounded-full blur-[80px]"
              animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 8, repeat: Infinity }} />
          </div>

          <div className="relative z-10 p-2.5 sm:p-3.5">
            {/* ── ROW 1: TOP BAR ── */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1 flex-wrap">
                {/* LIVE */}
                <motion.div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
                  animate={{ borderColor: ['hsl(var(--primary) / 0.2)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  <span className="text-[9px] font-mono text-primary font-black tracking-wider">LIVE</span>
                </motion.div>

                {/* Clock */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/40 border border-border/30" dir="ltr">
                  <Timer className="w-3 h-3 text-primary/70" />
                  <span className="text-[9px] font-mono font-bold text-foreground tabular-nums">{timeStr}</span>
                  <span className="text-border/50">|</span>
                  <span className="text-[8px] font-mono text-muted-foreground tabular-nums">{dateStr}</span>
                </div>

                {/* System status icons */}
                <div className="hidden lg:flex items-center gap-0 px-1 py-0.5 rounded-md bg-muted/30 border border-border/20">
                  {systemIcons.map((si, i) => (
                    <motion.div key={si.label} className="flex items-center gap-0 px-0.5" title={si.label}
                      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.04 }}>
                      <si.icon className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[6px] font-mono text-muted-foreground">{si.label}</span>
                    </motion.div>
                  ))}
                </div>

                <Badge variant="outline" className="text-[7px] px-1 py-0 h-[14px] gap-0.5 border-primary/20 text-primary">
                  <Sparkles className="w-2 h-2" /> v5.0
                </Badge>
              </div>

              {/* Name + org */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <h1 className="font-black text-sm sm:text-lg text-foreground leading-tight">
                    {greeting}، <span className="text-primary">{displayName}</span>
                  </h1>
                  {orgName && (
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Shield className="w-2.5 h-2.5 text-primary/60" />
                      <span className="truncate">{orgName} — {orgLabel}</span>
                    </p>
                  )}
                </div>
                <motion.div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 relative", gradient)}
                  whileHover={{ scale: 1.1, rotate: 5 }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <PulseRing color="border-primary/30" />
                </motion.div>
              </div>
            </div>

            {/* ── ROW 2: Alert Ticker + Weather ── */}
            {(alerts.length > 0 || weather) && (
              <div className="flex flex-col sm:flex-row gap-1.5 mb-2">
                {alerts.length > 0 && (
                  <div className="flex-1 min-w-0">
                    <AlertTicker alerts={alerts} />
                  </div>
                )}
                {weather && <WeatherWidget weather={weather} />}
              </div>
            )}

            {/* ── ROW 3: Gauge + Radar + Stats + Heatmap ── */}
            <div className="flex items-stretch gap-2 sm:gap-3">
              {/* Performance Gauge */}
              <div className="hidden md:flex flex-col items-center gap-1 shrink-0 justify-center">
                <PerformanceGauge score={performanceScore} label="HEALTH" />
                <div className="flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[7px] font-mono text-muted-foreground">SCORE</span>
                </div>
              </div>

              {/* Radar */}
              <div className="hidden sm:flex flex-col items-center gap-0.5 shrink-0 justify-center">
                <RadarChart stats={radarStats!} />
                <div className="flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-primary animate-pulse" />
                  <span className="text-[7px] font-mono text-muted-foreground">RADAR</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-3 gap-1 sm:gap-1.5">
                {radarStats!.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                    className="group relative rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm p-1.5 sm:p-2 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 overflow-hidden cursor-default">
                    <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1 relative z-10">
                      <div className="flex items-center gap-0.5">
                        <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
                        <MiniSpark />
                      </div>
                      <motion.div className="w-6 h-6 rounded-md flex items-center justify-center bg-muted/30"
                        whileHover={{ scale: 1.15, rotate: 10 }}>
                        <stat.icon className={cn("w-3 h-3", stat.color)} />
                      </motion.div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-baseline gap-0.5 justify-end">
                        <p className={cn("text-base sm:text-xl font-black tabular-nums tracking-tight leading-none font-mono", stat.color)} dir="ltr">
                          <AnimDigit value={stat.value} suffix={stat.suffix} />
                        </p>
                        {stat.trend && <TrendIcon trend={stat.trend} />}
                      </div>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                    </div>
                    <div className="mt-1 h-[2px] w-full bg-border/20 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary/40 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min((stat.value / (stat.max || Math.max(stat.value, 1))) * 100, 100)}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 0.04, ease: 'easeOut' }} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Heatmap */}
              {heatmapData && heatmapData.length > 0 && (
                <div className="hidden lg:flex flex-col gap-1 shrink-0 justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-[7px] font-mono text-muted-foreground font-bold">HEATMAP</span>
                  </div>
                  <LiveHeatmap cells={heatmapData} />
                </div>
              )}
            </div>

            {/* ── ROW 4: BOTTOM TICKER ── */}
            <motion.div className="mt-2 flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-border/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 shrink-0">
                  <Boxes className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-mono text-muted-foreground">TOTAL:</span>
                  <span className="text-[10px] font-mono font-black text-primary tabular-nums" dir="ltr"><AnimDigit value={totalValue} /></span>
                </div>
                <span className="text-border/40 shrink-0">|</span>
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">UPTIME:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">99.9%</span>
                </div>
                <span className="text-border/40 hidden sm:inline shrink-0">|</span>
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">PERF:</span>
                  <span className="text-[9px] font-mono font-bold text-amber-500" dir="ltr">HIGH</span>
                </div>
                <span className="text-border/40 hidden md:inline shrink-0">|</span>
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  <LocateFixed className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">TRACKING:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">ACTIVE</span>
                </div>
                <span className="text-border/40 hidden md:inline shrink-0">|</span>
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  <Siren className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">ALERTS:</span>
                  <span className={cn("text-[9px] font-mono font-bold", alerts.length > 0 ? "text-amber-500" : "text-emerald-500")} dir="ltr">
                    {alerts.length > 0 ? formatNumber(alerts.length) : 'CLEAR'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Globe2 className="w-2.5 h-2.5 text-primary/60" />
                  <span className="text-[7px] font-mono text-muted-foreground">EG</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <MonitorCheck className="w-2.5 h-2.5 text-primary/60" />
                  <span className="text-[7px] font-mono text-muted-foreground">ON</span>
                </div>
                <motion.div className="flex items-center gap-0.5"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-[7px] font-mono text-orange-500 font-bold">ACTIVE</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scan line */}
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
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> v5.0
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

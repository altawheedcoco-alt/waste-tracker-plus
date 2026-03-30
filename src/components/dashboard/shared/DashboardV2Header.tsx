import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  LucideIcon, Sparkles, Activity, Shield, Zap, Signal, Wifi, Database, Cpu,
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye, Radio,
  Satellite, Gauge, Timer, Target, ArrowUpRight, ArrowDownRight, Flame, Boxes,
  Globe2, CloudRain, Sun, CloudSun, Wind, Thermometer, AlertCircle, Bell,
  MapPin, Navigation, Truck, CloudLightning, Snowflake, Cloud, BellRing,
  ShieldAlert, CircleAlert, Info, XCircle, ChevronLeft, ChevronRight,
  Radar, Waves, Fingerprint, ScanLine, MonitorCheck, ServerCrash, BatteryCharging, ChevronUp, ChevronDown,
  CircuitBoard, Antenna, LocateFixed, Siren, HeartPulse, Droplets, Eye as EyeIcon,
  CloudFog, Sunrise, Sunset, Clock, ThermometerSun,
  FileSignature, Wallet, Users, ScrollText, Package, Lock, RefreshCw, HardDrive,
  MessageSquare, ClipboardCheck, Cog, PlugZap, Brain, FileCheck,
} from 'lucide-react';
import type { RealWeatherData, HourlyForecast } from '@/hooks/useRealWeather';
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
  route?: string;
}

export interface AlertDetailItem {
  label: string;
  value: string;
}

export interface AlertItem {
  id: string;
  message: string;
  subtitle?: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp?: string;
  icon?: LucideIcon;
  type?: string;
  route?: string;
  isRead?: boolean;
  details?: AlertDetailItem[];
}

export interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' | 'snowy' | 'partly_cloudy' | 'foggy';
  conditionLabel?: string;
  humidity: number;
  windSpeed: number;
  roadWarning?: string;
  feelsLike?: number;
  uvIndex?: number;
  precipProb?: number;
  pressure?: number;
  locationName?: string;
  hourlyForecast?: HourlyForecast[];
  isLoading?: boolean;
  refreshFromGPS?: () => void;
  isLocating?: boolean;
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
  onRefresh?: () => void;
  onAlertClick?: (alert: AlertItem) => void;
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

/* ═══════════ HEALTH EXPLANATION HELPERS ═══════════ */
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

/* ═══════════ CIRCULAR GAUGE METER ═══════════ */
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
      {/* Celebration ring at 100% */}
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
          <motion.span className="text-lg leading-none"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}>
            🏆
          </motion.span>
        ) : (
          <motion.span className="text-xl font-black font-mono tabular-nums leading-none"
            style={{ color }}
            key={score}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {formatNumber(score)}
          </motion.span>
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
        {/* Celebration banner */}
        {level.isCelebration && (
          <motion.div
            className="bg-gradient-to-l from-primary/20 via-primary/10 to-primary/20 p-3 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="text-3xl mb-1"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}>
              🎉🏆🎉
            </motion.div>
            <p className="text-sm font-bold text-primary">تهانينا! إنجاز استثنائي</p>
            <p className="text-[11px] text-muted-foreground">جميع المؤشرات وصلت للذروة</p>
          </motion.div>
        )}

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">مؤشر صحة الأداء</span>
            </div>
            <Badge variant="outline" className={`${level.color} text-xs font-bold`}>
              {level.emoji} {level.label}
            </Badge>
          </div>

          {/* Score bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">النتيجة الإجمالية</span>
              <span className={`font-bold ${level.color}`}>{score}%</span>
            </div>
            <Progress value={score} className="h-2.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0% - ضعيف</span>
              <span>50% - متوسط</span>
              <span>100% - ممتاز</span>
            </div>
          </div>

          {/* Description */}
          <p className={`text-xs leading-relaxed p-2 rounded-lg ${level.isCelebration ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/50 text-muted-foreground'}`}>
            {level.desc}
          </p>

          {/* Achievement badge at 100% */}
          {level.isCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">🥇</div>
              <div>
                <p className="text-xs font-bold text-foreground">شارة الأداء المثالي</p>
                <p className="text-[10px] text-muted-foreground">حققت الجهة أقصى معدل تشغيلي ممكن</p>
              </div>
            </motion.div>
          )}

          {/* Stats breakdown */}
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
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium truncate">{stat.label}</span>
                        <span className="text-muted-foreground">{stat.value}/{max}</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-border/50 mt-0.5">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: stat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${statPct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {statPct === 100 ? '✅ مكتمل' : getStatAdvice(stat.label, stat.value, max)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it's calculated */}
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-[10px] font-semibold text-foreground">كيف يُحسب هذا المؤشر؟</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              يقيس المؤشر كفاءة العمليات التشغيلية بدون حدود ثابتة — لا يوجد سقف لعدد الشحنات أو السائقين أو أي مورد. 
              يتم حساب نسبة الإنجاز لكل مؤشر نسبةً لإجمالي النشاط الفعلي، ثم يُؤخذ المتوسط العام. المؤشر ينمو مع نمو الجهة بلا قيود.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
PerformanceGauge.displayName = 'PerformanceGauge';

/* ═══════════ SMART ALERT TICKER (MULTI-PURPOSE) ═══════════ */
const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
};

const ALERT_TYPE_FILTERS = [
  { type: 'all', icon: Bell, label: 'الكل' },
  { type: 'notification', icon: Bell, label: 'إشعارات' },
  { type: 'shipment', icon: Package, label: 'شحنات' },
  { type: 'driver', icon: Users, label: 'سائقين' },
  { type: 'vehicle', icon: Truck, label: 'مركبات' },
  { type: 'message', icon: MessageSquare, label: 'رسائل' },
  { type: 'partner', icon: Users, label: 'شركاء' },
  { type: 'signature', icon: FileSignature, label: 'توقيعات' },
  { type: 'contract', icon: ScrollText, label: 'عقود' },
  { type: 'receipt', icon: ClipboardCheck, label: 'إيصالات' },
  { type: 'work_order', icon: Truck, label: 'أوامر عمل' },
  { type: 'activity', icon: Activity, label: 'النشاط' },
  { type: 'log', icon: ScrollText, label: 'السجل' },
  { type: 'approval', icon: FileCheck, label: 'الموافقات' },
];

const AlertTicker = memo(({ alerts, onAlertClick }: { alerts: AlertItem[]; onAlertClick?: (alert: AlertItem) => void }) => {
  const [idx, setIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return alerts;
    return alerts.filter(a => a.type === activeFilter);
  }, [alerts, activeFilter]);

  // Group similar alerts for summary
  const groupedSummary = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const a of alerts) {
      const key = a.type || 'other';
      groups[key] = (groups[key] || 0) + 1;
    }
    return groups;
  }, [alerts]);

  useEffect(() => {
    if (filteredAlerts.length <= 1 || isPaused) return;
    const t = setInterval(() => setIdx(p => (p + 1) % filteredAlerts.length), 3000);
    return () => clearInterval(t);
  }, [filteredAlerts.length, isPaused]);

  useEffect(() => { setIdx(0); }, [activeFilter]);

  if (!alerts.length) return null;

  const safeIdx = idx % Math.max(filteredAlerts.length, 1);
  const alert = filteredAlerts[safeIdx];
  if (!alert) return null;
  const cfg = SEVERITY_CONFIG[alert.severity];
  const AlertIcon = alert.icon || cfg.icon;
  const warningCount = alerts.filter(a => a.severity === 'warning' || a.severity === 'critical').length;
  const unreadCount = alerts.filter(a => a.isRead === false).length;
  const isExpanded = expandedAlert === alert.id;

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'navigate' && alert.route) {
      navigate(alert.route);
    } else if (action === 'expand') {
      setExpandedAlert(isExpanded ? null : alert.id);
      setIsPaused(true);
    } else if (action === 'markRead' && onAlertClick) {
      onAlertClick(alert);
    }
  };

  return (
    <div className="space-y-1">
      {/* Filter chips + summary */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
        {ALERT_TYPE_FILTERS.map(f => {
          const count = f.type === 'all' ? alerts.length : alerts.filter(a => a.type === f.type).length;
          if (count === 0 && f.type !== 'all') return null;
          const FIcon = f.icon;
          return (
            <button
              key={f.type}
              onClick={() => setActiveFilter(f.type)}
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap transition-colors border",
                activeFilter === f.type
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50"
              )}
            >
              <FIcon className="w-2.5 h-2.5" />
              <span>{f.label}</span>
              <span className="font-mono text-[7px] opacity-70">{count}</span>
            </button>
          );
        })}
        {unreadCount > 0 && (
          <span className="mr-1 text-[8px] font-mono text-destructive flex items-center gap-0.5">
            <BellRing className="w-2.5 h-2.5" />
            {unreadCount} غير مقروء
          </span>
        )}
        {warningCount > 0 && (
          <span className="mr-auto text-[8px] font-mono text-amber-500 flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            {warningCount} تحذير
          </span>
        )}
      </div>

      {/* Main ticker */}
      <motion.div
        className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px]", cfg.bg, cfg.border)}
        layout
      >
        <motion.div animate={alert.severity === 'critical' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}>
          <AlertIcon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
        </motion.div>
        {alert.isRead === false && (
          <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 animate-pulse" />
        )}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setExpandedAlert(isExpanded ? null : alert.id); setIsPaused(true); }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${activeFilter}-${safeIdx}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}>
              <span className={cn("font-medium truncate block", cfg.color, alert.isRead === false && "font-bold")}>
                {alert.message}
              </span>
              {alert.subtitle && (
                <span className="text-[9px] text-muted-foreground truncate block mt-0.5">
                  {alert.subtitle}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {alert.route && (
            <button onClick={(e) => handleQuickAction(e, 'navigate')}
              className="p-0.5 rounded hover:bg-muted/50 transition-colors" title="فتح">
              <Eye className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </button>
          )}
          <button onClick={(e) => handleQuickAction(e, 'expand')}
            className="p-0.5 rounded hover:bg-muted/50 transition-colors" title="تفاصيل">
            {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-0.5 shrink-0 mr-auto">
          {isPaused && <span className="text-[7px] text-muted-foreground">⏸</span>}
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p - 1 + filteredAlerts.length) % filteredAlerts.length); setExpandedAlert(null); }}
            className="hover:bg-muted/50 rounded p-0.5"><ChevronRight className="w-3 h-3 text-muted-foreground" /></button>
          <span className="text-[8px] font-mono text-muted-foreground tabular-nums" dir="ltr">{safeIdx + 1}/{filteredAlerts.length}</span>
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p + 1) % filteredAlerts.length); setExpandedAlert(null); }}
            className="hover:bg-muted/50 rounded p-0.5"><ChevronLeft className="w-3 h-3 text-muted-foreground" /></button>
        </div>
      </motion.div>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn("px-3 py-2.5 rounded-lg border text-[11px] space-y-2", cfg.bg, cfg.border)}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs">{alert.message}</span>
                {alert.timestamp && (
                  <span className="text-[9px] text-muted-foreground font-mono" dir="ltr">
                    {new Date(alert.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              {alert.subtitle && (
                <p className="text-muted-foreground text-[10px] leading-relaxed">{alert.subtitle}</p>
              )}

              {/* Detail rows */}
              {alert.details && alert.details.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/30">
                  {alert.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-muted-foreground text-[9px] shrink-0">{d.label}:</span>
                      <span className="text-foreground text-[9px] font-medium break-all">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                  <AlertIcon className="w-2.5 h-2.5" />
                  {ALERT_TYPE_FILTERS.find(f => f.type === alert.type)?.label || alert.type || 'عام'}
                </Badge>
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'} className="text-[9px] h-5">
                  {alert.severity === 'critical' ? 'حرج' : alert.severity === 'warning' ? 'تحذير' : 'معلومات'}
                </Badge>
                {alert.isRead === false && (
                  <Badge variant="destructive" className="text-[9px] h-5">غير مقروء</Badge>
                )}
              </div>

              {/* Action button */}
              {alert.route && (
                <button
                  onClick={() => navigate(alert.route!)}
                  className="w-full text-center py-1.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                >
                  فتح التفاصيل الكاملة →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
AlertTicker.displayName = 'AlertTicker';

/* ═══════════ MINI WEATHER WIDGET ═══════════ */
const WEATHER_ICONS: Record<string, LucideIcon> = {
  sunny: Sun, cloudy: Cloud, rainy: CloudRain, stormy: CloudLightning, windy: Wind, snowy: Snowflake,
  partly_cloudy: CloudSun, foggy: CloudFog,
};

const FORECAST_CONDITION_COLORS: Record<string, string> = {
  sunny: 'text-amber-400', cloudy: 'text-muted-foreground', rainy: 'text-blue-400',
  stormy: 'text-purple-400', windy: 'text-cyan-400', snowy: 'text-blue-200',
  partly_cloudy: 'text-amber-300', foggy: 'text-muted-foreground',
};

const WeatherWidget = memo(({ weather }: { weather: WeatherData }) => {
  const [showForecast, setShowForecast] = useState(false);
  const WIcon = WEATHER_ICONS[weather.condition] || CloudSun;
  const hasRoadWarning = !!weather.roadWarning;
  const hasForecast = weather.hourlyForecast && weather.hourlyForecast.length > 0;

  if (weather.isLoading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-muted/30 border-border/30 text-[10px]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sun className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <span className="text-muted-foreground font-mono">جاري تحميل الطقس...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Main weather bar */}
      <div className="flex items-center gap-1">
        {/* GPS Locate Button */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); weather.refreshFromGPS?.(); }}
          disabled={weather.isLocating}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg border transition-all shrink-0",
            weather.isLocating
              ? "bg-primary/10 border-primary/30 cursor-wait"
              : "bg-muted/30 border-border/30 hover:bg-primary/10 hover:border-primary/30 active:scale-95"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          title="تحديد الموقع وتحديث الطقس"
        >
          {weather.isLocating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <LocateFixed className="w-4 h-4 text-primary" />
            </motion.div>
          ) : (
            <LocateFixed className="w-4 h-4 text-primary" />
          )}
        </motion.button>

        <motion.div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] cursor-pointer transition-all flex-1",
            hasRoadWarning ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30 border-border/30",
            hasForecast && "hover:border-primary/30"
          )}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          onClick={() => hasForecast && setShowForecast(p => !p)}
        >
        <motion.div animate={weather.condition === 'stormy' ? { rotate: [0, -10, 10, 0] } : weather.condition === 'windy' ? { x: [-1, 1, -1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}>
          <WIcon className={cn("w-4 h-4", hasRoadWarning ? "text-amber-500" : "text-primary")} />
        </motion.div>

        <div className="flex items-center gap-1.5 font-mono flex-wrap" dir="ltr">
          {/* Location */}
          {weather.locationName && (
            <>
              <span className="flex items-center gap-0.5 text-primary font-bold">
                <MapPin className="w-2.5 h-2.5" />{weather.locationName}
              </span>
              <span className="text-border/50">|</span>
            </>
          )}
          {/* Temp + feels like */}
          <span className="font-black text-foreground">{weather.temp}°C</span>
          {weather.feelsLike !== undefined && weather.feelsLike !== weather.temp && (
            <span className="text-muted-foreground text-[8px]">(يحس {weather.feelsLike}°)</span>
          )}
          <span className="text-border/50">|</span>
          {/* Condition label */}
          <span className="text-muted-foreground font-medium">{weather.conditionLabel || weather.condition}</span>
          <span className="text-border/50">|</span>
          {/* Humidity */}
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <Droplets className="w-2.5 h-2.5" />{weather.humidity}%
          </span>
          <span className="text-border/50">|</span>
          {/* Wind */}
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <Wind className="w-2.5 h-2.5" />{weather.windSpeed}km/h
          </span>
          {/* Rain probability */}
          {weather.precipProb !== undefined && weather.precipProb > 0 && (
            <>
              <span className="text-border/50">|</span>
              <span className="flex items-center gap-0.5 text-blue-400">
                <CloudRain className="w-2.5 h-2.5" />{weather.precipProb}%
              </span>
            </>
          )}
          {/* UV */}
          {weather.uvIndex !== undefined && weather.uvIndex > 5 && (
            <>
              <span className="text-border/50">|</span>
              <span className="flex items-center gap-0.5 text-orange-400">
                <ThermometerSun className="w-2.5 h-2.5" />UV:{weather.uvIndex}
              </span>
            </>
          )}
        </div>

        {hasRoadWarning && (
          <motion.span className="text-amber-500 font-bold truncate flex items-center gap-0.5 shrink-0"
            animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <AlertTriangle className="w-3 h-3 shrink-0" />{weather.roadWarning}
          </motion.span>
        )}

        {/* Forecast toggle indicator */}
        {hasForecast && (
          <motion.div className="flex items-center gap-0.5 shrink-0 mr-auto"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <Clock className="w-2.5 h-2.5 text-primary/60" />
            <span className="text-[7px] font-mono text-primary/60">{showForecast ? 'إخفاء' : 'التنبؤ'}</span>
          </motion.div>
        )}
        </motion.div>
      </div>

      {/* Hourly forecast panel */}
      <AnimatePresence>
        {showForecast && hasForecast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-0.5 rounded-lg bg-muted/20 border border-border/20">
              {weather.hourlyForecast!.map((h, i) => {
                const HIcon = WEATHER_ICONS[h.condition] || CloudSun;
                const isNow = i === 0;
                return (
                  <motion.div
                    key={h.time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 min-w-[42px] px-1.5 py-1 rounded-md text-[8px] font-mono shrink-0 transition-colors",
                      isNow ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"
                    )}
                  >
                    <span className={cn("font-bold", isNow ? "text-primary" : "text-muted-foreground")}>
                      {isNow ? 'الآن' : `${String(h.hour).padStart(2, '0')}:00`}
                    </span>
                    <HIcon className={cn("w-3.5 h-3.5", FORECAST_CONDITION_COLORS[h.condition] || 'text-muted-foreground')} />
                    <span className="font-black text-foreground text-[10px]" dir="ltr">{h.temp}°</span>
                    {h.precipProb > 20 && (
                      <span className="flex items-center gap-0.5 text-blue-400">
                        <Droplets className="w-2 h-2" />{h.precipProb}%
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Wind className="w-2 h-2" />{h.windSpeed}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
WeatherWidget.displayName = 'WeatherWidget';
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
interface SystemIcon {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  status: 'ok' | 'warn' | 'error';
  route?: string;
}

const systemIcons: SystemIcon[] = [
  { icon: Wifi, label: 'NET', tooltip: 'الشبكة متصلة', status: 'ok' },
  { icon: Database, label: 'DB', tooltip: 'قاعدة البيانات تعمل', status: 'ok' },
  { icon: Cpu, label: 'CPU', tooltip: 'المعالجة مستقرة', status: 'ok' },
  { icon: Shield, label: 'SEC', tooltip: 'الأمان مفعّل - RLS نشط', status: 'ok', route: '/dashboard/system-status' },
  { icon: Signal, label: 'SIG', tooltip: 'الإشارة قوية', status: 'ok' },
  { icon: Satellite, label: 'GPS', tooltip: 'التتبع الجغرافي نشط', status: 'ok', route: '/dashboard/tracking-center' },
  { icon: Fingerprint, label: 'AUTH', tooltip: 'المصادقة مفعّلة', status: 'ok' },
  { icon: CircuitBoard, label: 'IOT', tooltip: 'أجهزة IoT متصلة', status: 'ok' },
  { icon: BatteryCharging, label: 'PWR', tooltip: 'الطاقة مستقرة', status: 'ok' },
  { icon: Antenna, label: 'RF', tooltip: 'التردد اللاسلكي نشط', status: 'ok' },
  { icon: FileSignature, label: 'SIGN', tooltip: 'التوقيعات الرقمية', status: 'ok', route: '/dashboard/signing-inbox' },
  { icon: Wallet, label: 'FIN', tooltip: 'النظام المالي', status: 'ok', route: '/dashboard/erp/accounting' },
  { icon: Users, label: 'TEAM', tooltip: 'إدارة الأعضاء', status: 'ok', route: '/dashboard/org-structure' },
  { icon: ScrollText, label: 'DOCS', tooltip: 'أرشيف المستندات', status: 'ok', route: '/dashboard/document-archive' },
  { icon: Package, label: 'SHIP', tooltip: 'إدارة الشحنات', status: 'ok', route: '/dashboard/shipments' },
  { icon: Lock, label: 'RLS', tooltip: 'سياسات الأمان', status: 'ok' },
  { icon: RefreshCw, label: 'SYNC', tooltip: 'المزامنة اللحظية', status: 'ok' },
  { icon: HardDrive, label: 'STOR', tooltip: 'التخزين السحابي', status: 'ok' },
  { icon: MessageSquare, label: 'CHAT', tooltip: 'نظام الدردشة', status: 'ok', route: '/dashboard/chat' },
  { icon: ClipboardCheck, label: 'CMPL', tooltip: 'الامتثال البيئي', status: 'ok', route: '/dashboard/compliance-assessment' },
  { icon: Brain, label: 'AI', tooltip: 'الذكاء الاصطناعي', status: 'ok', route: '/dashboard/system-status' },
  { icon: PlugZap, label: 'API', tooltip: 'واجهات API', status: 'ok' },
];

const statusColors: Record<string, string> = {
  ok: 'text-emerald-500',
  warn: 'text-amber-500',
  error: 'text-destructive',
};

/* ══════════════════════════════ MAIN COMPONENT ══════════════════════════════ */
const DashboardV2Header = memo(({
  userName, orgName, orgLabel, icon: Icon, gradient = 'from-primary to-primary/70',
  children, radarStats, alerts = [], weather, heatmapData, onRefresh, onAlertClick
}: DashboardV2HeaderProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshClick = useCallback(() => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  }, [onRefresh]);
  const displayName = userName || orgName || 'المستخدم';
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

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

          <div className="relative z-10 p-2 sm:p-3.5">
            {/* ── ROW 1: TOP BAR ── */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex items-center gap-1 flex-wrap min-w-0">
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

                {/* Clock — visible on mobile too */}
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-muted/40 border border-border/30" dir="ltr">
                  <Timer className="w-3 h-3 text-primary/70" />
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold text-foreground tabular-nums">{timeStr}</span>
                  <span className="hidden sm:inline text-border/50">|</span>
                  <span className="hidden sm:inline text-[8px] font-mono text-muted-foreground tabular-nums">{dateStr}</span>
                </div>

                {/* System status icons */}
                <TooltipProvider delayDuration={200}>
                <div className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/20 overflow-x-auto scrollbar-hide max-w-[600px]">
                  {systemIcons.map((si, i) => (
                    <Tooltip key={si.label}>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={cn(
                            "flex items-center gap-0.5 px-1 py-0.5 cursor-pointer rounded-md transition-colors hover:bg-primary/10",
                            si.route && "cursor-pointer"
                          )}
                          onClick={() => si.route && navigate(si.route)}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.03 }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <si.icon className={cn("w-3.5 h-3.5", statusColors[si.status])} />
                          <span className="text-[8px] font-mono font-bold text-foreground/70">{si.label}</span>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", si.status === 'ok' ? 'bg-emerald-500' : si.status === 'warn' ? 'bg-amber-500' : 'bg-destructive')} />
                          {si.tooltip}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                </TooltipProvider>

                <Badge variant="outline" className="text-[7px] px-1 py-0 h-[14px] gap-0.5 border-primary/20 text-primary">
                  <Sparkles className="w-2 h-2" /> v5.0
                </Badge>

                {onRefresh && (
                  <motion.button
                    onClick={handleRefreshClick}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="تحديث البيانات"
                  >
                    <RefreshCw className={cn("w-3 h-3 text-primary", isRefreshing && "animate-spin")} />
                    <span className="text-[8px] font-bold text-primary">تحديث</span>
                  </motion.button>
                )}
              </div>

              {/* Name + org */}
              <div className="flex items-center gap-2 shrink-0 max-w-[55%] sm:max-w-none">
                <div className="text-right min-w-0">
                  <h1 className="font-black text-xs sm:text-lg text-foreground leading-tight truncate">
                    {greeting}، <span className="text-primary">{displayName}</span>
                  </h1>
                  {orgName && (
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Shield className="w-2.5 h-2.5 text-primary/60 shrink-0" />
                      <span className="truncate">{orgName} — {orgLabel}</span>
                    </p>
                  )}
                </div>
                <motion.div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 relative", gradient)}
                  whileHover={{ scale: 1.1, rotate: 5 }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <PulseRing color="border-primary/30" />
                </motion.div>
              </div>
            </div>

            {/* ── ROW 2: Alert Ticker + Weather ── */}
            {(alerts.length > 0 || weather) && (
              <div className="flex flex-col gap-1.5 mb-2">
                <div className="flex flex-col sm:flex-row gap-1.5">
                  {alerts.length > 0 && (
                    <div className="flex-1 min-w-0">
                      <AlertTicker alerts={alerts} onAlertClick={onAlertClick} />
                    </div>
                  )}
                </div>
                {weather && <WeatherWidget weather={weather} />}
              </div>
            )}

            {/* ── ROW 3: Gauge + Radar + Stats + Heatmap ── */}
            <div className="flex items-stretch gap-2 sm:gap-3">
              {/* Performance Gauge */}
              <div className="hidden md:flex flex-col items-center gap-1 shrink-0 justify-center">
                <PerformanceGauge score={performanceScore} label="HEALTH" radarStats={radarStats} />
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
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
                {radarStats!.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                    onClick={() => stat.route && navigate(stat.route)}
                    className={cn(
                      "group relative rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm p-1.5 sm:p-2 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 overflow-hidden",
                      stat.route ? "cursor-pointer active:scale-[0.97]" : "cursor-default"
                    )}>
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
                      <p className="text-[8px] sm:text-[8px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">{stat.label}</p>
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
                <div className="flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard')}>
                  <Boxes className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-mono text-muted-foreground">TOTAL:</span>
                  <span className="text-[10px] font-mono font-black text-primary tabular-nums" dir="ltr"><AnimDigit value={totalValue} /></span>
                </div>
                <span className="text-border/40 shrink-0">|</span>
                <div className="hidden sm:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard/system-status')}>
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">UPTIME:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">99.9%</span>
                </div>
                <span className="text-border/40 hidden sm:inline shrink-0">|</span>
                <div className="hidden sm:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[8px] font-mono text-muted-foreground">PERF:</span>
                  <span className="text-[9px] font-mono font-bold text-amber-500" dir="ltr">HIGH</span>
                </div>
                <span className="text-border/40 hidden md:inline shrink-0">|</span>
                <div className="hidden md:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard/tracking-center')}>
                  <LocateFixed className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">TRACKING:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">ACTIVE</span>
                </div>
                <span className="text-border/40 hidden md:inline shrink-0">|</span>
                <div className="hidden md:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors">
                  <Siren className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">ALERTS:</span>
                  <span className={cn("text-[9px] font-mono font-bold", alerts.length > 0 ? "text-amber-500" : "text-emerald-500")} dir="ltr">
                    {alerts.length > 0 ? formatNumber(alerts.length) : 'CLEAR'}
                  </span>
                </div>
                <span className="text-border/40 hidden lg:inline shrink-0">|</span>
                <div className="hidden lg:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard/signing-inbox')}>
                  <FileSignature className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">SIGN:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">READY</span>
                </div>
                <span className="text-border/40 hidden lg:inline shrink-0">|</span>
                <div className="hidden lg:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard/chat')}>
                  <MessageSquare className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">CHAT:</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-500" dir="ltr">LIVE</span>
                </div>
                <span className="text-border/40 hidden xl:inline shrink-0">|</span>
                <div className="hidden xl:flex items-center gap-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded px-1 py-0.5 transition-colors" onClick={() => navigate('/dashboard/ai-studio')}>
                  <Brain className="w-3 h-3 text-primary/60" />
                  <span className="text-[8px] font-mono text-muted-foreground">AI:</span>
                  <span className="text-[9px] font-mono font-bold text-primary" dir="ltr">ON</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-0.5 cursor-pointer hover:bg-primary/10 rounded px-0.5 py-0.5 transition-colors">
                  <Globe2 className="w-2.5 h-2.5 text-primary/60" />
                  <span className="text-[7px] font-mono text-muted-foreground">EG</span>
                </div>
                <div className="flex items-center gap-0.5 cursor-pointer hover:bg-primary/10 rounded px-0.5 py-0.5 transition-colors">
                  <MonitorCheck className="w-2.5 h-2.5 text-primary/60" />
                  <span className="text-[7px] font-mono text-muted-foreground">ON</span>
                </div>
                <motion.div className="flex items-center gap-0.5 cursor-pointer hover:bg-primary/10 rounded px-0.5 py-0.5 transition-colors"
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

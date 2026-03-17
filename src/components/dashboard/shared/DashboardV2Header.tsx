import { memo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Sparkles, Activity, Truck, Route, Users, Package, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface RadarStat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string; // tailwind color class like 'text-primary'
  max?: number;
}

interface DashboardV2HeaderProps {
  userName: string;
  orgName: string;
  orgLabel: string;
  icon: LucideIcon;
  gradient?: string;
  children?: React.ReactNode;
  /** Optional: pass radar stats for a digital HUD display */
  radarStats?: RadarStat[];
}

// Animated digit counter
const AnimDigit = ({ value }: { value: number }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (value === 0) { setCurrent(0); return; }
    const start = performance.now();
    const dur = 1000;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setCurrent(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{current.toLocaleString('ar-SA')}</>;
};

// Mini radar polygon SVG
const RadarChart = ({ stats }: { stats: RadarStat[] }) => {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 44;
  const n = stats.length;

  const getPoint = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = radius * pct;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid rings
  const rings = [0.33, 0.66, 1];
  const gridPaths = rings.map(r => {
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, r));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  });

  // Data polygon
  const dataPts = stats.map((s, i) => {
    const pct = Math.min((s.value) / (s.max || Math.max(s.value, 1)), 1);
    return getPoint(i, Math.max(pct, 0.08));
  });
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => getPoint(i, 1));

  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.4 + i * 0.15} />
      ))}

      {/* Axes */}
      {axes.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
      ))}

      {/* Data area */}
      <motion.path
        d={dataPath}
        fill="url(#radarFill)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#radarGlow)"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data points */}
      {dataPts.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x} cy={p.y} r="3"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
        />
      ))}

      {/* Center dot */}
      <motion.circle
        cx={cx} cy={cy} r="2" fill="hsl(var(--primary))"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Scanning line */}
      <motion.line
        x1={cx} y1={cy} x2={cx} y2={cy - radius}
        stroke="hsl(var(--primary))"
        strokeWidth="1"
        opacity="0.3"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
};

const DashboardV2Header = memo(({ userName, orgName, orgLabel, icon: Icon, gradient = 'from-primary to-primary/70', children, radarStats }: DashboardV2HeaderProps) => {
  const displayName = userName || orgName || 'المستخدم';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!radarStats) return;
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [radarStats]);

  const hasRadar = radarStats && radarStats.length > 0;

  // Greeting based on time of day
  const hour = now.getHours();
  const greeting = hour < 12 ? 'صباح النور' : hour < 18 ? 'مساء النور' : 'مساء الخير';

  return (
    <div className="flex flex-col gap-3">
      {hasRadar ? (
        /* ═══ DIGITAL RADAR HUD MODE ═══ */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-border/40 bg-card overflow-hidden"
        >
          {/* Background grid pattern */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02]"
              style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <motion.div
              className="absolute -top-20 -right-20 w-60 h-60 bg-primary/[0.04] rounded-full blur-[80px]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </div>

          <div className="relative z-10 p-3 sm:p-4">
            {/* Top bar */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
                  animate={{ borderColor: ['hsl(var(--primary) / 0.2)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.2)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">LIVE</span>
                </motion.div>
                <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                  SYS:OK • {format(now, 'HH:mm:ss')}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-[18px] gap-0.5 border-primary/20 text-primary">
                  <Sparkles className="w-2 h-2" /> v3.0
                </Badge>
              </div>

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
                <motion.div
                  className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-primary/20 shrink-0", gradient)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Radar + Stats Grid */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Radar Chart */}
              <div className="hidden sm:block shrink-0">
                <RadarChart stats={radarStats!} />
              </div>

              {/* Digital Stats Grid */}
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {radarStats!.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="group relative rounded-lg sm:rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-2 sm:p-2.5 hover:border-primary/30 transition-colors overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-1 relative z-10">
                      <motion.div
                        className="w-1 h-1 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />
                      <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                    </div>
                    <div className="text-right relative z-10">
                      <p className={cn("text-lg sm:text-xl font-black tabular-nums tracking-tighter leading-none font-mono", stat.color)}>
                        <AnimDigit value={stat.value} />
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom scan line */}
          <motion.div
            className="h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      ) : (
        /* ═══ CLASSIC MODE (backward compatible) ═══ */
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0 text-right">
            <h1 className="font-bold text-lg sm:text-2xl bg-gradient-to-l from-foreground via-foreground to-foreground/60 bg-clip-text truncate">
              {greeting}، {displayName}
            </h1>
            <div className="flex items-center gap-1.5 justify-end mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-[18px] gap-0.5 border-primary/20 text-primary shrink-0">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> v3.0
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

      {/* Actions Row */}
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

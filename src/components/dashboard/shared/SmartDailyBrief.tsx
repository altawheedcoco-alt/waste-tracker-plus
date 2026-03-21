import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sunrise, Sun, Moon, Zap, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Package, Sparkles, Activity, ArrowLeft,
  Truck, Recycle, Factory, Shield, Target, ThermometerSun,
  Quote, Trophy, ChevronDown, ChevronUp, Plus, Eye, MapPin,
  Wrench, Beaker, Scale, ClipboardCheck, FileText, BarChart3,
  Users, Route, Building2, Wallet, Phone, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ═══════════ Types ═══════════

interface SmartDailyBriefProps {
  stats?: {
    pending?: number;
    active?: number;
    completed?: number;
    total?: number;
  };
  role: 'generator' | 'transporter' | 'recycler' | 'driver' | 'disposal' | 'admin';
  /** Extra role-specific data */
  extraData?: {
    yesterdayCompleted?: number;
    dailyGoal?: number;
    urgentAlerts?: UrgentAlert[];
    weatherTemp?: number;
    weatherIcon?: string;
    rankInTeam?: number;
    teamSize?: number;
    overdueShipments?: number;
    expiringContracts?: number;
    pendingInvoices?: number;
    fleetOnRoad?: number;
    fleetTotal?: number;
    processingCapacity?: number;
    storageUsed?: number;
    storageTotal?: number;
    complianceScore?: number;
    pendingInspections?: number;
    activeDrivers?: number;
    totalDrivers?: number;
  };
}

interface UrgentAlert {
  text: string;
  type: 'warning' | 'danger' | 'info';
  route?: string;
}

// ═══════════ Role Configurations ═══════════

const roleConfig: Record<string, {
  icon: typeof Package;
  label: string;
  quickActions: { label: string; icon: typeof Package; route: string }[];
  motivationalQuotes: string[];
  goalLabel: string;
  defaultGoal: number;
}> = {
  transporter: {
    icon: Truck,
    label: 'ناقل',
    quickActions: [
      { label: 'استلم شحنة', icon: Plus, route: '/dashboard/shipments/new' },
      { label: 'تتبع الرحلات', icon: MapPin, route: '/dashboard/tracking-center' },
      { label: 'إدارة السائقين', icon: Users, route: '/dashboard/transporter-drivers' },
    ],
    motivationalQuotes: [
      'الطريق الطويل يبدأ بخطوة واحدة 🚛',
      'كل شحنة تصل بأمان هي إنجاز يُحتسب ✅',
      'النقل الآمن هو أساس سلسلة التوريد 🔗',
      'سلامتك على الطريق أولوية قبل كل شيء 🛡️',
      'ثقة العملاء تُبنى شحنة بعد شحنة 📦',
      'أنت العمود الفقري لمنظومة إدارة النفايات 💪',
    ],
    goalLabel: 'شحنة',
    defaultGoal: 10,
  },
  generator: {
    icon: Package,
    label: 'مُولّد',
    quickActions: [
      { label: 'طلب شحنة', icon: Plus, route: '/dashboard/shipments/new' },
      { label: 'عرض التقارير', icon: BarChart3, route: '/dashboard/reports' },
      { label: 'المستندات', icon: FileText, route: '/dashboard/document-center' },
    ],
    motivationalQuotes: [
      'إدارة النفايات بوعي تبدأ من عندك 🌱',
      'كل فرز صحيح يقربنا من بيئة أنظف ♻️',
      'التزامك البيئي يصنع الفارق 🌍',
      'الاستدامة رحلة وأنت في الطريق الصحيح 🎯',
      'بياناتك الدقيقة تساعد في حماية البيئة 📊',
      'معاً نبني مستقبلاً أخضر 🌿',
    ],
    goalLabel: 'شحنة',
    defaultGoal: 8,
  },
  recycler: {
    icon: Recycle,
    label: 'مُدوِّر',
    quickActions: [
      { label: 'استقبال شحنة', icon: Plus, route: '/dashboard/shipments/new' },
      { label: 'جودة الإنتاج', icon: Beaker, route: '/dashboard/quality-control' },
      { label: 'خط الإنتاج', icon: Factory, route: '/dashboard/production-line' },
    ],
    motivationalQuotes: [
      'كل طن تُعيد تدويره هو انتصار للبيئة ♻️',
      'الجودة في التدوير تعني قيمة أعلى 💎',
      'خط إنتاجك يحول النفايات إلى ثروة 🏭',
      'التدوير ليس مهنة فحسب، بل رسالة 🌏',
      'كفاءة التشغيل هي مفتاح الربحية 📈',
      'أنت تصنع المستقبل من بقايا الماضي ✨',
    ],
    goalLabel: 'شحنة مُعالجة',
    defaultGoal: 12,
  },
  disposal: {
    icon: Factory,
    label: 'تخلص',
    quickActions: [
      { label: 'استقبال نفايات', icon: Plus, route: '/dashboard/shipments/new' },
      { label: 'تقارير الامتثال', icon: ClipboardCheck, route: '/dashboard/compliance' },
      { label: 'سجلات المعالجة', icon: Scale, route: '/dashboard/processing-logs' },
    ],
    motivationalQuotes: [
      'التخلص الآمن يحمي المجتمع والبيئة 🛡️',
      'الامتثال للمعايير هو أساس عملنا ✅',
      'كل عملية معالجة ناجحة تنقذ البيئة 🌍',
      'السلامة أولاً في كل خطوة 🔒',
      'معاييرك العالية تحمي الأجيال القادمة 🌱',
      'التميز في المعالجة هو هويتنا 🏆',
    ],
    goalLabel: 'عملية معالجة',
    defaultGoal: 15,
  },
  driver: {
    icon: Truck,
    label: 'سائق',
    quickActions: [
      { label: 'المهام اليومية', icon: ClipboardCheck, route: '/dashboard/daily-tasks' },
      { label: 'تسجيل رحلة', icon: Route, route: '/dashboard/trip-log' },
      { label: 'اتصل بالمشرف', icon: Phone, route: '/dashboard/communication' },
    ],
    motivationalQuotes: [
      'قيادتك الآمنة هي أغلى ما نملك 🛡️',
      'كل رحلة تنتهي بسلامة هي نجاح كبير ✅',
      'أنت السفير المتنقل لشركتك على الطريق 🚛',
      'الالتزام بالمواعيد يبني الثقة ⏰',
      'سلامتك وسلامة الشحنة أمانة في يدك 📦',
      'أحسنت! استمر في العطاء 💪',
    ],
    goalLabel: 'رحلة',
    defaultGoal: 5,
  },
  admin: {
    icon: Shield,
    label: 'مسؤول',
    quickActions: [
      { label: 'إدارة الشركات', icon: Building2, route: '/dashboard/company-management' },
      { label: 'نظرة عامة', icon: BarChart3, route: '/dashboard/system-overview' },
      { label: 'التقارير', icon: FileText, route: '/dashboard/reports' },
    ],
    motivationalQuotes: [
      'قيادتك للمنظومة تصنع الفارق 🎯',
      'كل قرار سليم يقرّبنا من التميز 🏅',
      'البيانات الدقيقة أساس القرارات الذكية 📊',
      'إدارة حكيمة = بيئة مستدامة 🌍',
      'فريقك يعتمد عليك — وأنت أهل للثقة 💎',
      'النظام يعمل بكفاءة بفضل إدارتك 🔧',
    ],
    goalLabel: 'عملية',
    defaultGoal: 20,
  },
};

// ═══════════ Helper: Daily Quote (changes daily) ═══════════
const getDailyQuote = (quotes: string[]) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
};

// ═══════════ Main Component ═══════════

const SmartDailyBrief = ({ stats, role, extraData }: SmartDailyBriefProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const config = roleConfig[role] || roleConfig.transporter;

  // Time-based greeting
  const { greeting, icon: GreetingIcon, gradientClass, accentColor } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'صباح الخير', icon: Sunrise, gradientClass: 'from-amber-500/15 via-orange-400/8 to-yellow-300/5', accentColor: 'text-amber-500' };
    if (hour < 17) return { greeting: 'مساء الخير', icon: Sun, gradientClass: 'from-sky-500/15 via-blue-400/8 to-cyan-300/5', accentColor: 'text-sky-500' };
    return { greeting: 'مساء النور', icon: Moon, gradientClass: 'from-indigo-500/15 via-violet-400/8 to-purple-300/5', accentColor: 'text-indigo-400' };
  }, []);

  // ── Feature 1: Comparison with yesterday ──
  const comparisonMessage = useMemo(() => {
    const todayCompleted = stats?.completed ?? 0;
    const yesterday = extraData?.yesterdayCompleted;
    if (yesterday === undefined || yesterday === null) return null;
    const diff = todayCompleted - yesterday;
    if (diff > 0) return { text: `أكثر بـ${diff} من أمس`, icon: TrendingUp, color: 'text-emerald-500', positive: true };
    if (diff < 0) return { text: `أقل بـ${Math.abs(diff)} من أمس`, icon: TrendingDown, color: 'text-amber-500', positive: false };
    return { text: 'نفس أداء أمس', icon: Activity, color: 'text-muted-foreground', positive: true };
  }, [stats?.completed, extraData?.yesterdayCompleted]);

  // ── Feature 2: Daily Goal Progress ──
  const goalProgress = useMemo(() => {
    const goal = extraData?.dailyGoal || config.defaultGoal;
    const completed = stats?.completed ?? 0;
    const pct = Math.min(Math.round((completed / goal) * 100), 100);
    const remaining = Math.max(goal - completed, 0);
    return { goal, completed, pct, remaining };
  }, [stats?.completed, extraData?.dailyGoal, config.defaultGoal]);

  // ── Feature 3: Smart contextual message (role-specific) ──
  const smartMessage = useMemo(() => {
    if (!stats) return null;
    const { pending = 0, active = 0, completed = 0, total = 0 } = stats;

    if (role === 'disposal') {
      if (pending > 3) return { text: `${pending} طلب تخلص بانتظار المعالجة — تحتاج اهتماماً فورياً`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} عملية تخلص جارية الآن`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `تم معالجة ${completed} عملية — أداء ممتاز! 🏭`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'recycler') {
      if (pending > 3) return { text: `${pending} شحنة واردة بانتظار الفرز — الخط جاهز؟`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} شحنة قيد المعالجة والتدوير`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت تدوير ${completed} شحنة — استمر! ♻️`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'transporter') {
      if (extraData?.overdueShipments && extraData.overdueShipments > 0) return { text: `⚠️ ${extraData.overdueShipments} شحنة متأخرة عن الموعد`, icon: AlertTriangle, color: 'text-destructive' };
      if (pending > 5) return { text: `لديك ${pending} شحنة بانتظار الاستلام`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} رحلة نشطة على الطريق`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أتممت ${completed} رحلة بنجاح — أحسنت! 🚛`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'driver') {
      if (pending > 0) return { text: `${pending} مهمة بانتظارك — ابدأ الآن!`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} رحلة جارية — قُد بأمان 🛣️`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت ${completed} مهمة اليوم 🌟`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'admin') {
      if (extraData?.pendingInspections && extraData.pendingInspections > 0) return { text: `${extraData.pendingInspections} تفتيش بانتظار المراجعة`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} عملية نشطة عبر المنصة`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `تم إنجاز ${completed} عملية — النظام يعمل بكفاءة ⚙️`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else {
      // generator
      if (extraData?.expiringContracts && extraData.expiringContracts > 0) return { text: `⚠️ ${extraData.expiringContracts} عقد يقترب من الانتهاء`, icon: AlertTriangle, color: 'text-amber-500' };
      if (pending > 5) return { text: `لديك ${pending} شحنة بانتظار الموافقة`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} شحنة في الطريق إليك`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت ${completed} شحنة — أحسنت! 🎉`, icon: CheckCircle2, color: 'text-emerald-500' };
    }

    if (total === 0) return { text: getDailyQuote(config.motivationalQuotes), icon: Sparkles, color: 'text-primary' };
    return { text: getDailyQuote(config.motivationalQuotes), icon: TrendingUp, color: 'text-primary' };
  }, [stats, role, extraData, config.motivationalQuotes]);

  // ── Feature 4: Context-aware quick action ──
  const primaryAction = useMemo(() => {
    const { pending = 0, active = 0 } = stats || {};
    const actions = config.quickActions;
    if (pending > 0) return actions[0]; // Create/receive
    if (active > 0) return actions[1]; // Track/monitor
    return actions[0]; // Default to first
  }, [stats, config.quickActions]);

  // ── Feature 5: Urgent alerts ──
  const urgentAlerts = useMemo(() => {
    const alerts: UrgentAlert[] = extraData?.urgentAlerts || [];
    // Auto-generate from data
    if (extraData?.overdueShipments && extraData.overdueShipments > 0 && role === 'transporter') {
      alerts.push({ text: `${extraData.overdueShipments} شحنة متأخرة`, type: 'danger', route: '/dashboard/transporter-shipments' });
    }
    if (extraData?.expiringContracts && extraData.expiringContracts > 0) {
      alerts.push({ text: `${extraData.expiringContracts} عقد ينتهي قريباً`, type: 'warning', route: '/dashboard/contracts' });
    }
    if (extraData?.pendingInvoices && extraData.pendingInvoices > 0) {
      alerts.push({ text: `${extraData.pendingInvoices} فاتورة معلقة`, type: 'warning', route: '/dashboard/erp/accounting' });
    }
    return alerts.slice(0, 3);
  }, [extraData, role]);

  // ── Feature 6: Role-specific extra stats ──
  const roleSpecificStats = useMemo(() => {
    if (!extraData) return [];
    const items: { label: string; value: string; icon: typeof Package; color: string }[] = [];

    if (role === 'transporter') {
      if (extraData.fleetOnRoad !== undefined) items.push({ label: 'مركبات على الطريق', value: `${extraData.fleetOnRoad}/${extraData.fleetTotal || 0}`, icon: Truck, color: 'text-primary' });
      if (extraData.activeDrivers !== undefined) items.push({ label: 'سائقون نشطون', value: `${extraData.activeDrivers}/${extraData.totalDrivers || 0}`, icon: Users, color: 'text-violet-500' });
    } else if (role === 'recycler') {
      if (extraData.processingCapacity !== undefined) items.push({ label: 'طاقة المعالجة', value: `${extraData.processingCapacity}%`, icon: Zap, color: 'text-amber-500' });
      if (extraData.storageUsed !== undefined) items.push({ label: 'المخزون', value: `${extraData.storageUsed}/${extraData.storageTotal || 0} طن`, icon: Scale, color: 'text-primary' });
    } else if (role === 'disposal') {
      if (extraData.complianceScore !== undefined) items.push({ label: 'درجة الامتثال', value: `${extraData.complianceScore}%`, icon: Shield, color: 'text-emerald-500' });
      if (extraData.pendingInspections !== undefined) items.push({ label: 'تفتيشات قادمة', value: `${extraData.pendingInspections}`, icon: ClipboardCheck, color: 'text-amber-500' });
    } else if (role === 'admin') {
      if (extraData.pendingInspections !== undefined) items.push({ label: 'بانتظار المراجعة', value: `${extraData.pendingInspections}`, icon: ClipboardCheck, color: 'text-amber-500' });
    }

    return items;
  }, [role, extraData]);

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const completionRate = stats?.total ? Math.round(((stats.completed ?? 0) / stats.total) * 100) : 0;
  const RoleIcon = config.icon;

  const handleQuickAction = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/30 backdrop-blur-sm',
        `bg-gradient-to-l ${gradientClass}`
      )}
    >
      {/* Decorative */}
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-primary/5 blur-3xl" />
      <motion.div
        className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-primary/20"
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      <div className="relative p-3 sm:p-5">
        {/* ═══ Row 1: Greeting + Stats ═══ */}
        <div className="flex items-start justify-between gap-3">
          {/* Right - Greeting */}
          <div className="flex-1 text-right min-w-0">
            <div className="flex items-center gap-2 justify-end mb-1">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-background/60 shadow-sm backdrop-blur-sm">
                  <GreetingIcon className={cn('w-4 h-4 sm:w-5 sm:h-5', accentColor)} />
                </div>
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold truncate leading-tight">
                  {greeting}{firstName ? `، ${firstName}` : ''}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1 justify-end flex-wrap">
                  <RoleIcon className="w-3 h-3 shrink-0" />
                  <span>{config.label}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </p>
              </div>
            </div>

            {/* Smart Message */}
            {smartMessage && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1.5 justify-end mt-2 px-2.5 py-1 rounded-lg bg-background/40 backdrop-blur-sm w-fit mr-auto sm:mr-0 sm:ml-auto"
              >
                <smartMessage.icon className={cn('w-3.5 h-3.5 shrink-0', smartMessage.color)} />
                <span className="text-[10px] sm:text-xs font-medium text-foreground/80">{smartMessage.text}</span>
              </motion.div>
            )}

            {/* Comparison with yesterday */}
            {comparisonMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-1 justify-end mt-1"
              >
                <comparisonMessage.icon className={cn('w-3 h-3', comparisonMessage.color)} />
                <span className={cn('text-[10px] font-medium', comparisonMessage.color)}>
                  {stats?.completed ?? 0} {config.goalLabel} اليوم — {comparisonMessage.text}
                </span>
              </motion.div>
            )}
          </div>

          {/* Left - Stats + Goal ring */}
          <div className="flex flex-col gap-1.5 shrink-0 items-end">
            {/* Goal progress ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="relative w-14 h-14 sm:w-16 sm:h-16"
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={goalProgress.pct >= 100 ? 'hsl(var(--primary))' : goalProgress.pct >= 50 ? 'hsl(142 76% 36%)' : 'hsl(38 92% 50%)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${goalProgress.pct}, 100` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {goalProgress.pct >= 100 ? (
                  <Trophy className="w-4 h-4 text-primary" />
                ) : (
                  <>
                    <span className="text-xs font-bold tabular-nums leading-none">{goalProgress.pct}%</span>
                    <span className="text-[8px] text-muted-foreground leading-none mt-0.5">
                      {goalProgress.completed}/{goalProgress.goal}
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Mini pills */}
            <div className="flex gap-1">
              {(stats?.active ?? 0) > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Activity className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary tabular-nums">{stats!.active}</span>
                </motion.div>
              )}
              {(stats?.pending ?? 0) > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Clock className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats!.pending}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Row 2: Quick Action + Urgent Alerts ═══ */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Primary Quick Action */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAction(primaryAction.route)}
            className="h-7 text-[10px] sm:text-xs gap-1 bg-background/50 backdrop-blur-sm border-border/40 hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            <primaryAction.icon className="w-3 h-3" />
            {primaryAction.label}
            <ArrowLeft className="w-2.5 h-2.5" />
          </Button>

          {/* Urgent Alerts inline */}
          {urgentAlerts.map((alert, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              onClick={() => alert.route && navigate(alert.route)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition-all hover:scale-105',
                alert.type === 'danger' && 'bg-destructive/10 border-destructive/30 text-destructive',
                alert.type === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
                alert.type === 'info' && 'bg-primary/10 border-primary/30 text-primary',
              )}
            >
              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{alert.text}</span>
            </motion.button>
          ))}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-full text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mr-auto"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{expanded ? 'أقل' : 'المزيد'}</span>
          </button>
        </div>

        {/* ═══ Expanded Section ═══ */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border/20 space-y-3">
                {/* Goal Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {goalProgress.remaining > 0
                        ? `باقي ${goalProgress.remaining} ${config.goalLabel} للهدف اليومي`
                        : '🎉 تم تحقيق الهدف اليومي!'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold">الهدف: {goalProgress.goal} {config.goalLabel}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        goalProgress.pct >= 100 ? 'bg-primary' : goalProgress.pct >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress.pct}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Role-specific stats */}
                {roleSpecificStats.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {roleSpecificStats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/40 backdrop-blur-sm">
                        <stat.icon className={cn('w-3.5 h-3.5 shrink-0', stat.color)} />
                        <div className="text-right flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                          <p className="text-xs font-bold tabular-nums">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Quick Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">إجراءات سريعة:</span>
                  {config.quickActions.map((action, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickAction(action.route)}
                      className="h-6 text-[10px] gap-1 px-2 hover:bg-primary/10"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Motivational Quote */}
                <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-background/30">
                  <Quote className="w-3 h-3 text-primary/50 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    {getDailyQuote(config.motivationalQuotes)}
                  </p>
                </div>

                {/* Team Rank */}
                {extraData?.rankInTeam && extraData?.teamSize && (
                  <div className="flex items-center gap-1.5 justify-end">
                    <Star className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-medium">
                      ترتيبك اليوم: {extraData.rankInTeam} من {extraData.teamSize} في فريقك
                      {extraData.rankInTeam <= 3 && ' 🏅'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SmartDailyBrief;

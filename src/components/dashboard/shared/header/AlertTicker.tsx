import { memo, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  LucideIcon, Info, AlertTriangle, XCircle, Bell, BellRing,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Eye,
  Package, Users, Truck, MessageSquare, FileSignature,
  ScrollText, ClipboardCheck, FileCheck, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AlertItem } from './DashboardV2Header';

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

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
        {ALERT_TYPE_FILTERS.map(f => {
          const count = f.type === 'all' ? alerts.length : alerts.filter(a => a.type === f.type).length;
          if (count === 0 && f.type !== 'all') return null;
          const FIcon = f.icon;
          return (
            <button key={f.type} onClick={() => setActiveFilter(f.type)}
              className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap transition-colors border",
                activeFilter === f.type ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50")}>
              <FIcon className="w-2.5 h-2.5" /><span>{f.label}</span><span className="font-mono text-[7px] opacity-70">{count}</span>
            </button>
          );
        })}
        {unreadCount > 0 && <span className="mr-1 text-[8px] font-mono text-destructive flex items-center gap-0.5"><BellRing className="w-2.5 h-2.5" />{unreadCount} غير مقروء</span>}
        {warningCount > 0 && <span className="mr-auto text-[8px] font-mono text-amber-500 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />{warningCount} تحذير</span>}
      </div>

      <motion.div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px]", cfg.bg, cfg.border)} layout>
        <motion.div animate={alert.severity === 'critical' ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.6, repeat: Infinity }}>
          <AlertIcon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
        </motion.div>
        {alert.isRead === false && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 animate-pulse" />}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setExpandedAlert(isExpanded ? null : alert.id); setIsPaused(true); }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${activeFilter}-${safeIdx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <span className={cn("font-medium truncate block", cfg.color, alert.isRead === false && "font-bold")}>{alert.message}</span>
              {alert.subtitle && <span className="text-[9px] text-muted-foreground truncate block mt-0.5">{alert.subtitle}</span>}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {alert.route && (
            <button onClick={(e) => { e.stopPropagation(); navigate(alert.route!); }} className="p-0.5 rounded hover:bg-muted/50 transition-colors" title="فتح">
              <Eye className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </button>
          )}
          <button onClick={() => { setExpandedAlert(isExpanded ? null : alert.id); setIsPaused(true); }} className="p-0.5 rounded hover:bg-muted/50 transition-colors" title="تفاصيل">
            {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
          </button>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 mr-auto">
          {isPaused && <span className="text-[7px] text-muted-foreground">⏸</span>}
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p - 1 + filteredAlerts.length) % filteredAlerts.length); setExpandedAlert(null); }} className="hover:bg-muted/50 rounded p-0.5"><ChevronRight className="w-3 h-3 text-muted-foreground" /></button>
          <span className="text-[8px] font-mono text-muted-foreground tabular-nums" dir="ltr">{safeIdx + 1}/{filteredAlerts.length}</span>
          <button onClick={(e) => { e.stopPropagation(); setIdx(p => (p + 1) % filteredAlerts.length); setExpandedAlert(null); }} className="hover:bg-muted/50 rounded p-0.5"><ChevronLeft className="w-3 h-3 text-muted-foreground" /></button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className={cn("px-3 py-2.5 rounded-lg border text-[11px] space-y-2", cfg.bg, cfg.border)}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs">{alert.message}</span>
                {alert.timestamp && <span className="text-[9px] text-muted-foreground font-mono" dir="ltr">{new Date(alert.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>}
              </div>
              {alert.subtitle && <p className="text-muted-foreground text-[10px] leading-relaxed">{alert.subtitle}</p>}
              {alert.details && alert.details.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/30">
                  {alert.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-1"><span className="text-muted-foreground text-[9px] shrink-0">{d.label}:</span><span className="text-foreground text-[9px] font-medium break-all">{d.value}</span></div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] h-5 gap-0.5"><AlertIcon className="w-2.5 h-2.5" />{ALERT_TYPE_FILTERS.find(f => f.type === alert.type)?.label || alert.type || 'عام'}</Badge>
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'} className="text-[9px] h-5">{alert.severity === 'critical' ? 'حرج' : alert.severity === 'warning' ? 'تحذير' : 'معلومات'}</Badge>
                {alert.isRead === false && <Badge variant="destructive" className="text-[9px] h-5">غير مقروء</Badge>}
              </div>
              {alert.route && (
                <button onClick={() => navigate(alert.route!)} className="w-full text-center py-1.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors">فتح التفاصيل الكاملة →</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
AlertTicker.displayName = 'AlertTicker';

export default AlertTicker;

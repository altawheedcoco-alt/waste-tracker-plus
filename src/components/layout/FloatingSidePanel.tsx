import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { 
  ChevronLeft, ChevronRight, Bot, Headphones, Sparkles, MessageCircle,
  Truck, Users, PenTool, FileText, Phone, ArrowUp, X
} from 'lucide-react';
import { openWidget, type WidgetId } from '@/lib/widgetBus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import CallLogDialog from '@/components/calls/CallLogDialog';

interface PanelAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
  visible: boolean;
  category: 'assistant' | 'operations' | 'navigation' | 'utility';
  badgeKey?: string; // key to look up in notification counts
}

const PANEL_WIDTH = 260;
const TAB_WIDTH = 28;

const FloatingSidePanel = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrollShrunk, setIsScrollShrunk] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const { isMobile } = useDisplayMode();
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const notifCounts = useNotificationCounts();

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isDriver = roles.includes('driver');
  const iconSize = 18;

  // Auto-shrink on scroll
  useEffect(() => {
    if (isOpen) return; // Don't shrink when panel is open
    const handleScroll = () => {
      setIsScrollShrunk(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollShrunk(false);
      }, 1500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isOpen]);

  const handleWidgetOpen = useCallback((id: WidgetId) => {
    openWidget(id);
    if (isMobile) setIsOpen(false);
  }, [isMobile]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    if (isMobile) setIsOpen(false);
  }, [navigate, isMobile]);

  const actions: PanelAction[] = [
    // Assistants
    {
      id: 'ai-chat',
      icon: <Bot size={iconSize} />,
      label: 'المساعد الذكي',
      gradient: 'from-accent to-accent/80',
      onClick: () => handleWidgetOpen('ai-chat'),
      visible: true,
      category: 'assistant',
    },
    {
      id: 'support',
      icon: <Headphones size={iconSize} />,
      label: 'الدعم الفني',
      gradient: 'from-primary to-primary/70',
      onClick: () => handleWidgetOpen('support'),
      visible: true,
      category: 'assistant',
    },
    {
      id: 'operations',
      icon: <Sparkles size={iconSize} />,
      label: 'مساعد العمليات',
      gradient: 'from-primary to-accent',
      onClick: () => handleWidgetOpen('operations'),
      visible: true,
      category: 'assistant',
    },
    // Operations
    {
      id: 'team-chat',
      icon: <MessageCircle size={iconSize} />,
      label: 'محادثات الفريق',
      gradient: 'from-primary to-primary/80',
      onClick: () => handleWidgetOpen('team-chat'),
      visible: true,
      category: 'operations',
      badgeKey: 'chat',
    },
    {
      id: 'create-shipment',
      icon: <Truck size={iconSize} />,
      label: t('commandPalette.newShipment'),
      gradient: 'from-primary to-primary/80',
      onClick: () => handleNavigate('/dashboard/shipments/new'),
      visible: isTransporter || isDriver,
      category: 'operations',
      badgeKey: 'transporter-shipments',
    },
    {
      id: 'driver-conversations',
      icon: <Users size={iconSize} />,
      label: 'محادثات السائقين',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => handleNavigate('/dashboard/chat?filter=drivers'),
      visible: isTransporter && !isDriver,
      category: 'operations',
      badgeKey: 'messages',
    },
    {
      id: 'call-log',
      icon: <Phone size={iconSize} />,
      label: 'تسجيل مكالمة',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => { setShowCallDialog(true); if (isMobile) setIsOpen(false); },
      visible: isAdmin || isTransporter,
      category: 'operations',
    },
    // Navigation
    {
      id: 'quick-sign',
      icon: <PenTool size={iconSize} />,
      label: t('dashboard.quickSign'),
      gradient: 'from-accent to-accent/80',
      onClick: () => handleNavigate('/dashboard/signing-inbox'),
      visible: true,
      category: 'navigation',
      badgeKey: 'company-approvals',
    },
    {
      id: 'permits',
      icon: <FileText size={iconSize} />,
      label: t('dashboard.generalPermits'),
      gradient: 'from-primary to-emerald-500',
      onClick: () => handleNavigate('/dashboard/driver-permits'),
      visible: true,
      category: 'navigation',
    },
    // Utility
    {
      id: 'scroll-top',
      icon: <ArrowUp size={iconSize} />,
      label: 'العودة للأعلى',
      gradient: 'from-muted-foreground to-muted-foreground/80',
      onClick: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); },
      visible: true,
      category: 'utility',
    },
  ];

  const visibleActions = actions.filter(a => a.visible);

  // Total badge count for the tab indicator
  const totalBadge = visibleActions.reduce((sum, a) => {
    if (a.badgeKey && notifCounts[a.badgeKey]) {
      return sum + notifCounts[a.badgeKey];
    }
    return sum;
  }, 0);

  const categories = [
    { key: 'assistant', label: 'المساعدين' },
    { key: 'operations', label: 'العمليات' },
    { key: 'navigation', label: 'التنقل السريع' },
    { key: 'utility', label: 'أدوات' },
  ];

  // Handle drag to open/close
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > 40) {
      setIsOpen(false);
    } else if (info.offset.x < -40) {
      setIsOpen(true);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop on mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[55]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel + Tab */}
      <motion.div
        ref={panelRef}
        className="fixed top-1/2 -translate-y-1/2 z-[56]"
        style={{ left: 0 }}
        animate={{ x: isOpen ? 0 : -(PANEL_WIDTH) }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        drag="x"
        dragConstraints={{ left: -(PANEL_WIDTH), right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center" style={{ direction: 'ltr' }}>
          {/* The Panel */}
          <div
            className={cn(
              'bg-card/95 backdrop-blur-lg border border-border/50 rounded-l-none rounded-r-2xl shadow-2xl overflow-hidden',
              'flex flex-col'
            )}
            style={{ width: PANEL_WIDTH, maxHeight: isMobile ? '70vh' : '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30 bg-muted/30">
              <span className="text-xs font-semibold text-foreground">الإجراءات السريعة</span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Actions List */}
            <div className="overflow-y-auto flex-1 py-2 px-2 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {categories.map(cat => {
                const catActions = visibleActions.filter(a => a.category === cat.key);
                if (catActions.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
                      {cat.label}
                    </p>
                    <div className="space-y-1">
                      {catActions.map(action => {
                        const badge = action.badgeKey ? (notifCounts[action.badgeKey] || 0) : 0;
                        return (
                          <button
                            key={action.id}
                            onClick={action.onClick}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl',
                              'text-sm font-medium text-foreground',
                              'hover:bg-muted/60 active:scale-[0.98] transition-all',
                              'touch-manipulation'
                            )}
                          >
                            <span className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 relative',
                              `bg-gradient-to-br ${action.gradient}`
                            )}>
                              {action.icon}
                              {/* Notification badge on icon */}
                              {badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )}
                            </span>
                            <span className="truncate text-start flex-1">{action.label}</span>
                            {/* Inline badge count */}
                            {badge > 0 && (
                              <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                                {badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pull Tab — shrinks on scroll */}
          <motion.button
            onClick={() => { setIsOpen(prev => !prev); setIsScrollShrunk(false); }}
            animate={{
              height: isScrollShrunk ? 24 : 64,
              width: isScrollShrunk ? 12 : TAB_WIDTH,
              opacity: isScrollShrunk ? 0.5 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'flex items-center justify-center rounded-r-xl shadow-lg border border-l-0 border-border/50',
              'bg-card/90 backdrop-blur-md text-muted-foreground hover:text-foreground hover:opacity-100',
              'transition-colors touch-manipulation cursor-grab active:cursor-grabbing relative'
            )}
            whileTap={{ scale: 0.95 }}
            aria-label={isOpen ? 'إغلاق لوحة الإجراءات' : 'فتح لوحة الإجراءات'}
          >
            {!isScrollShrunk && (
              <>
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                {/* Total badge on tab */}
                {!isOpen && totalBadge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none animate-pulse">
                    {totalBadge > 99 ? '99+' : totalBadge}
                  </span>
                )}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Call Log Dialog */}
      <CallLogDialog open={showCallDialog} onOpenChange={setShowCallDialog} />
    </>
  );
});

FloatingSidePanel.displayName = 'FloatingSidePanel';

export default FloatingSidePanel;

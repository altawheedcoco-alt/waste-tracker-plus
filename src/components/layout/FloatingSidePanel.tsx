import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { 
  ChevronLeft, ChevronRight, Bot, Headphones, Sparkles, MessageCircle,
  Truck, Users, PenTool, FileText, Phone, Plus, ArrowUp, X
} from 'lucide-react';
import { openWidget, type WidgetId } from '@/lib/widgetBus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import CallLogDialog from '@/components/calls/CallLogDialog';

interface PanelAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
  visible: boolean;
  category: 'assistant' | 'operations' | 'navigation' | 'utility';
}

const PANEL_WIDTH = 260;
const TAB_WIDTH = 28;

const FloatingSidePanel = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const { isMobile } = useDisplayMode();
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isDriver = roles.includes('driver');
  const iconSize = 18;

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
      gradient: 'from-primary to-emerald-500',
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
    },
    {
      id: 'create-shipment',
      icon: <Truck size={iconSize} />,
      label: t('commandPalette.newShipment'),
      gradient: 'from-primary to-primary/80',
      onClick: () => handleNavigate('/dashboard/shipments/new'),
      visible: isTransporter || isDriver,
      category: 'operations',
    },
    {
      id: 'driver-conversations',
      icon: <Users size={iconSize} />,
      label: 'محادثات السائقين',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => handleNavigate('/dashboard/chat?filter=drivers'),
      visible: isTransporter && !isDriver,
      category: 'operations',
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

  const categories = [
    { key: 'assistant', label: 'المساعدين' },
    { key: 'operations', label: 'العمليات' },
    { key: 'navigation', label: 'التنقل السريع' },
    { key: 'utility', label: 'أدوات' },
  ];

  // Handle drag to open/close
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    // RTL: pulling right (positive offset) = open, pulling left (negative) = close
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
                      {catActions.map(action => (
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
                            'w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0',
                            `bg-gradient-to-br ${action.gradient}`
                          )}>
                            {action.icon}
                          </span>
                          <span className="truncate text-start">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pull Tab */}
          <motion.button
            onClick={() => setIsOpen(prev => !prev)}
            className={cn(
              'flex items-center justify-center rounded-r-xl shadow-lg border border-l-0 border-border/50',
              'bg-card/90 backdrop-blur-md text-muted-foreground hover:text-foreground',
              'transition-colors touch-manipulation cursor-grab active:cursor-grabbing'
            )}
            style={{ width: TAB_WIDTH, height: 64 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isOpen ? 'إغلاق لوحة الإجراءات' : 'فتح لوحة الإجراءات'}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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

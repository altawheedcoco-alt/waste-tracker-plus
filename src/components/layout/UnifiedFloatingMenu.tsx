import { memo, useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Headphones, Sparkles, MessageCircle, Plus, X, Truck, Users, 
  Package, PenTool, Bell, FileText, MapPin, Route, ClipboardCheck,
  UserPlus, BarChart3, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { openWidget, onWidgetToggle, type WidgetId } from '@/lib/widgetBus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformCounts } from '@/hooks/usePlatformCounts';

type ActionId = WidgetId | 'nav';

interface MenuItem {
  id: ActionId;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  badge?: number;
  navPath?: string;
}

// Context-aware items based on current page
const getContextItems = (
  pathname: string,
  counts: any,
  iconSize: number,
  isTransporter: boolean,
  isDriver: boolean,
): MenuItem[] => {
  const base: MenuItem[] = [];

  // Always available
  base.push({
    id: 'ai-chat',
    icon: <Bot size={iconSize} />,
    label: 'المساعد الذكي',
    gradient: 'from-accent to-accent/80',
  });

  base.push({
    id: 'support',
    icon: <Headphones size={iconSize} />,
    label: 'الدعم الفني',
    gradient: 'from-primary to-emerald-500',
  });

  // Messages with badge
  base.push({
    id: 'nav',
    icon: <MessageCircle size={iconSize} />,
    label: 'الرسائل',
    gradient: 'from-primary to-primary/80',
    badge: counts?.unreadMessages ?? 0,
    navPath: '/dashboard/chat',
  });

  // Notifications with badge
  base.push({
    id: 'nav',
    icon: <Bell size={iconSize} />,
    label: 'الإشعارات',
    gradient: 'from-destructive to-destructive/80',
    badge: counts?.unreadNotifications ?? 0,
    navPath: '/dashboard/notifications',
  });

  // Context-specific items based on current page
  if (pathname.includes('/shipments') || pathname.includes('/tracking')) {
    if (isTransporter || isDriver) {
      base.push({
        id: 'nav',
        icon: <Truck size={iconSize} />,
        label: 'إنشاء شحنة',
        gradient: 'from-primary to-primary/80',
        navPath: '/dashboard/shipments/new',
      });
    }
    base.push({
      id: 'nav',
      icon: <Route size={iconSize} />,
      label: 'مركز التتبع',
      gradient: 'from-emerald-500 to-emerald-600',
      navPath: '/dashboard/tracking-center',
    });
  } else if (pathname.includes('/drivers') || pathname.includes('/fleet')) {
    if (isTransporter) {
      base.push({
        id: 'nav',
        icon: <UserPlus size={iconSize} />,
        label: 'إضافة سائق',
        gradient: 'from-blue-500 to-indigo-500',
        navPath: '/dashboard/transporter-drivers',
      });
    }
  } else if (pathname.includes('/chat')) {
    base.push({
      id: 'nav',
      icon: <PenTool size={iconSize} />,
      label: 'التوقيعات',
      gradient: 'from-amber-500 to-amber-600',
      badge: counts?.pendingSignatures ?? 0,
      navPath: '/dashboard/chat?tab=signing',
    });
    base.push({
      id: 'nav',
      icon: <FileText size={iconSize} />,
      label: 'الملاحظات',
      gradient: 'from-violet-500 to-violet-600',
      badge: counts?.unreadNotes ?? 0,
      navPath: '/dashboard/chat?tab=notes',
    });
  } else if (pathname === '/dashboard') {
    // Dashboard home — show key quick actions
    if (isTransporter || isDriver) {
      base.push({
        id: 'nav',
        icon: <Truck size={iconSize} />,
        label: 'إنشاء شحنة',
        gradient: 'from-primary to-primary/80',
        navPath: '/dashboard/shipments/new',
      });
    }
    base.push({
      id: 'nav',
      icon: <PenTool size={iconSize} />,
      label: 'التوقيعات',
      gradient: 'from-amber-500 to-amber-600',
      badge: counts?.pendingSignatures ?? 0,
      navPath: '/dashboard/signing-inbox',
    });
    if (isTransporter && !isDriver) {
      base.push({
        id: 'nav',
        icon: <Users size={iconSize} />,
        label: 'محادثات السائقين',
        gradient: 'from-blue-500 to-indigo-500',
        navPath: '/dashboard/chat?filter=drivers',
      });
    }
  } else {
    // Default context: operations assistant + create shipment
    base.push({
      id: 'operations',
      icon: <Sparkles size={iconSize} />,
      label: 'مساعد العمليات',
      gradient: 'from-primary to-accent',
    });
    if (isTransporter || isDriver) {
      base.push({
        id: 'nav',
        icon: <Truck size={iconSize} />,
        label: 'إنشاء شحنة',
        gradient: 'from-primary to-primary/80',
        navPath: '/dashboard/shipments/new',
      });
    }
  }

  return base;
};

const UnifiedFloatingMenu = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useDisplayMode();
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { data: counts } = usePlatformCounts();

  const isTransporter = organization?.organization_type === 'transporter';
  const isDriver = roles.includes('driver');
  const iconSize = isMobile ? 18 : 20;

  const visibleItems = useMemo(
    () => getContextItems(location.pathname, counts, iconSize, isTransporter, isDriver),
    [location.pathname, counts, iconSize, isTransporter, isDriver]
  );

  // Total badge across all items
  const totalBadge = useMemo(
    () => visibleItems.reduce((sum, item) => sum + (item.badge ?? 0), 0),
    [visibleItems]
  );

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.navPath) {
      startTransition(() => navigate(item.navPath!));
    } else if (item.id !== 'nav') {
      openWidget(item.id as WidgetId);
    }
    setIsOpen(false);
  }, [navigate]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-unified-menu]')) setIsOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isOpen]);

  // Close when route changes
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const buttonSize = isMobile ? 'w-12 h-12' : 'w-14 h-14';
  const itemButtonSize = isMobile ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <div
      data-unified-menu
      className={cn(
        'fixed z-50',
        isMobile
          ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3'
          : 'bottom-6 right-6'
      )}
    >
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 z-50 flex flex-col-reverse items-end gap-2 mb-2">
            {visibleItems.map((item, index) => (
              <motion.div
                key={`${item.navPath || item.id}-${item.label}`}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  transition: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }
                }}
                exit={{
                  opacity: 0, y: 10, scale: 0.8,
                  transition: { delay: (visibleItems.length - index) * 0.03 }
                }}
                className="flex items-center gap-2"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                  className="px-3 py-1.5 rounded-lg bg-card border shadow-md text-sm font-medium whitespace-nowrap flex items-center gap-2"
                >
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </motion.span>

                {/* Icon Button */}
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 touch-manipulation relative',
                    itemButtonSize,
                    `bg-gradient-to-r ${item.gradient}`
                  )}
                >
                  {item.icon}
                  {/* Small badge dot on icon */}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-card" />
                  ) : null}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'rounded-full shadow-xl flex items-center justify-center text-primary-foreground relative z-50 touch-manipulation',
          'bg-gradient-to-r from-primary to-emerald-500',
          buttonSize
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X size={isMobile ? 22 : 24} /> : <Plus size={isMobile ? 22 : 24} />}
        </motion.div>
        {/* Total badge */}
        {!isOpen && totalBadge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-card"
          >
            {totalBadge > 99 ? '99+' : totalBadge}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
});

UnifiedFloatingMenu.displayName = 'UnifiedFloatingMenu';

export default UnifiedFloatingMenu;

import { memo, useState, useEffect, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Headphones, Sparkles, MessageCircle, Plus, X, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { openWidget, onWidgetToggle, type WidgetId } from '@/lib/widgetBus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItem {
  id: WidgetId;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  visible: boolean;
}

const UnifiedFloatingMenu = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useDisplayMode();
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isDriver = roles.includes('driver');

  const iconSize = isMobile ? 18 : 20;

  const menuItems: MenuItem[] = [
    {
      id: 'ai-chat',
      icon: <Bot size={iconSize} />,
      label: 'المساعد الذكي',
      gradient: 'from-accent to-accent/80',
      visible: true,
    },
    {
      id: 'support',
      icon: <Headphones size={iconSize} />,
      label: 'الدعم الفني',
      gradient: 'from-primary to-emerald-500',
      visible: true,
    },
    {
      id: 'operations',
      icon: <Sparkles size={iconSize} />,
      label: 'مساعد العمليات',
      gradient: 'from-primary to-accent',
      visible: true,
    },
    {
      id: 'team-chat',
      icon: <MessageCircle size={iconSize} />,
      label: 'محادثات الفريق',
      gradient: 'from-primary to-primary/80',
      visible: !isMobile,
    },
    {
      id: 'create-shipment',
      icon: <Truck size={iconSize} />,
      label: t('commandPalette.newShipment'),
      gradient: 'from-primary to-primary/80',
      visible: isTransporter || isDriver,
    },
  ];

  const visibleItems = menuItems.filter(item => item.visible);

  const handleItemClick = useCallback((id: WidgetId) => {
    if (id === 'create-shipment') {
      startTransition(() => navigate('/dashboard/shipments/new'));
    } else {
      openWidget(id);
    }
    setIsOpen(false);
  }, [navigate]);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-unified-menu]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isOpen]);

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
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 10, 
                  scale: 0.8,
                  transition: { delay: (visibleItems.length - index) * 0.03 }
                }}
                className="flex items-center gap-2"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                  className="px-3 py-1.5 rounded-lg bg-card border shadow-md text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>

                {/* Icon Button */}
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    'rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 touch-manipulation',
                    itemButtonSize,
                    `bg-gradient-to-r ${item.gradient}`
                  )}
                >
                  {item.icon}
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
      </motion.button>
    </div>
  );
});

UnifiedFloatingMenu.displayName = 'UnifiedFloatingMenu';

export default UnifiedFloatingMenu;

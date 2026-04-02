import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Plus, Truck, ClipboardList, Scale, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeneratorQuickShipmentFAB = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const actions = [
    {
      label: isAr ? 'شحنة جديدة' : 'New Shipment',
      icon: Truck,
      color: 'bg-primary text-primary-foreground',
      onClick: () => navigate('/dashboard/shipments/new'),
    },
    {
      label: isAr ? 'أمر شغل' : 'Work Order',
      icon: ClipboardList,
      color: 'bg-amber-500 text-white',
      onClick: () => navigate('/dashboard/my-requests'),
    },
    {
      label: isAr ? 'إدخال وزن' : 'Weight Entry',
      icon: Scale,
      color: 'bg-emerald-500 text-white',
      onClick: () => navigate('/dashboard/quick-weight'),
    },
  ];

  return (
    <div className="fixed bottom-20 left-4 rtl:left-auto rtl:right-4 z-40 flex flex-col-reverse items-center gap-2">
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          >
            <button
              onClick={() => { action.onClick(); setOpen(false); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-medium whitespace-nowrap",
                action.color
              )}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-12 h-12 rounded-full shadow-xl transition-all duration-300",
          open
            ? "bg-destructive hover:bg-destructive/90 rotate-45"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </Button>
    </div>
  );
};

export default GeneratorQuickShipmentFAB;

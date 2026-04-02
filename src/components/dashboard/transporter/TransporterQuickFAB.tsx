import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Truck, Package, FileText, Users, X, Fuel, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { label: 'شحنة جديدة', icon: Package, route: '/dashboard/shipments/new', color: 'bg-primary' },
  { label: 'إضافة سائق', icon: Users, route: '/dashboard/transporter-drivers', color: 'bg-emerald-500' },
  { label: 'إيصال نقل', icon: Receipt, route: '/dashboard/transporter-receipts', color: 'bg-amber-500' },
  { label: 'تسجيل وقود', icon: Fuel, route: '/dashboard/fuel-management', color: 'bg-violet-500' },
  { label: 'تقارير', icon: FileText, route: '/dashboard/shipment-reports', color: 'bg-blue-500' },
];

const TransporterQuickFAB = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col-reverse items-start gap-2">
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
              onClick={() => setOpen(false)}
            />

            {/* Action buttons */}
            {ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { navigate(action.route); setOpen(false); }}
                  className="relative z-50 flex items-center gap-2 shadow-lg rounded-full pr-3 pl-2 py-2 bg-background border border-border/50 hover:scale-105 transition-transform touch-manipulation"
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', action.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors touch-manipulation',
          open ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
        )}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default TransporterQuickFAB;

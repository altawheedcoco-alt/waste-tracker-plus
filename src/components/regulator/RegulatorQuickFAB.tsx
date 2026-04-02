/**
 * زر عائم للجهة الرقابية — اختصارات سريعة للتفتيش والمخالفات
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ClipboardCheck, AlertTriangle, Gavel, Building2, Search, Shield } from 'lucide-react';

interface RegulatorQuickFABProps {
  onSetTab: (tab: string) => void;
}

const RegulatorQuickFAB = ({ onSetTab }: RegulatorQuickFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: ClipboardCheck, label: 'تفتيش جديد', color: 'bg-primary text-primary-foreground', tab: 'inspections' },
    { icon: AlertTriangle, label: 'تسجيل مخالفة', color: 'bg-amber-500 text-white', tab: 'violations' },
    { icon: Gavel, label: 'إصدار عقوبة', color: 'bg-destructive text-destructive-foreground', tab: 'penalties' },
    { icon: Building2, label: 'سجل المنظمات', color: 'bg-blue-500 text-white', tab: 'organizations' },
    { icon: Search, label: 'التحقق من مستند', color: 'bg-purple-500 text-white', tab: 'verify' },
    { icon: Shield, label: 'رصد الامتثال', color: 'bg-emerald-500 text-white', tab: 'compliance' },
  ];

  return (
    <div className="fixed bottom-20 left-4 z-40 flex flex-col-reverse items-center gap-2">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[-1]" onClick={() => setIsOpen(false)} />
            {actions.map((action, i) => (
              <motion.button key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { onSetTab(action.tab); setIsOpen(false); }}
                className="flex items-center gap-2 group"
              >
                <span className="text-[11px] font-medium bg-card text-foreground px-2 py-1 rounded-lg shadow-md border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {action.label}
                </span>
                <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-4.5 h-4.5" />
                </div>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-colors ${
          isOpen ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
        }`}>
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default RegulatorQuickFAB;

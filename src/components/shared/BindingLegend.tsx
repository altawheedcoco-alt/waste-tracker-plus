import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { BINDING_DISPLAY } from '@/types/bindingTypes';
import type { BindingType } from '@/types/bindingTypes';

interface BindingLegendProps {
  isCollapsed: boolean;
}

const LEGEND_ORDER: BindingType[] = ['internal', 'partner', 'admin', 'hybrid'];

const BindingLegend = memo(({ isCollapsed }: BindingLegendProps) => {
  const { language } = useLanguage();

  if (isCollapsed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-3 pt-3 mt-3 border-t border-border/50"
      >
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 px-1">
          {language === 'ar' ? 'دليل ألوان الارتباط' : 'Binding Legend'}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {LEGEND_ORDER.map((type) => {
            const d = BINDING_DISPLAY[type];
            return (
              <div
                key={type}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${d.bgClass}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${d.dotClass}`} />
                <span className={`text-[10px] font-medium leading-tight ${d.colorClass}`}>
                  {language === 'ar' ? d.labelAr : d.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

BindingLegend.displayName = 'BindingLegend';

export default BindingLegend;

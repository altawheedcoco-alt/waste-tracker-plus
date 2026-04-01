import { memo } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

export const DateSeparator = memo(({ date }: { date: Date }) => {
  let label: string;
  if (isToday(date)) label = 'اليوم';
  else if (isYesterday(date)) label = 'أمس';
  else label = format(date, 'EEEE d MMMM yyyy', { locale: ar });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 my-3 px-4"
    >
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[10px] text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-0.5 rounded-full shadow-sm border border-border/30">{label}</span>
      <div className="flex-1 h-px bg-border/60" />
    </motion.div>
  );
});
DateSeparator.displayName = 'DateSeparator';

export const UnreadSeparator = memo(() => (
  <div className="flex items-center gap-3 my-3 px-4">
    <div className="flex-1 h-px bg-primary/30" />
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-[10px] font-semibold text-primary-foreground bg-primary px-4 py-1 rounded-full shadow-sm"
    >
      رسائل غير مقروءة
    </motion.span>
    <div className="flex-1 h-px bg-primary/30" />
  </div>
));
UnreadSeparator.displayName = 'UnreadSeparator';

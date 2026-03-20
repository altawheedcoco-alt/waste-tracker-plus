import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addHours, addDays, addMinutes, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReminderDialogProps {
  open: boolean;
  onClose: () => void;
  onSet: (reminderAt: string, note?: string) => void;
  messagePreview?: string;
}

const quickTimes = [
  { label: '30 دقيقة', getFn: () => addMinutes(new Date(), 30) },
  { label: 'ساعة', getFn: () => addHours(new Date(), 1) },
  { label: '3 ساعات', getFn: () => addHours(new Date(), 3) },
  { label: 'غداً', getFn: () => { const d = addDays(new Date(), 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'أسبوع', getFn: () => addDays(new Date(), 7) },
];

const ReminderDialog = memo(({ open, onClose, onSet, messagePreview }: ReminderDialogProps) => {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute bottom-full right-0 mb-1 w-64 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-2.5 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>تذكير بهذه الرسالة</span>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        {messagePreview && (
          <div className="px-2.5 py-1.5 bg-muted/30 text-[10px] text-muted-foreground truncate border-b border-border/30">
            "{messagePreview}"
          </div>
        )}

        <div className="p-2 space-y-1">
          {quickTimes.map(opt => (
            <button
              key={opt.label}
              onClick={() => { onSet(opt.getFn().toISOString()); onClose(); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted/50 transition-colors text-right"
            >
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <span>بعد {opt.label}</span>
              <span className="text-[10px] text-muted-foreground mr-auto">
                {format(opt.getFn(), 'HH:mm', { locale: ar })}
              </span>
            </button>
          ))}

          <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30">
            <Input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="text-[10px] h-7 flex-1" />
            <Input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="text-[10px] h-7 w-20" />
            <Button
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={!customDate || !customTime}
              onClick={() => {
                const dt = new Date(`${customDate}T${customTime}`);
                onSet(dt.toISOString());
                onClose();
              }}
            >
              <Bell className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ReminderDialog.displayName = 'ReminderDialog';
export default ReminderDialog;

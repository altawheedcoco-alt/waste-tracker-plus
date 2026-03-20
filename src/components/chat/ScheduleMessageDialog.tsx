import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Send, X, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, addHours, addDays, addMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduleMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: string, content: string) => void;
  defaultContent?: string;
}

const quickOptions = [
  { label: 'بعد 30 دقيقة', icon: '⏰', getFn: () => addMinutes(new Date(), 30) },
  { label: 'بعد ساعة', icon: '🕐', getFn: () => addHours(new Date(), 1) },
  { label: 'بعد 3 ساعات', icon: '🕒', getFn: () => addHours(new Date(), 3) },
  { label: 'غداً صباحاً', icon: '🌅', getFn: () => { const d = addDays(new Date(), 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'غداً مساءً', icon: '🌇', getFn: () => { const d = addDays(new Date(), 1); d.setHours(17, 0, 0, 0); return d; } },
];

const ScheduleMessageDialog = memo(({ open, onClose, onSchedule, defaultContent = '' }: ScheduleMessageDialogProps) => {
  const [content, setContent] = useState(defaultContent);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const handleQuick = (getFn: () => Date) => {
    if (!content.trim()) return;
    onSchedule(getFn().toISOString(), content);
    onClose();
  };

  const handleCustom = () => {
    if (!content.trim() || !customDate || !customTime) return;
    const dt = new Date(`${customDate}T${customTime}`);
    onSchedule(dt.toISOString(), content);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Timer className="w-4 h-4 text-primary" />
            <span>جدولة رسالة</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="p-3 space-y-3">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="اكتب الرسالة..."
            className="text-sm resize-none min-h-[60px]"
            dir="rtl"
          />

          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium">إرسال سريع:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickOptions.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleQuick(opt.getFn)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground">التاريخ</label>
              <Input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="text-xs h-8" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground">الوقت</label>
              <Input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="text-xs h-8" />
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={handleCustom} disabled={!content.trim() || !customDate || !customTime}>
              <Send className="w-3 h-3" />
              جدولة
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ScheduleMessageDialog.displayName = 'ScheduleMessageDialog';
export default ScheduleMessageDialog;

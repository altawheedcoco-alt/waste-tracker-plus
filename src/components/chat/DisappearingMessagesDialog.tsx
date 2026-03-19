import { Timer, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DisappearDuration } from '@/hooks/useDisappearingMessages';

interface DisappearingMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDuration: DisappearDuration;
  onSetDuration: (duration: DisappearDuration) => void;
}

const DURATIONS: { value: DisappearDuration; label: string; desc: string }[] = [
  { value: 'off', label: 'إيقاف', desc: 'الرسائل لا تختفي' },
  { value: '5m', label: '5 دقائق', desc: 'للرسائل الحساسة جداً' },
  { value: '1h', label: 'ساعة واحدة', desc: 'للمحادثات السريعة' },
  { value: '24h', label: '24 ساعة', desc: 'تختفي بعد يوم' },
  { value: '7d', label: '7 أيام', desc: 'تختفي بعد أسبوع' },
];

const DisappearingMessagesDialog = ({
  open,
  onOpenChange,
  currentDuration,
  onSetDuration,
}: DisappearingMessagesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            الرسائل المؤقتة
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          عند التفعيل، ستختفي الرسائل الجديدة بعد المدة المحددة.
        </p>

        <div className="space-y-1.5">
          {DURATIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => { onSetDuration(value); onOpenChange(false); }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-right",
                currentDuration === value
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                currentDuration === value ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {value === 'off' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Timer className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {currentDuration === value && (
                <div className="mr-auto w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisappearingMessagesDialog;

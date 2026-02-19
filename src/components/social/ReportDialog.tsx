import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, ShieldAlert } from 'lucide-react';
import { useEntityReport } from '@/hooks/useSocialInteractions';
import { cn } from '@/lib/utils';

const REPORT_CATEGORIES = [
  { value: 'fraud', label: 'احتيال أو تزوير', icon: '🚨', desc: 'معاملات مالية مشبوهة أو وثائق مزورة' },
  { value: 'weight_manipulation', label: 'تلاعب بالأوزان', icon: '⚖️', desc: 'اختلاف في أوزان الشحنات' },
  { value: 'safety_violation', label: 'مخالفة سلامة', icon: '⚠️', desc: 'عدم الالتزام بمعايير السلامة' },
  { value: 'license_violation', label: 'مخالفة تراخيص', icon: '📋', desc: 'انتهاء أو عدم وجود تراخيص سارية' },
  { value: 'misleading_info', label: 'معلومات مضللة', icon: '❌', desc: 'بيانات غير صحيحة أو مضللة' },
  { value: 'spam', label: 'محتوى مزعج', icon: '📧', desc: 'رسائل متكررة أو غير مرغوب فيها' },
  { value: 'inappropriate', label: 'محتوى غير لائق', icon: '🚫', desc: 'لغة أو سلوك غير مقبول' },
] as const;

interface ReportDialogProps {
  entityType: string;
  entityId: string;
  entityLabel?: string;
  trigger?: React.ReactNode;
}

const ReportDialog = memo(({ entityType, entityId, entityLabel, trigger }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const { submitReport, isSubmitting } = useEntityReport();

  const handleSubmit = () => {
    if (!category) return;
    submitReport(
      { entityType, entityId, category, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setCategory('');
          setDescription('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
            <Flag className="h-4 w-4" />
            <span className="text-xs font-medium">إبلاغ</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="p-2 rounded-xl bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            إبلاغ {entityLabel ? `عن ${entityLabel}` : ''}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            سيتم مراجعة البلاغ من فريق الإدارة واتخاذ الإجراء المناسب
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">سبب الإبلاغ</Label>
            <div className="grid gap-2">
              {REPORT_CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border text-right transition-all duration-150 cursor-pointer',
                    category === cat.value
                      ? 'border-destructive/40 bg-destructive/5 ring-1 ring-destructive/20 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                  )}
                >
                  <span className="text-lg mt-0.5">{cat.icon}</span>
                  <div className="flex-1">
                    <span className={cn(
                      'text-sm font-medium block',
                      category === cat.value ? 'text-destructive' : 'text-foreground'
                    )}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{cat.desc}</span>
                  </div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mt-1 transition-all shrink-0',
                    category === cat.value
                      ? 'border-destructive bg-destructive'
                      : 'border-muted-foreground/30'
                  )}>
                    {category === cat.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full rounded-full flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">تفاصيل إضافية <span className="text-muted-foreground font-normal">(اختياري)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل لمساعدتنا في اتخاذ الإجراء المناسب..."
              maxLength={500}
              rows={3}
              className="rounded-xl resize-none"
            />
            <p className="text-[11px] text-muted-foreground/60 text-left tabular-nums">{description.length}/500</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            إلغاء
          </Button>
          <Button
            variant="destructive"
            disabled={!category || isSubmitting}
            onClick={handleSubmit}
            className="rounded-xl gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                إرسال البلاغ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ReportDialog.displayName = 'ReportDialog';
export default ReportDialog;

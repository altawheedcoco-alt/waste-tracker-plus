import { memo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, AlertTriangle } from 'lucide-react';
import { useEntityReport } from '@/hooks/useSocialInteractions';

const REPORT_CATEGORIES = [
  { value: 'fraud', label: 'احتيال أو تزوير', icon: '🚨' },
  { value: 'weight_manipulation', label: 'تلاعب بالأوزان', icon: '⚖️' },
  { value: 'safety_violation', label: 'مخالفة سلامة', icon: '⚠️' },
  { value: 'license_violation', label: 'مخالفة تراخيص', icon: '📋' },
  { value: 'misleading_info', label: 'معلومات مضللة', icon: '❌' },
  { value: 'spam', label: 'محتوى مزعج', icon: '📧' },
  { value: 'inappropriate', label: 'محتوى غير لائق', icon: '🚫' },
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
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4" />
            <span className="text-xs">إبلاغ</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            إبلاغ {entityLabel ? `عن ${entityLabel}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>سبب الإبلاغ</Label>
            <RadioGroup value={category} onValueChange={setCategory} className="space-y-1.5">
              {REPORT_CATEGORIES.map((cat) => (
                <div key={cat.value} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <label htmlFor={cat.value} className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>تفاصيل إضافية (اختياري)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-left">{description.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="destructive" disabled={!category || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ReportDialog.displayName = 'ReportDialog';
export default ReportDialog;

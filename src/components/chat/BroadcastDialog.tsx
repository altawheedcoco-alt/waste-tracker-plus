import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Megaphone, Loader2, Building2, Truck, Recycle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendBroadcast: (data: { message: string; targetType: 'all' | 'generators' | 'transporters' | 'recyclers' }) => void;
  isSending: boolean;
}

const targets = [
  { value: 'all', label: 'جميع الجهات', icon: Users, desc: 'إرسال لكل الجهات المسجلة' },
  { value: 'generators', label: 'المُنتجين', icon: Building2, desc: 'جهات توليد المخلفات فقط' },
  { value: 'transporters', label: 'الناقلين', icon: Truck, desc: 'شركات النقل فقط' },
  { value: 'recyclers', label: 'المُعالجين', icon: Recycle, desc: 'جهات التدوير والمعالجة' },
] as const;

const BroadcastDialog = ({ open, onOpenChange, onSendBroadcast, isSending }: BroadcastDialogProps) => {
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'generators' | 'transporters' | 'recyclers'>('all');

  const handleSend = () => {
    onSendBroadcast({ message: message.trim(), targetType });
    setMessage('');
    setTargetType('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            بث رسالة جماعية
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">الفئة المستهدفة</Label>
            <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as any)}>
              <div className="grid grid-cols-2 gap-2">
                {targets.map(t => {
                  const Icon = t.icon;
                  return (
                    <label
                      key={t.value}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                        targetType === t.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem value={t.value} className="sr-only" />
                      <Icon className={cn(
                        "w-5 h-5 shrink-0",
                        targetType === t.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">نص الرسالة</Label>
            <Textarea
              placeholder="اكتب رسالة البث هنا..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            className="w-full"
            disabled={!message.trim() || isSending}
            onClick={handleSend}
          >
            {isSending ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : <Megaphone className="w-4 h-4 ml-2" />}
            إرسال البث
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastDialog;

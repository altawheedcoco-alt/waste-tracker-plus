import { useState } from 'react';
import { Hash, Globe, Lock } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (data: { name: string; description: string; channelType: string; memberIds: string[] }) => void;
}

const CHANNEL_TYPES = [
  { value: 'internal', label: 'داخلية', desc: 'لأعضاء منظمتك فقط', icon: Lock },
  { value: 'shared', label: 'مشتركة', desc: 'مع جهة شريكة', icon: Globe },
];

export default function CreateChannelDialog({ open, onOpenChange, onCreateChannel }: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState('internal');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreateChannel({ name: name.trim(), description: description.trim(), channelType, memberIds: [] });
    setName('');
    setDescription('');
    setChannelType('internal');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            إنشاء قناة جديدة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">اسم القناة</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: #عمليات"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">الوصف (اختياري)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للقناة..."
              className="text-sm min-h-[60px]"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">نوع القناة</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setChannelType(ct.value)}
                  className={cn(
                    'p-3 rounded-xl border text-right transition-all',
                    channelType === ct.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <ct.icon className={cn('w-4 h-4 mb-1', channelType === ct.value ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{ct.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            إنشاء القناة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

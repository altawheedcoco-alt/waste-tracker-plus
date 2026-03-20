import { useState } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (data: { question: string; options: string[]; isAnonymous: boolean }) => void;
}

export default function CreatePollDialog({ open, onOpenChange, onCreatePoll }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, value: string) => {
    setOptions(options.map((o, i) => (i === idx ? value : o)));
  };

  const handleSubmit = () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    onCreatePoll({ question: question.trim(), options: validOptions, isAnonymous });
    setQuestion('');
    setOptions(['', '']);
    setIsAnonymous(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            إنشاء تصويت
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">السؤال</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="ما رأيكم في...؟"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">الخيارات</Label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`الخيار ${idx + 1}`}
                    className="text-sm"
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeOption(idx)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={addOption}>
                  <Plus className="w-3.5 h-3.5 ml-1" />
                  إضافة خيار
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">تصويت سري</Label>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>
            إنشاء التصويت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

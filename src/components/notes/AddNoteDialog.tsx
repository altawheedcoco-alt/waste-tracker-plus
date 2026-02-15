import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, Send, AlertTriangle, ThumbsUp, ThumbsDown, 
  HelpCircle, CheckCircle2, Lock, Users, Globe, StickyNote
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string;
  resourceId: string;
}

const noteTypes = [
  { value: 'comment', label: 'تعليق', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'instruction', label: 'تعليمات', icon: <Send className="h-4 w-4" /> },
  { value: 'warning', label: 'تحذير', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'approval', label: 'موافقة', icon: <ThumbsUp className="h-4 w-4" /> },
  { value: 'rejection', label: 'رفض', icon: <ThumbsDown className="h-4 w-4" /> },
  { value: 'question', label: 'سؤال', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'answer', label: 'إجابة', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const priorities = [
  { value: 'low', label: 'منخفض' },
  { value: 'normal', label: 'عادي' },
  { value: 'high', label: 'مهم' },
  { value: 'urgent', label: 'عاجل' },
];

const visibilities = [
  { value: 'internal', label: 'داخلي - منظمتي فقط', icon: <Lock className="h-4 w-4" /> },
  { value: 'partner', label: 'مشترك - مع الشريك', icon: <Users className="h-4 w-4" /> },
  { value: 'public', label: 'عام - كل الأطراف', icon: <Globe className="h-4 w-4" /> },
];

const AddNoteDialog = ({ open, onOpenChange, resourceType, resourceId }: AddNoteDialogProps) => {
  const { createNote } = useNotes(resourceType, resourceId);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('comment');
  const [priority, setPriority] = useState('normal');
  const [visibility, setVisibility] = useState('internal');

  const handleSubmit = () => {
    if (!content.trim()) return;
    createNote.mutate(
      { content, note_type: noteType, priority, visibility },
      {
        onSuccess: () => {
          setContent('');
          setNoteType('comment');
          setPriority('normal');
          setVisibility('internal');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>إضافة ملاحظة</span>
            <StickyNote className="h-5 w-5 text-primary" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Note Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-right block mb-1">الأولوية</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-right block mb-1">نوع الملاحظة</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {noteTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">{t.icon} {t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <Label className="text-right block mb-1">مستوى الرؤية</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilities.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    <span className="flex items-center gap-2">{v.icon} {v.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <Label className="text-right block mb-1">المحتوى</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              className="text-right min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || createNote.isPending}>
            <Send className="h-4 w-4 ml-2" />
            إرسال الملاحظة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteDialog;

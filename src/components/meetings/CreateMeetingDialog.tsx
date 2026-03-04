import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Video, Phone, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateMeetingDialogProps {
  onCreated: (meetingId: string) => void;
  trigger?: React.ReactNode;
}

const CreateMeetingDialog = ({ onCreated, trigger }: CreateMeetingDialogProps) => {
  const { user, organization } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    meeting_type: 'video' as 'video' | 'audio',
    is_private: true,
    allow_chat: true,
    scheduled_at: '',
  });

  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [8, 4, 4].map(len =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    return `wapilot-${segments.join('-')}`;
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !user?.id || !organization?.id) {
      toast.error('يرجى إدخال عنوان الاجتماع');
      return;
    }

    setLoading(true);
    const roomId = generateRoomId();

    const { data: meeting, error } = await supabase
      .from('video_meetings')
      .insert({
        organization_id: organization.id,
        created_by: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        room_id: roomId,
        meeting_type: form.meeting_type,
        status: form.scheduled_at ? 'scheduled' : 'active',
        is_private: form.is_private,
        allow_chat: form.allow_chat,
        scheduled_at: form.scheduled_at || null,
        started_at: form.scheduled_at ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error('فشل في إنشاء الاجتماع');
      setLoading(false);
      return;
    }

    // Add creator as host
    await supabase.from('video_meeting_participants').insert({
      meeting_id: meeting.id,
      user_id: user.id,
      role: 'host',
      status: 'joined',
      joined_at: new Date().toISOString(),
    });

    toast.success('تم إنشاء الاجتماع بنجاح');
    setOpen(false);
    setForm({ title: '', description: '', meeting_type: 'video', is_private: true, allow_chat: true, scheduled_at: '' });
    setLoading(false);
    onCreated(meeting.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            اجتماع جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            إنشاء اجتماع مرئي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>عنوان الاجتماع *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="مثال: اجتماع فريق النقل الأسبوعي"
              className="mt-1"
            />
          </div>

          <div>
            <Label>الوصف (اختياري)</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="أضف تفاصيل الاجتماع..."
              className="mt-1 h-20"
            />
          </div>

          <div>
            <Label>نوع الاجتماع</Label>
            <Select value={form.meeting_type} onValueChange={(v: 'video' | 'audio') => setForm(p => ({ ...p, meeting_type: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <span className="flex items-center gap-2"><Video className="w-4 h-4" /> مكالمة فيديو</span>
                </SelectItem>
                <SelectItem value="audio">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> مكالمة صوتية</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>موعد الاجتماع (اتركه فارغاً للبدء فوراً)</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>اجتماع خاص</Label>
            <Switch checked={form.is_private} onCheckedChange={v => setForm(p => ({ ...p, is_private: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <Label>محادثة كتابية</Label>
            <Switch checked={form.allow_chat} onCheckedChange={v => setForm(p => ({ ...p, allow_chat: v }))} />
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {form.scheduled_at ? 'جدولة الاجتماع' : 'بدء الاجتماع الآن'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingDialog;

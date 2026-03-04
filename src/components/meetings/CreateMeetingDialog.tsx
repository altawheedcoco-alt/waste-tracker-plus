import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Video, Phone, Plus, Loader2, Search, Users, X, UserPlus, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrgMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface CreateMeetingDialogProps {
  onCreated: (meetingId: string) => void;
  trigger?: React.ReactNode;
}

const CreateMeetingDialog = ({ onCreated, trigger }: CreateMeetingDialogProps) => {
  const { user, organization, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'members'>('details');
  const [form, setForm] = useState({
    title: '',
    description: '',
    meeting_type: 'video' as 'video' | 'audio',
    is_private: true,
    allow_chat: true,
    scheduled_at: '',
  });

  // Members
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<OrgMember[]>([]);

  // Fetch org members
  const fetchMembers = useCallback(async () => {
    if (!organization?.id || !profile?.id) return;
    setMembersLoading(true);

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('organization_id', organization.id)
      .neq('id', profile.id)
      .order('full_name');

    setOrgMembers((data || []) as OrgMember[]);
    setMembersLoading(false);
  }, [organization?.id, profile?.id]);

  useEffect(() => {
    if (open && step === 'members') fetchMembers();
  }, [open, step, fetchMembers]);

  const filteredMembers = orgMembers.filter(m =>
    !searchQuery.trim() || m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (member: OrgMember) => {
    setSelectedMembers(prev =>
      prev.some(m => m.id === member.id)
        ? prev.filter(m => m.id !== member.id)
        : [...prev, member]
    );
  };

  const selectAll = () => {
    setSelectedMembers(filteredMembers);
  };

  const deselectAll = () => {
    setSelectedMembers([]);
  };

  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [8, 4, 4].map(len =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    return `wapilot-${segments.join('-')}`;
  };

  const handleNext = () => {
    if (!form.title.trim()) {
      toast.error('يرجى إدخال عنوان الاجتماع');
      return;
    }
    setStep('members');
  };

  const handleCreate = async () => {
    if (!user?.id || !profile?.id || !organization?.id) return;

    setLoading(true);
    const roomId = generateRoomId();

    try {
    // 1. Create meeting
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

    if (error || !meeting) {
      console.error('Meeting creation error:', error);
      toast.error(error?.message || 'فشل في إنشاء الاجتماع');
      setLoading(false);
      return;
    }

    // 2. Add creator as host
    await supabase.from('video_meeting_participants').insert({
      meeting_id: meeting.id,
      user_id: user.id,
      role: 'host',
      status: 'joined',
      joined_at: new Date().toISOString(),
    });

    // 3. Add selected members as invited participants
    if (selectedMembers.length > 0) {
      const participantInserts = selectedMembers.map(member => ({
        meeting_id: meeting.id,
        user_id: member.id,
        role: 'participant' as const,
        status: 'invited' as const,
        invited_by: user.id,
      }));

      await supabase.from('video_meeting_participants').insert(participantInserts);

      // 4. Send in-app notifications to all invited members
      const notificationInserts = selectedMembers.map(member => ({
        organization_id: organization.id,
        user_id: member.id,
        title: `📹 دعوة اجتماع ${form.meeting_type === 'video' ? 'مرئي' : 'صوتي'}`,
        message: `${profile?.full_name || 'مستخدم'} يدعوك للانضمام إلى اجتماع: "${form.title}"`,
        type: 'general' as const,
        priority: 'high' as const,
        metadata: {
          meeting_id: meeting.id,
          meeting_type: form.meeting_type,
          room_id: roomId,
          action_url: '/dashboard/meetings',
        },
      }));

      await supabase.from('notifications').insert(notificationInserts);

      // 5. Send WhatsApp notifications via whatsapp-event edge function
      try {
        await supabase.functions.invoke('whatsapp-event', {
          body: {
            event_type: 'meeting_invitation',
            meeting_title: form.title,
            meeting_type: form.meeting_type,
            host_name: profile?.full_name || 'مستخدم',
            organization_id: organization.id,
            invited_user_ids: selectedMembers.map(m => m.id),
            scheduled_at: form.scheduled_at || null,
          },
        });
      } catch (e) {
        console.warn('WhatsApp notification failed (non-blocking):', e);
      }
    }

    toast.success(`تم إنشاء الاجتماع ودعوة ${selectedMembers.length} ${selectedMembers.length > 0 ? 'عضو' : ''}`);
    resetForm();
    onCreated(meeting.id);
    } catch (err) {
      console.error('Unexpected error during meeting creation:', err);
      toast.error('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setStep('details');
    setForm({ title: '', description: '', meeting_type: 'video', is_private: true, allow_chat: true, scheduled_at: '' });
    setSelectedMembers([]);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            اجتماع جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            {step === 'details' ? 'إنشاء اجتماع مرئي' : 'اختيار المشاركين'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pb-2">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            step === 'details' ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
          )}>
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
            تفاصيل
          </div>
          <ArrowLeft className="w-3 h-3 text-muted-foreground" />
          <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            step === 'members' ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
          )}>
            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
              step === 'members' ? "bg-emerald-600 text-white" : "bg-muted-foreground/30 text-muted-foreground"
            )}>2</span>
            الأعضاء
          </div>
        </div>

        {/* Step 1: Meeting details */}
        {step === 'details' && (
          <div className="space-y-4 overflow-y-auto flex-1">
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

            <Button onClick={handleNext} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Users className="w-4 h-4" />
              التالي: اختيار الأعضاء
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Member selection */}
        {step === 'members' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search and controls */}
            <div className="space-y-2 pb-3">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن عضو بالاسم..."
                  className="pr-9"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedMembers.length > 0 ? (
                    <span className="text-emerald-600 font-medium">تم اختيار {selectedMembers.length} عضو</span>
                  ) : (
                    'اختر الأعضاء المدعوين (اختياري)'
                  )}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 px-2">تحديد الكل</Button>
                  {selectedMembers.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7 px-2 text-red-500">إلغاء الكل</Button>
                  )}
                </div>
              </div>
            </div>

            {/* Selected members chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-3 max-h-20 overflow-y-auto">
                {selectedMembers.map(member => (
                  <Badge
                    key={member.id}
                    variant="secondary"
                    className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleMember(member)}
                  >
                    {member.full_name}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Members list */}
            <ScrollArea className="flex-1 min-h-0 border rounded-lg">
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? 'لا توجد نتائج' : 'لا يوجد أعضاء في المنظمة'}
                </div>
              ) : (
                <div className="p-1">
                  {filteredMembers.map(member => {
                    const isSelected = selectedMembers.some(m => m.id === member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleMember(member)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-start",
                          isSelected ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={cn("text-xs", isSelected ? "bg-emerald-600 text-white" : "bg-muted")}>
                            {(member.full_name || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2 pt-3">
              <Button variant="outline" onClick={() => setStep('details')} className="gap-1.5">
                <ArrowRight className="w-4 h-4" />
                رجوع
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                {form.scheduled_at ? 'جدولة الاجتماع' : 'بدء الاجتماع الآن'}
                {selectedMembers.length > 0 && (
                  <Badge variant="secondary" className="bg-white/20 text-white text-[10px] px-1.5">
                    +{selectedMembers.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingDialog;

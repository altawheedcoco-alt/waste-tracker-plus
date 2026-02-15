import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Send,
  Inbox,
  SendHorizonal,
  Loader2,
  MessageSquarePlus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Trash2,
  Eye,
} from 'lucide-react';
import { z } from 'zod';

interface PartnerNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  note_type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  sender_organization_id: string;
  receiver_organization_id: string;
  sender?: { name: string };
  receiver?: { name: string };
}

const noteSchema = z.object({
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200, 'العنوان يجب أن يكون أقل من 200 حرف'),
  content: z.string().trim().min(1, 'المحتوى مطلوب').max(2000, 'المحتوى يجب أن يكون أقل من 2000 حرف'),
});

const PartnerNotesDialog = ({ open, onOpenChange, partnerId, partnerName }: PartnerNotesDialogProps) => {
  const { organization, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [showNewNote, setShowNewNote] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    if (open && organization?.id) {
      fetchNotes();
    }
  }, [open, organization?.id, partnerId]);

  const fetchNotes = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_notes')
        .select(`
          *,
          sender:sender_organization_id!partner_notes_sender_organization_id_fkey(name),
          receiver:receiver_organization_id!partner_notes_receiver_organization_id_fkey(name)
        `)
        .or(`and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerId}),and(sender_organization_id.eq.${partnerId},receiver_organization_id.eq.${organization.id})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as unknown as Note[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('فشل في تحميل الملاحظات');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!organization?.id) {
      toast.error('يجب تسجيل الدخول لإرسال ملاحظة');
      return;
    }

    // Validate form
    const validation = noteSchema.safeParse({ title, content });
    if (!validation.success) {
      const errors: { title?: string; content?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'title') errors.title = err.message;
        if (err.path[0] === 'content') errors.content = err.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSending(true);
    try {
      const insertData: {
        sender_organization_id: string;
        receiver_organization_id: string;
        title: string;
        content: string;
        note_type: string;
        priority: string;
        created_by?: string;
      } = {
        sender_organization_id: organization.id,
        receiver_organization_id: partnerId,
        title: title.trim(),
        content: content.trim(),
        note_type: noteType,
        priority,
      };

      // Only add created_by if profile exists
      if (profile?.id) {
        insertData.created_by = profile.id;
      }

      const { error, data } = await supabase
        .from('partner_notes')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Note created successfully:', data);
      toast.success('تم إرسال الملاحظة بنجاح');
      setTitle('');
      setContent('');
      setNoteType('general');
      setPriority('normal');
      setShowNewNote(false);
      fetchNotes();
    } catch (error: any) {
      console.error('Error sending note:', error);
      toast.error(`فشل في إرسال الملاحظة: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('partner_notes')
        .update({ is_read: true })
        .eq('id', noteId);

      if (error) throw error;
      
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking note as read:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('partner_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast.success('تم حذف الملاحظة');
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('فشل في حذف الملاحظة');
    }
  };

  const receivedNotes = notes.filter(n => n.receiver_organization_id === organization?.id);
  const sentNotes = notes.filter(n => n.sender_organization_id === organization?.id);
  const unreadCount = receivedNotes.filter(n => !n.is_read).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">عاجل</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">مهم</Badge>;
      case 'normal':
        return <Badge variant="secondary">عادي</Badge>;
      default:
        return <Badge variant="outline">منخفض</Badge>;
    }
  };

  const getNoteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: 'عامة',
      order: 'أمر',
      inquiry: 'استفسار',
      complaint: 'شكوى',
      feedback: 'ملاحظة',
    };
    return labels[type] || type;
  };

  const NoteCard = ({ note, isSent }: { note: Note; isSent: boolean }) => (
    <div 
      className={`p-4 rounded-lg border ${!note.is_read && !isSent ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'}`}
      onClick={() => !isSent && !note.is_read && handleMarkAsRead(note.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isSent ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : !note.is_read ? (
            <Badge variant="default" className="text-xs">جديدة</Badge>
          ) : (
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-right space-y-2">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {getPriorityBadge(note.priority)}
            <Badge variant="outline">{getNoteTypeLabel(note.note_type)}</Badge>
            <h4 className="font-semibold">{note.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground justify-end">
            <span className="flex items-center gap-1">
              {format(new Date(note.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
              <Clock className="w-3 h-3" />
            </span>
            <span className="flex items-center gap-1">
              {isSent ? `إلى: ${note.receiver?.name}` : `من: ${note.sender?.name}`}
              <Building2 className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            الملاحظات والأوامر
            <FileText className="w-5 h-5 text-primary" />
          </DialogTitle>
          <DialogDescription className="text-right">
            تبادل الملاحظات والأوامر مع {partnerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* New Note Button */}
          {!showNewNote && (
            <Button onClick={() => setShowNewNote(true)} className="w-full gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              إرسال ملاحظة جديدة
            </Button>
          )}

          {/* New Note Form */}
          {showNewNote && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowNewNote(false)}>
                  إلغاء
                </Button>
                <h4 className="font-semibold">ملاحظة جديدة</h4>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-right block">العنوان *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="أدخل عنوان الملاحظة..."
                    className="text-right"
                    maxLength={200}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-destructive text-right">{formErrors.title}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-right block">الأولوية</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="normal">عادية</SelectItem>
                        <SelectItem value="high">مهمة</SelectItem>
                        <SelectItem value="urgent">عاجلة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right block">النوع</Label>
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عامة</SelectItem>
                        <SelectItem value="order">أمر</SelectItem>
                        <SelectItem value="inquiry">استفسار</SelectItem>
                        <SelectItem value="complaint">شكوى</SelectItem>
                        <SelectItem value="feedback">ملاحظة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-right block">المحتوى *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="أدخل محتوى الملاحظة..."
                    className="text-right min-h-[100px]"
                    maxLength={2000}
                  />
                  {formErrors.content && (
                    <p className="text-sm text-destructive text-right">{formErrors.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground text-left">{content.length}/2000</p>
                </div>

                <Button onClick={handleSendNote} disabled={sending} className="w-full gap-2">
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  إرسال الملاحظة
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Notes Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="gap-2">
                <Inbox className="w-4 h-4" />
                الواردة
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <SendHorizonal className="w-4 h-4" />
                المرسلة ({sentNotes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-4">
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : receivedNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد ملاحظات واردة</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-2">
                    {receivedNotes.map(note => (
                      <NoteCard key={note.id} note={note} isSent={false} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sent" className="mt-4">
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : sentNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <SendHorizonal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد ملاحظات مرسلة</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-2">
                    {sentNotes.map(note => (
                      <NoteCard key={note.id} note={note} isSent={true} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerNotesDialog;

import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pin, PinOff, CheckCircle2, Circle, Trash2, Edit3, 
  MessageSquare, Send, MoreHorizontal, AlertTriangle,
  HelpCircle, ThumbsUp, ThumbsDown, Globe, Lock, Users
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { type Note, useNoteReplies, useNotes } from '@/hooks/useNotes';
import { MentionInput } from '@/components/ui/mention-input';
import { useMentionableUsers } from '@/hooks/useMentionableUsers';
import { useShipmentMentions } from '@/hooks/useShipmentMentions';
import { useMentionNotifier } from '@/hooks/useMentionNotifier';
import MentionRenderer from './MentionRenderer';

const noteTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  comment: { label: 'تعليق', icon: <MessageSquare className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
  instruction: { label: 'تعليمات', icon: <Send className="h-3 w-3" />, color: 'bg-indigo-100 text-indigo-700' },
  warning: { label: 'تحذير', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-amber-100 text-amber-700' },
  approval: { label: 'موافقة', icon: <ThumbsUp className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-700' },
  rejection: { label: 'رفض', icon: <ThumbsDown className="h-3 w-3" />, color: 'bg-red-100 text-red-700' },
  question: { label: 'سؤال', icon: <HelpCircle className="h-3 w-3" />, color: 'bg-purple-100 text-purple-700' },
  answer: { label: 'إجابة', icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-teal-100 text-teal-700' },
};

const visibilityConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  internal: { label: 'داخلي', icon: <Lock className="h-3 w-3" /> },
  partner: { label: 'مشترك', icon: <Users className="h-3 w-3" /> },
  public: { label: 'عام', icon: <Globe className="h-3 w-3" /> },
};

const priorityConfig: Record<string, string> = {
  low: 'border-l-muted',
  normal: 'border-l-primary/30',
  high: 'border-l-amber-500',
  urgent: 'border-l-destructive',
};

interface NoteItemProps {
  note: Note;
  resourceType: string;
  resourceId: string;
  isReply?: boolean;
}

const NoteItem = ({ note, resourceType, resourceId, isReply = false }: NoteItemProps) => {
  const { profile } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const { replies, isLoading: loadingReplies } = useNoteReplies(showReplies ? note.id : '');
  const { createNote, updateNote, deleteNote, togglePin, toggleResolve } = useNotes(resourceType, resourceId);
  const { users } = useMentionableUsers();
  const { results: shipmentResults, searchShipments } = useShipmentMentions();
  const { notify: notifyMentions } = useMentionNotifier();

  const isAuthor = profile?.id === note.author_id;
  const typeConfig = noteTypeConfig[note.note_type] || noteTypeConfig.comment;
  const visConfig = visibilityConfig[note.visibility] || visibilityConfig.internal;

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createNote.mutate({
      content: replyContent,
      parent_note_id: note.id,
      visibility: note.visibility,
      target_organization_id: note.target_organization_id,
    });
    // Send mention notifications
    notifyMentions({
      text: replyContent,
      users,
      context: `رد على ملاحظة في ${resourceType === 'shipment' ? 'شحنة' : 'محادثة'}`,
      referenceId: resourceId,
      referenceType: resourceType,
    });
    setReplyContent('');
  };

  const handleEdit = () => {
    updateNote.mutate({ id: note.id, content: editContent });
    setIsEditing(false);
  };

  const initials = note.author?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || '؟';

  return (
    <div className={cn(
      "group border-r-4 rounded-lg p-3 transition-all",
      priorityConfig[note.priority] || priorityConfig.normal,
      note.is_pinned && "bg-amber-50/50 dark:bg-amber-900/10",
      note.is_resolved && "opacity-60",
      isReply ? "mr-6 border-r-2" : "bg-muted/20"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1">
          {!isReply && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {isAuthor && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-3 w-3 ml-2" /> تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteNote.mutate(note.id)} className="text-destructive">
                      <Trash2 className="h-3 w-3 ml-2" /> حذف
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => togglePin.mutate({ id: note.id, pinned: note.is_pinned })}>
                  {note.is_pinned ? <PinOff className="h-3 w-3 ml-2" /> : <Pin className="h-3 w-3 ml-2" />}
                  {note.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleResolve.mutate({ id: note.id, resolved: note.is_resolved })}>
                  {note.is_resolved ? <Circle className="h-3 w-3 ml-2" /> : <CheckCircle2 className="h-3 w-3 ml-2" />}
                  {note.is_resolved ? 'إعادة فتح' : 'تم الحل'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="text-right">
            <p className="text-sm font-medium">{note.author?.full_name || 'مستخدم'}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(note.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
              {note.is_edited && ' (معدّل)'}
            </p>
          </div>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary/10">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mt-2 justify-end flex-wrap">
        <Badge className={cn("text-xs gap-1", typeConfig.color)}>
          {typeConfig.icon} {typeConfig.label}
        </Badge>
        <Badge variant="outline" className="text-xs gap-1">
          {visConfig.icon} {visConfig.label}
        </Badge>
        {note.is_pinned && <Badge variant="secondary" className="text-xs gap-1"><Pin className="h-3 w-3" /> مثبت</Badge>}
        {note.is_resolved && <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> محلول</Badge>}
        {note.priority === 'urgent' && <Badge variant="destructive" className="text-xs">عاجل</Badge>}
        {note.priority === 'high' && <Badge className="bg-amber-100 text-amber-700 text-xs">مهم</Badge>}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <MentionInput
            value={editContent}
            onChange={setEditContent}
            users={users}
            shipments={shipmentResults}
            onShipmentSearch={searchShipments}
            placeholder="تعديل الملاحظة..."
            className="text-right text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleEdit}>حفظ</Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-right leading-relaxed">
          <MentionRenderer content={note.content} />
        </div>
      )}

      {/* Reply Section */}
      {!isReply && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowReplies(!showReplies)}
          >
            <MessageSquare className="h-3 w-3" />
            {showReplies ? 'إخفاء الردود' : 'الردود'}
          </Button>

          {showReplies && (
            <div className="mt-2 space-y-2">
              {replies.map((reply) => (
                <NoteItem key={reply.id} note={reply} resourceType={resourceType} resourceId={resourceId} isReply />
              ))}

              <div className="flex gap-2 mr-6">
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                  <Send className="h-3 w-3" />
                </Button>
                <MentionInput
                  value={replyContent}
                  onChange={setReplyContent}
                  users={users}
                  shipments={shipmentResults}
                  onShipmentSearch={searchShipments}
                  placeholder="اكتب ردك... (استخدم @ للإشارة)"
                  className="text-right text-sm min-h-[60px]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteItem;

import { memo, useState } from 'react';
import { useComments } from '@/hooks/useSocialInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MessageCircle, Send, Edit2, Trash2, CornerDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type EntityType = 'shipment' | 'auction' | 'marketplace_listing' | 'organization_profile';

interface CommentSectionProps {
  entityType: EntityType;
  entityId: string;
  maxHeight?: string;
  className?: string;
}

const CommentSection = memo(({ entityType, entityId, maxHeight = '400px', className }: CommentSectionProps) => {
  const { user } = useAuth();
  const { rootComments, getReplies, isLoading, addComment, editComment, deleteComment, isAdding } = useComments(entityType, entityId);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment({ content: newComment, parentId: replyTo || undefined });
    setNewComment('');
    setReplyTo(null);
  };

  const handleEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    editComment({ commentId, content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const visibleComments = expanded ? rootComments : rootComments.slice(0, 3);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>التعليقات ({rootComments.length})</span>
        {rootComments.length > 3 && (
          expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {/* Comments List */}
      {rootComments.length > 0 && (
        <div className="space-y-2" style={{ maxHeight: expanded ? maxHeight : undefined, overflowY: expanded ? 'auto' : undefined }}>
          {visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              currentUserId={user?.id}
              editingId={editingId}
              editContent={editContent}
              onReply={() => setReplyTo(comment.id)}
              onStartEdit={(id, content) => { setEditingId(id); setEditContent(content); }}
              onSaveEdit={handleEdit}
              onCancelEdit={() => setEditingId(null)}
              onDelete={deleteComment}
              onEditContentChange={setEditContent}
            />
          ))}
        </div>
      )}

      {/* New Comment Input */}
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 mt-1">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          {replyTo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" />
              <span>رد على تعليق</span>
              <button onClick={() => setReplyTo(null)} className="text-destructive hover:underline">إلغاء</button>
            </div>
          )}
          <div className="flex items-end gap-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="min-h-[36px] max-h-[100px] text-sm resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              disabled={!newComment.trim() || isAdding}
              onClick={handleSubmit}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CommentSection.displayName = 'CommentSection';

// ===== Comment Item =====
interface CommentItemProps {
  comment: any;
  replies: any[];
  currentUserId?: string;
  editingId: string | null;
  editContent: string;
  onReply: () => void;
  onStartEdit: (id: string, content: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onEditContentChange: (v: string) => void;
}

const CommentItem = memo(({
  comment, replies, currentUserId, editingId, editContent,
  onReply, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onEditContentChange,
}: CommentItemProps) => {
  const isOwn = comment.user_id === currentUserId;
  const isEditing = editingId === comment.id;

  return (
    <div className="space-y-1">
      <div className={cn('flex gap-2 p-2 rounded-lg', isOwn ? 'bg-primary/5' : 'bg-muted/50')}>
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[10px]">U</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">مستخدم</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(comment.created_at), { locale: ar, addSuffix: true })}</span>
            {comment.is_edited && <span className="italic">(معدل)</span>}
          </div>

          {isEditing ? (
            <div className="mt-1 flex items-end gap-1">
              <Textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="min-h-[32px] text-sm resize-none"
                rows={1}
              />
              <Button size="sm" variant="ghost" onClick={() => onSaveEdit(comment.id)}>حفظ</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>إلغاء</Button>
            </div>
          ) : (
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mt-1">
              <button onClick={onReply} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> رد
              </button>
              {isOwn && (
                <>
                  <button onClick={() => onStartEdit(comment.id, comment.content)} className="text-xs text-muted-foreground hover:text-primary">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={() => onDelete(comment.id)} className="text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mr-6 border-r-2 border-muted pr-2 space-y-1">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              currentUserId={currentUserId}
              editingId={editingId}
              editContent={editContent}
              onReply={onReply}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onEditContentChange={onEditContentChange}
            />
          ))}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

export default CommentSection;

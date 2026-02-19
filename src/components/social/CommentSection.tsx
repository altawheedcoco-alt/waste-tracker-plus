import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComments } from '@/hooks/useSocialInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Send, Edit2, Trash2, CornerDownLeft, ChevronDown, MessageCircle } from 'lucide-react';
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
  const hasMore = rootComments.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('space-y-3', className)}
    >
      {/* New Comment Input */}
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 mt-0.5 ring-2 ring-primary/10">
          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5 text-xs text-primary/80 bg-primary/5 rounded-full px-3 py-1 w-fit"
              >
                <CornerDownLeft className="h-3 w-3" />
                <span>رد على تعليق</span>
                <button onClick={() => setReplyTo(null)} className="text-destructive hover:underline font-medium mr-1">✕</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-end gap-1.5">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقاً..."
              className="min-h-[40px] max-h-[100px] text-sm resize-none rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 px-4 py-2.5"
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
              disabled={!newComment.trim() || isAdding}
              onClick={handleSubmit}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {rootComments.length > 0 && (
        <div
          className="space-y-1.5 pr-1"
          style={{ maxHeight: expanded ? maxHeight : undefined, overflowY: expanded ? 'auto' : undefined }}
        >
          <AnimatePresence initial={false}>
            {visibleComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <CommentItem
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
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium py-1.5 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors w-fit mx-auto"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              عرض المزيد ({rootComments.length - 3} تعليق)
            </button>
          )}
        </div>
      )}

      {rootComments.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground">
          <MessageCircle className="h-8 w-8 opacity-30" />
          <span className="text-xs">لا توجد تعليقات بعد، كن أول من يعلّق</span>
        </div>
      )}
    </motion.div>
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
      <div className={cn(
        'group flex gap-2.5 py-2 px-3 rounded-2xl transition-colors duration-150',
        isOwn ? 'bg-primary/5' : 'bg-muted/40 hover:bg-muted/60'
      )}>
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className={cn(
            'text-[10px] font-bold',
            isOwn ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            U
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">مستخدم</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground/60">
              {formatDistanceToNow(new Date(comment.created_at), { locale: ar, addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-muted-foreground/40 italic text-[10px]">(معدّل)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1.5 flex items-end gap-1.5">
              <Textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="min-h-[32px] text-sm resize-none rounded-xl border-primary/20"
                rows={1}
                autoFocus
              />
              <Button size="sm" variant="default" onClick={() => onSaveEdit(comment.id)} className="h-8 rounded-lg text-xs">
                حفظ
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 rounded-lg text-xs">
                إلغاء
              </Button>
            </div>
          ) : (
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={onReply}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 font-medium transition-colors"
              >
                <CornerDownLeft className="h-3 w-3" /> رد
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => onStartEdit(comment.id, comment.content)}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
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
        <div className="mr-8 border-r-2 border-primary/10 pr-3 space-y-1">
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

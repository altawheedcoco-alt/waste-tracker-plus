import { useState, useEffect, useRef, useCallback, memo, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Search, Loader2, ArrowRight, Shield,
  MoreVertical, Send, Lock, Download, VolumeX, Ban,
  FileText, Building2, StickyNote, Bell, BellOff,
  ChevronDown, ChevronRight, Users, Plus, X, Hash,
  Reply, Forward, SmilePlus, Paintbrush, Info, BarChart3, Radio
} from 'lucide-react';
import ClickableImage from '@/components/ui/ClickableImage';
import VoiceMessagePlayer from '@/components/chat/VoiceMessagePlayer';
import { MediaThumbnail } from '@/components/media';
import { detectMediaType } from '@/lib/mediaUtils';
import ChatPartnerInfo from '@/components/chat/ChatPartnerInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EnhancedChatInput from '@/components/chat/EnhancedChatInput';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrivateChat, type PrivateConversation, type DecryptedMessage } from '@/hooks/usePrivateChat';
import { useChatReactions } from '@/hooks/useChatReactions';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck } from 'lucide-react';
import MessageReactionsDisplay, { ReactionPicker } from '@/components/chat/MessageReactions';
import ReplyPreviewBar, { QuotedReply } from '@/components/chat/ReplyPreview';
import ChatWallpaperPicker from '@/components/chat/ChatWallpaperPicker';
import { ChatAppearanceProvider, useChatAppearance } from '@/contexts/ChatAppearanceContext';
import MentionRendererNote from '@/components/notes/MentionRenderer';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useOnlinePresence, useUserOnlineStatus } from '@/hooks/useOnlinePresence';
import TypingIndicator from '@/components/chat/TypingIndicator';
import SwipeableMessage from '@/components/chat/SwipeableMessage';

// ─── Types ──────────────────────────────────────────────
interface OrgGroup {
  orgId: string;
  orgName: string;
  conversations: PrivateConversation[];
  totalUnread: number;
}

interface ConversationNote {
  id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface ReplyTo {
  id: string;
  content: string;
  senderName: string;
}

// ─── Conversation List Item ─────────────────────────────
const ConversationItem = memo(({ 
  conversation, isActive, onClick, currentUserId, compact = false
}: { 
  conversation: PrivateConversation; 
  isActive: boolean; 
  onClick: () => void;
  currentUserId?: string;
  compact?: boolean;
}) => {
  const formatTime = (t?: string | null) => {
    if (!t) return '';
    const d = new Date(t);
    if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
    if (isYesterday(d)) return 'أمس';
    return format(d, 'd/M', { locale: ar });
  };

  const isMyLastMessage = !!currentUserId && conversation.last_message_sender_id === currentUserId;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 cursor-pointer transition-colors border-b border-border/30",
        compact ? "px-2 py-2" : "px-3 py-2.5",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar className={compact ? "w-9 h-9" : "w-11 h-11"}>
          <AvatarImage src={conversation.partner?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {conversation.partner?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold truncate">{conversation.partner?.full_name || 'مستخدم'}</h4>
          <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {isMyLastMessage && (
              conversation.last_message_status === 'read'
                ? <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                : conversation.last_message_status === 'delivered'
                  ? <CheckCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  : <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            {!isMyLastMessage && <Lock className="w-3 h-3 text-emerald-500 shrink-0" />}
            <p className="text-xs text-muted-foreground truncate">
              {conversation.lastDecryptedPreview || (!compact && (conversation.partner?.organization_name || 'رسالة مشفرة')) || 'رسالة مشفرة'}
            </p>
          </div>
          {(conversation.unread_count || 0) > 0 && (
            <Badge className="h-5 min-w-5 rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ConversationItem.displayName = 'ConversationItem';

// ─── Org Group Header ───────────────────────────────────
const OrgGroupHeader = memo(({ group, isExpanded, onToggle }: {
  group: OrgGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors text-start"
  >
    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
    <Building2 className="w-4 h-4 text-primary/70" />
    <span className="text-xs font-semibold flex-1 truncate">{group.orgName}</span>
    <span className="text-[10px] text-muted-foreground">{group.conversations.length}</span>
    {group.totalUnread > 0 && (
      <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-primary text-primary-foreground">
        {group.totalUnread}
      </Badge>
    )}
  </button>
));
OrgGroupHeader.displayName = 'OrgGroupHeader';

// ─── Message Bubble with Reactions + Reply + Long-press + Double-tap ──────────────
const MessageBubble = memo(({ 
  message, isMine, reactions, onReact, onReply, onForward, allMessages 
}: { 
  message: DecryptedMessage; 
  isMine: boolean;
  reactions: { emoji: string; count: number; users: string[]; reacted: boolean }[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  allMessages: DecryptedMessage[];
}) => {
  const { getBubbleClasses, textStyle, showTimestamp, compactMode } = useChatAppearance();
  const appNavigate = useAppNavigate();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  const getStatusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
      default: return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  // Long-press
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setShowContextMenu(true), 500);
  }, []);
  const handleTouchEnd = useCallback(() => clearTimeout(longPressTimer.current), []);

  // Double-tap
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onReact('❤️');
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onReact]);

  const repliedMessage = message.reply_to_id
    ? allMessages.find(m => m.id === message.reply_to_id)
    : null;

  const broadcastLinkMatch = message.message_type === 'text'
    ? message.content.match(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels\?channel=([a-f0-9-]+)(?:&post=([a-f0-9-]+))?/i)
    : null;

  const messageTextWithoutBroadcastLink = broadcastLinkMatch
    ? message.content.replace(/https?:\/\/[^\s]+\/dashboard\/broadcast-channels[^\s]*/gi, '').trim()
    : message.content;

  if (message.is_deleted) {
    return (
      <div className={cn("flex mb-1", isMine ? "justify-start" : "justify-end")}>
        <div className="px-3 py-1.5 rounded-lg bg-muted/50 italic text-xs text-muted-foreground">
          🚫 تم حذف هذه الرسالة
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={cn("flex group relative select-none", isMine ? "justify-start" : "justify-end", compactMode ? "mb-0.5" : "mb-1")}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(true); }}
      >
        <div className="max-w-[75%] relative">
          {/* Quick action buttons on hover (desktop) */}
          <div className={cn(
            "absolute top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isMine ? "-left-20" : "-right-20"
          )}>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onReply(); }}>
              <Reply className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); onForward(); }}>
              <Forward className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className={cn(getBubbleClasses(isMine), "relative")}>
            {!isMine && message.sender && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.sender_id) window.open(`/dashboard/profile?userId=${message.sender_id}`, '_blank');
                }}
                className="text-[10px] font-semibold text-primary mb-0.5 hover:underline cursor-pointer text-right"
              >
                {message.sender.full_name}
              </button>
            )}

            {repliedMessage && (
              <QuotedReply
                senderName={repliedMessage.sender?.full_name || 'مستخدم'}
                content={repliedMessage.content}
                isOwn={isMine}
              />
            )}
            
            {message.file_url && (
              <div className="mb-1">
                {message.message_type === 'voice' || (message.message_type === 'file' && message.file_name && /\.(webm|mp3|wav|ogg|m4a)$/i.test(message.file_name)) ? (
                  <VoiceMessagePlayer url={message.file_url} isOwn={isMine} />
                ) : (() => {
                  const mType = detectMediaType(message.file_url, undefined);
                  if (mType === 'image' || message.message_type === 'image') {
                    return <MediaThumbnail url={message.file_url!} title={message.file_name || ''} size="lg" className="max-w-[280px] max-h-60" />;
                  }
                  if (mType === 'video' || message.message_type === 'video') {
                    return <MediaThumbnail url={message.file_url!} title={message.file_name || ''} size="lg" aspectRatio="video" className="max-w-[280px]" />;
                  }
                  if (mType === 'pdf') {
                    return <MediaThumbnail url={message.file_url!} title={message.file_name || 'PDF'} size="md" />;
                  }
                  return (
                    <a href={message.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-background/20 hover:bg-background/30 transition-colors">
                      <FileText className="w-5 h-5" />
                      <span className="text-xs truncate">{message.file_name || 'ملف'}</span>
                      <Download className="w-4 h-4 shrink-0 opacity-60" />
                    </a>
                  );
                })()}
              </div>
            )}
            
            {broadcastLinkMatch ? (
              <div className="space-y-2">
                {messageTextWithoutBroadcastLink && (
                  <p className="leading-relaxed whitespace-pre-wrap break-words" style={textStyle}>
                    {messageTextWithoutBroadcastLink}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => appNavigate(`/dashboard/broadcast-channels?channel=${broadcastLinkMatch[1]}${broadcastLinkMatch[2] ? `&post=${broadcastLinkMatch[2]}` : ''}`)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 px-3 py-3 text-right transition-colors hover:bg-muted/70"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {broadcastLinkMatch[2] ? '📡 منشور من قناة البث' : '📡 قناة بث'}
                    </p>
                    <p className="text-xs text-muted-foreground">اضغط لفتح القناة مباشرة</p>
                  </div>
                </button>
              </div>
            ) : (
              <p className="leading-relaxed whitespace-pre-wrap break-words" style={textStyle}>{message.content}</p>
            )}
            
            {showTimestamp && (
              <div className={cn(
                "flex items-center gap-1 mt-0.5",
                isMine ? "justify-start" : "justify-end"
              )}>
                <span className={cn(
                  "text-[9px]",
                  isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                )}>
                  {format(new Date(message.created_at), 'hh:mm a', { locale: ar })}
                </span>
                {message.is_edited && (
                  <span className={cn(
                    "text-[9px]",
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>تم التعديل</span>
                )}
                {getStatusIcon()}
              </div>
            )}

            {/* Double-tap heart animation */}
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-3xl drop-shadow-lg">❤️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MessageReactionsDisplay reactions={reactions} onReact={onReact} isOwn={isMine} />
          <ReactionPicker onReact={onReact} isOwn={isMine} />
        </div>
      </motion.div>

      <MessageContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onReply={onReply}
        onForward={onForward}
        onCopy={() => { navigator.clipboard.writeText(message.content); toast.success('تم النسخ'); }}
        isMine={isMine}
      />
    </>
  );
});
MessageBubble.displayName = 'MessageBubble';

// ─── Date Separator ─────────────────────────────────────
const DateSeparator = ({ date }: { date: Date }) => {
  let label: string;
  if (isToday(date)) label = 'اليوم';
  else if (isYesterday(date)) label = 'أمس';
  else label = format(date, 'EEEE d MMMM yyyy', { locale: ar });

  return (
    <div className="flex items-center gap-3 my-3 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

// ─── Notes Panel ────────────────────────────────────────
const NotesPanel = memo(({ 
  conversationId,
  organizationId,
  targetOrganizationId,
}: {
  conversationId: string;
  organizationId?: string;
  targetOrganizationId?: string | null;
}) => {
  const [noteText, setNoteText] = useState('');
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Conversation notes
  const { data: convoNotes = [], isLoading: loadingConvo } = useQuery({
    queryKey: ['conversation-notes', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          content,
          created_at,
          author:profiles!notes_author_id_fkey(full_name)
        `)
        .eq('resource_type', 'conversation')
        .eq('resource_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((note: any) => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        author_name: note.author?.full_name || 'مجهول',
        source: 'conversation' as const,
      })) as (ConversationNote & { source: string })[];
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  // Shipment notes shared between the two orgs
  const { data: shipmentNotes = [], isLoading: loadingShipment } = useQuery({
    queryKey: ['shared-shipment-notes', organizationId, targetOrganizationId],
    queryFn: async () => {
      if (!organizationId || !targetOrganizationId) return [];
      
      // Find shipments shared between the two orgs
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, shipment_number')
        .or(
          `and(generator_id.eq.${organizationId},transporter_id.eq.${targetOrganizationId}),` +
          `and(generator_id.eq.${organizationId},recycler_id.eq.${targetOrganizationId}),` +
          `and(transporter_id.eq.${organizationId},generator_id.eq.${targetOrganizationId}),` +
          `and(transporter_id.eq.${organizationId},recycler_id.eq.${targetOrganizationId}),` +
          `and(recycler_id.eq.${organizationId},generator_id.eq.${targetOrganizationId}),` +
          `and(recycler_id.eq.${organizationId},transporter_id.eq.${targetOrganizationId})`
        )
        .order('created_at', { ascending: false })
        .limit(20);

      if (!shipments?.length) return [];

      const shipmentIds = shipments.map(s => s.id);
      const shipmentMap = new Map(shipments.map(s => [s.id, s.shipment_number]));

      const { data: notes } = await supabase
        .from('notes')
        .select(`
          id, content, created_at, resource_id,
          author:profiles!notes_author_id_fkey(full_name)
        `)
        .eq('resource_type', 'shipment')
        .in('resource_id', shipmentIds)
        .order('created_at', { ascending: false })
        .limit(30);

      return (notes || []).map((note: any) => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        author_name: note.author?.full_name || 'مجهول',
        source: 'shipment',
        shipment_number: shipmentMap.get(note.resource_id) || '',
      }));
    },
    enabled: !!organizationId && !!targetOrganizationId,
    refetchInterval: 10000,
  });

  const notes = useMemo(() => {
    const all = [
      ...convoNotes.map(n => ({ ...n, source: 'conversation' })),
      ...shipmentNotes,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
  }, [convoNotes, shipmentNotes]);

  const isLoading = loadingConvo || loadingShipment;

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation-notes-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `resource_id=eq.${conversationId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!profile?.id || !organizationId) throw new Error('Missing profile or org');
      const { error } = await supabase.from('notes').insert({
        resource_type: 'conversation',
        resource_id: conversationId,
        content,
        author_id: profile.id,
        organization_id: organizationId,
        target_organization_id: targetOrganizationId || null,
        visibility: targetOrganizationId ? 'partner' : 'internal',
        note_type: 'comment',
        priority: 'normal',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-notes', conversationId] });
      setNoteText('');
      toast.success('تم إضافة الملاحظة');
    },
  });

  return (
    <div className="flex flex-col h-full border-s border-border bg-card">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold">الملاحظات</span>
        <Badge variant="outline" className="text-[10px]">{notes.length}</Badge>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">لا توجد ملاحظات</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note: any) => (
              <div key={note.id} className={cn(
                'p-2.5 rounded-lg border',
                note.source === 'shipment'
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/30 dark:border-blue-800/30'
                  : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/30 dark:border-amber-800/30'
              )}>
                {note.source === 'shipment' && note.shipment_number && (
                  <Badge variant="outline" className="text-[9px] mb-1 text-blue-600 border-blue-300">
                    شحنة #{note.shipment_number}
                  </Badge>
                )}
                <p className="text-sm whitespace-pre-wrap"><MentionRendererNote content={note.content} /></p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{note.author_name}</span>
                  <span>{format(new Date(note.created_at), 'dd/MM HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="إضافة ملاحظة..."
            className="text-sm h-9"
            onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) addNote.mutate(noteText.trim()); }}
          />
          <Button
            size="sm"
            onClick={() => noteText.trim() && addNote.mutate(noteText.trim())}
            disabled={!noteText.trim() || addNote.isPending}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
NotesPanel.displayName = 'NotesPanel';

// ─── Empty State ────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
      <Icon className="w-10 h-10 text-primary/30" />
    </div>
    <p className="font-semibold text-foreground">{title}</p>
    <p className="text-xs mt-1 max-w-xs text-center">{subtitle}</p>
  </div>
);

// ─── Partner Member Type ────────────────────────────────
interface PartnerMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role?: string;
}

interface LinkedPartnerOrg {
  id: string;
  name: string;
  organization_type: string;
  logo_url: string | null;
  members: PartnerMember[];
}

// ─── Main Chat Page ─────────────────────────────────────
const EncryptedChatInner = () => {
  const { user, organization, profile } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useDisplayMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const {
    conversations, conversationsLoading, getOrCreateConversation,
    fetchMessages, decryptSingleRow, sendMessage, sendFileMessage, markAsRead, exportChatHistory,
    toggleBlock, toggleMute,
  } = usePrivateChat();

  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'all' | 'orgs' | 'partners'>('orgs');
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedPartnerOrgs, setExpandedPartnerOrgs] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);
  
  // Typing indicator
  const { isPartnerTyping, partnerTypingName, sendTyping, stopTyping } = useTypingIndicator(selectedConvoId || undefined);
  
  // Online presence
  useOnlinePresence();
  const partnerOnline = useUserOnlineStatus(selectedConvo?.partner?.user_id);

  // Reactions
  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { reactionsMap, toggleReaction } = useChatReactions(messageIds);

  // ─── Fetch Linked Partner Orgs + Members ─────────────
  const { data: linkedPartners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['chat-linked-partners', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // 1. Get active verified partnerships
      const { data: partnerships, error: pErr } = await supabase
        .from('verified_partnerships')
        .select('requester_org_id, partner_org_id')
        .or(`requester_org_id.eq.${organization.id},partner_org_id.eq.${organization.id}`)
        .eq('status', 'active');

      if (pErr) throw pErr;

      const partnerIds = new Set<string>();
      partnerships?.forEach(p => {
        const otherId = p.requester_org_id === organization.id ? p.partner_org_id : p.requester_org_id;
        if (otherId) partnerIds.add(otherId);
      });

      if (partnerIds.size === 0) return [];

      const partnerIdsArr = Array.from(partnerIds);

      // 2. Fetch partner orgs
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type, logo_url')
        .in('id', partnerIdsArr)
        .eq('is_active', true)
        .order('name');

      if (!orgs?.length) return [];

      // 3. Fetch members of those orgs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .in('organization_id', partnerIdsArr);

      const membersByOrg = new Map<string, PartnerMember[]>();
      (profiles || []).forEach(p => {
        if (!p.organization_id) return;
        const list = membersByOrg.get(p.organization_id) || [];
        list.push({
          user_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        });
        membersByOrg.set(p.organization_id, list);
      });

      return orgs.map(o => ({
        id: o.id,
        name: o.name,
        organization_type: o.organization_type as string,
        logo_url: o.logo_url,
        members: membersByOrg.get(o.id) || [],
      })) as LinkedPartnerOrg[];
    },
    enabled: !!organization?.id,
  });

  // Start conversation with a partner member
  const handleStartConvoWithMember = async (member: PartnerMember) => {
    if (!user) return;
    try {
      // Check if conversation already exists
      const existingConvo = conversations.find(c => c.partner?.user_id === member.user_id);
      if (existingConvo) {
        setSelectedConvoId(existingConvo.id);
        if (isMobile) setShowSidebar(false);
        return;
      }
      const convoId = await getOrCreateConversation(member.user_id);
      if (convoId) {
        setSelectedConvoId(convoId);
        if (isMobile) setShowSidebar(false);
        // Refresh conversations
        queryClient.invalidateQueries({ queryKey: ['private-conversations'] });
      }
    } catch {
      toast.error('فشل بدء المحادثة');
    }
  };

  const togglePartnerOrgExpand = (orgId: string) => {
    setExpandedPartnerOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  // Wallpaper
  const { getWallpaperStyle } = useChatWallpaper(selectedConvoId || undefined);

  // Group conversations by organization
  const orgGroups = useMemo((): OrgGroup[] => {
    const grouped = new Map<string, OrgGroup>();
    const noOrg: PrivateConversation[] = [];

    conversations.forEach(conv => {
      const orgName = conv.partner?.organization_name;
      if (!orgName) {
        noOrg.push(conv);
        return;
      }
      const key = orgName;
      if (!grouped.has(key)) {
        grouped.set(key, {
          orgId: key,
          orgName: orgName,
          conversations: [],
          totalUnread: 0,
        });
      }
      const group = grouped.get(key)!;
      group.conversations.push(conv);
      group.totalUnread += conv.unread_count || 0;
    });

    const result = Array.from(grouped.values()).sort((a, b) => {
      if (a.totalUnread !== b.totalUnread) return b.totalUnread - a.totalUnread;
      return a.orgName.localeCompare(b.orgName, 'ar');
    });

    if (noOrg.length > 0) {
      result.push({
        orgId: '__none__',
        orgName: 'بدون جهة',
        conversations: noOrg,
        totalUnread: noOrg.reduce((s, c) => s + (c.unread_count || 0), 0),
      });
    }

    return result;
  }, [conversations]);

  // Auto-expand orgs with unread
  useEffect(() => {
    const withUnread = orgGroups.filter(g => g.totalUnread > 0).map(g => g.orgId);
    if (withUnread.length > 0) {
      setExpandedOrgs(prev => new Set([...prev, ...withUnread]));
    }
  }, [orgGroups]);

  // Auto-open conversation from URL params (e.g. ?partnerId=xxx or ?conv=xxx)
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam && !conversationsLoading) {
      const found = conversations.find(c => c.id === convParam);
      if (found) {
        setSelectedConvoId(found.id);
        setShowSidebar(false);
        searchParams.delete('conv');
        setSearchParams(searchParams, { replace: true });
      }
      return;
    }

    const partnerId = searchParams.get('partnerId') || searchParams.get('partner');
    if (!partnerId || !user || conversationsLoading) return;

    // partnerId is an organization ID — find a member and open/create conversation
    (async () => {
      try {
        const { data: members } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', partnerId)
          .limit(1);

        if (members && members.length > 0) {
          const targetUserId = members[0].user_id;
          // Check if we already have a conversation with this user
          const existingConvo = conversations.find(c => c.partner?.user_id === targetUserId);
          if (existingConvo) {
            setSelectedConvoId(existingConvo.id);
          } else {
            const convoId = await getOrCreateConversation(targetUserId);
            if (convoId) {
              setSelectedConvoId(convoId);
            }
          }
          setShowSidebar(false);
        } else {
          toast.error('لم يتم العثور على أعضاء في هذه الجهة');
        }
      } catch {
        toast.error('فشل فتح المحادثة');
      }
      // Clear params
      searchParams.delete('partnerId');
      searchParams.delete('partner');
      searchParams.delete('partnerName');
      setSearchParams(searchParams, { replace: true });
    })();
  }, [searchParams, user, conversations, conversationsLoading]);

  const toggleOrgExpand = (orgId: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvoId) return;
    let cancelled = false;
    
    setMessagesLoading(true);
    setReplyTo(null);
    setShowPartnerInfo(false);
    fetchMessages(selectedConvoId).then(msgs => {
      if (!cancelled) {
        setMessages(msgs);
        setMessagesLoading(false);
        markAsRead(selectedConvoId);
      }
    }).catch(() => {
      if (!cancelled) setMessagesLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedConvoId, fetchMessages, markAsRead]);

  // Realtime: append new messages instantly, update statuses
  useEffect(() => {
    if (!selectedConvoId) return;

    const channel = supabase
      .channel(`chat-${selectedConvoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'encrypted_messages',
        filter: `conversation_id=eq.${selectedConvoId}`,
      }, async (payload) => {
        const row = payload.new as any;
        // Skip if already in state (optimistic or duplicate)
        setMessages(prev => {
          if (prev.some(m => m.id === row.id)) return prev;
          return prev; // trigger decrypt below
        });
        const decrypted = await decryptSingleRow(row, selectedConvoId);
        if (decrypted) {
          setMessages(prev => {
            // Remove any optimistic temp message & avoid duplicates
            const filtered = prev.filter(m => m.id !== decrypted.id && !m.id.startsWith('temp_'));
            return [...filtered, decrypted];
          });
        }
        markAsRead(selectedConvoId);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'encrypted_messages',
        filter: `conversation_id=eq.${selectedConvoId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m => 
          m.id === updated.id ? { ...m, status: updated.status || m.status, is_edited: updated.is_edited || m.is_edited, is_deleted: updated.is_deleted || m.is_deleted } : m
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvoId, decryptSingleRow, markAsRead]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConvo = (convo: PrivateConversation) => {
    setSelectedConvoId(convo.id);
    if (isMobile) setShowSidebar(false);
  };


  const handleReply = (msg: DecryptedMessage) => {
    setReplyTo({
      id: msg.id,
      content: msg.content.substring(0, 100),
      senderName: msg.sender?.full_name || (msg.sender_id === user?.id ? 'أنت' : 'مستخدم'),
    });
    
  };

  const handleForward = (msg: DecryptedMessage) => {
    navigator.clipboard.writeText(msg.content);
    toast.success('تم نسخ الرسالة — اختر محادثة وألصقها');
  };

  const handleExport = async () => {
    if (!selectedConvoId) return;
    try {
      await exportChatHistory(selectedConvoId);
    } catch {
      toast.error('فشل تصدير المحادثة');
    }
  };

  const filteredConversations = conversations.filter(c =>
    !searchQuery || c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partner?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgGroups = useMemo(() => {
    if (!searchQuery) return orgGroups;
    return orgGroups.map(g => ({
      ...g,
      conversations: g.conversations.filter(c =>
        c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partner?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(g => g.conversations.length > 0);
  }, [orgGroups, searchQuery]);

  if (!user) return null;

  const showChat = !isMobile || !showSidebar;
  const showSidebarPanel = !isMobile || showSidebar;

  // Group messages by date
  const groupedMessages: { date: Date; messages: DecryptedMessage[] }[] = [];
  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    }
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

    return (
      <div className={cn(
        "flex overflow-hidden bg-background",
        isMobile ? "h-full" : "h-full"
      )}>
        {/* ===== SIDEBAR ===== */}
        <AnimatePresence mode="wait">
          {showSidebarPanel && (
            <motion.div
              initial={isMobile ? { x: 100, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: 100, opacity: 0 } : undefined}
              transition={{ type: 'spring', damping: 25 }}
              className={cn(
                "h-full flex flex-col bg-card border-l border-border",
                isMobile ? "w-full" : "w-[300px] min-w-[300px]"
              )}
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b border-border bg-gradient-to-l from-emerald-500/5 to-transparent">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm">مركز التواصل</h2>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> تشفير طرف لطرف
                        {totalUnread > 0 && (
                          <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-destructive text-destructive-foreground ms-1">
                            {totalUnread}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث بالاسم أو الجهة..."
                    className="pr-9 h-9 text-sm bg-muted/50 border-none"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex rounded-lg bg-muted/50 p-0.5">
                  <button
                    onClick={() => setSidebarTab('orgs')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                      sidebarTab === 'orgs' ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    حسب الجهة
                  </button>
                  <button
                    onClick={() => setSidebarTab('all')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                      sidebarTab === 'all' ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Users className="w-3.5 h-3.5" />
                    الكل
                  </button>
                  <button
                    onClick={() => setSidebarTab('partners')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                      sidebarTab === 'partners' ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    الجهات
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : sidebarTab === 'orgs' ? (
                  filteredOrgGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Building2 className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">لا توجد محادثات</p>
                    </div>
                  ) : (
                    filteredOrgGroups.map(group => (
                      <div key={group.orgId}>
                        <OrgGroupHeader
                          group={group}
                          isExpanded={expandedOrgs.has(group.orgId)}
                          onToggle={() => toggleOrgExpand(group.orgId)}
                        />
                        <AnimatePresence>
                          {expandedOrgs.has(group.orgId) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {group.conversations.map(convo => (
                                <ConversationItem
                                  key={convo.id}
                                  conversation={convo}
                                  isActive={selectedConvoId === convo.id}
                                  onClick={() => handleSelectConvo(convo)}
                                  currentUserId={user?.id}
                                  compact
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )
                ) : sidebarTab === 'partners' ? (
                  partnersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : linkedPartners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Building2 className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">لا توجد جهات مرتبطة</p>
                      <p className="text-xs mt-1">اربط جهات عبر كود الشراكة لبدء المحادثة</p>
                    </div>
                  ) : (
                    linkedPartners
                      .filter(lp => !searchQuery || lp.name.toLowerCase().includes(searchQuery.toLowerCase()) || lp.members.some(m => m.full_name.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map(partner => {
                        const orgTypeLabel = partner.organization_type === 'generator' ? 'مولّد'
                          : partner.organization_type === 'transporter' ? 'ناقل'
                          : partner.organization_type === 'recycler' ? 'مدوّر'
                          : partner.organization_type === 'disposal' ? 'تخلص'
                          : partner.organization_type;
                        const isExpanded = expandedPartnerOrgs.has(partner.id);
                        return (
                          <div key={partner.id}>
                            <button
                              onClick={() => togglePartnerOrgExpand(partner.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors text-start"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                              <Avatar className="w-7 h-7">
                                {partner.logo_url && <AvatarImage src={partner.logo_url} />}
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  <Building2 className="w-3.5 h-3.5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold truncate block">{partner.name}</span>
                                <span className="text-[10px] text-muted-foreground">{orgTypeLabel}</span>
                              </div>
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                {partner.members.length} عضو
                              </Badge>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {partner.members.length === 0 ? (
                                    <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                                      لا يوجد أعضاء مسجلين
                                    </div>
                                  ) : (
                                    partner.members.map(member => {
                                      const hasConvo = conversations.some(c => c.partner?.user_id === member.user_id);
                                      return (
                                        <button
                                          key={member.user_id}
                                          onClick={() => handleStartConvoWithMember(member)}
                                          className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-border/20",
                                            "hover:bg-muted/50 active:bg-muted/80"
                                          )}
                                        >
                                          <Avatar className="w-9 h-9">
                                            {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                              {member.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0 text-right">
                                            <p className="text-sm font-medium truncate">{member.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                              {hasConvo ? '💬 محادثة قائمة' : '➕ بدء محادثة جديدة'}
                                            </p>
                                          </div>
                                          {!hasConvo && (
                                            <MessageCircle className="w-4 h-4 text-primary/50 shrink-0" />
                                          )}
                                        </button>
                                      );
                                    })
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                  )
                ) : (
                  filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">لا توجد محادثات</p>
                    </div>
                  ) : (
                    filteredConversations.map(convo => (
                      <ConversationItem
                        key={convo.id}
                        conversation={convo}
                        isActive={selectedConvoId === convo.id}
                        onClick={() => handleSelectConvo(convo)}
                        currentUserId={user?.id}
                      />
                    ))
                  )
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== CHAT AREA ===== */}
        {showChat && (
          <div className="flex-1 flex min-w-0">
            <div className="flex-1 flex flex-col min-w-0">
              {selectedConvo ? (
                <>
                  {/* Chat Header */}
                  <div className="h-14 px-3 flex items-center justify-between border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(true)}>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <ClickableImage src={selectedConvo.partner?.avatar_url || ''} protected>
                        <Avatar className="w-9 h-9 cursor-pointer">
                          <AvatarImage src={selectedConvo.partner?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {selectedConvo.partner?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </ClickableImage>
                      <div className="text-right">
                        <button
                          className="text-sm font-semibold hover:underline cursor-pointer"
                          onClick={() => {
                            // Navigate to member profile
                            if (selectedConvo.partner?.user_id) {
                              navigate(`/dashboard/profile?userId=${selectedConvo.partner.user_id}`);
                            }
                          }}
                        >
                          {selectedConvo.partner?.full_name}
                        </button>
                        <div className="flex items-center gap-1 text-[10px]">
                          {isPartnerTyping ? (
                            <span className="text-emerald-500 font-medium animate-pulse">يكتب الآن...</span>
                          ) : partnerOnline.isOnline ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              متصل الآن
                            </span>
                          ) : (
                            <button
                              className="text-muted-foreground flex items-center gap-1 hover:underline cursor-pointer"
                              onClick={() => navigate('/dashboard/organization-profile')}
                            >
                              <Building2 className="w-2.5 h-2.5" />
                              {selectedConvo.partner?.organization_name || 'غير محدد'}
                            </button>
                          )}
                          <span className="mx-1 text-muted-foreground">·</span>
                          <Lock className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-emerald-600">E2E</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPartnerInfo(!showPartnerInfo)}
                        title="معلومات الشريك"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <ChatWallpaperPicker conversationId={selectedConvoId || undefined} />
                      <Button
                        variant={showNotes ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowNotes(!showNotes)}
                      >
                        <StickyNote className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={handleExport}>
                            <Download className="w-4 h-4 ml-2" /> تصدير المحادثة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMute(selectedConvoId!)}>
                            <VolumeX className="w-4 h-4 ml-2" /> كتم المحادثة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleBlock(selectedConvoId!)} className="text-destructive">
                            <Ban className="w-4 h-4 ml-2" /> حظر
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Messages with wallpaper */}
                  <div 
                    className="flex-1 overflow-y-auto p-3 transition-colors duration-300"
                    style={getWallpaperStyle()}
                  >
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-primary" size={28} />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Shield className="w-16 h-16 mb-3 text-emerald-500/20" />
                        <p className="text-sm font-medium">محادثة مشفرة</p>
                        <p className="text-xs mt-1">الرسائل محمية بتشفير طرف لطرف</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center mb-4">
                          <div className="bg-amber-50/90 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-center max-w-md backdrop-blur-sm">
                            <Lock className="w-4 h-4 text-amber-600 inline-block ml-1" />
                            <span className="text-[11px] text-amber-700 dark:text-amber-400">
                              الرسائل محمية بتشفير طرف لطرف. لا يمكن لأي طرف ثالث قراءتها.
                            </span>
                          </div>
                        </div>

                        {groupedMessages.map((group, gi) => (
                          <div key={gi}>
                            <DateSeparator date={group.date} />
                            {group.messages.map(msg => {
                              const isMine = msg.sender_id === user?.id;
                              return (
                                <SwipeableMessage key={msg.id} isMine={isMine} onSwipeReply={() => handleReply(msg)}>
                                  <MessageBubble
                                    message={msg}
                                    isMine={isMine}
                                    reactions={reactionsMap[msg.id] || []}
                                    onReact={(emoji) => toggleReaction(msg.id, emoji)}
                                    onReply={() => handleReply(msg)}
                                    onForward={() => handleForward(msg)}
                                    allMessages={messages}
                                  />
                                </SwipeableMessage>
                              );
                            })}
                          </div>
                        ))}
                        <TypingIndicator isTyping={isPartnerTyping} name={partnerTypingName || undefined} />
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Reply Preview */}
                  {replyTo && (
                    <ReplyPreviewBar replyToMessage={replyTo} onCancel={() => setReplyTo(null)} />
                  )}

                  {/* Input Area */}
                  <div className="p-2 border-t border-border bg-card shrink-0">
                    <EnhancedChatInput
                      onSendMessage={async (text) => {
                        // Optimistic: add message instantly before await
                        const optimistic = {
                          id: `temp_${Date.now()}`,
                          conversation_id: selectedConvoId!,
                          sender_id: user!.id,
                          content: text.trim(),
                          message_type: 'text' as const,
                          status: 'sending',
                          is_edited: false,
                          is_deleted: false,
                          created_at: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, optimistic]);
                        setReplyTo(null);
                        setSending(true);
                        try {
                          await sendMessage(selectedConvoId!, text, 'text', undefined, undefined, replyTo?.id);
                          // Mark as sent (realtime will bring the real message)
                          setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'sent' } : m));
                        } catch {
                          setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                          toast.error('فشل إرسال الرسالة');
                        } finally {
                          setSending(false);
                        }
                      }}
                      onSendFile={async (file) => {
                        const optimistic = {
                          id: `temp_file_${Date.now()}`,
                          conversation_id: selectedConvoId!,
                          sender_id: user!.id,
                          content: file.name,
                          message_type: file.type.startsWith('image/') ? 'image' : 'file',
                          file_name: file.name,
                          status: 'sending',
                          is_edited: false,
                          is_deleted: false,
                          created_at: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, optimistic]);
                        setSending(true);
                        try {
                          await sendFileMessage(selectedConvoId!, file);
                          setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, status: 'sent' } : m));
                        } catch {
                          setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                          toast.error('فشل إرسال الملف');
                        } finally {
                          setSending(false);
                        }
                      }}
                      sending={sending}
                      disabled={!selectedConvoId}
                      onTyping={sendTyping}
                    />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Shield}
                  title="اختر محادثة"
                  subtitle="اختر محادثة من القائمة أو ابدأ محادثة جديدة مع أي شريك مرتبط — المحادثات مقسمة حسب الجهة"
                />
              )}
            </div>

            {/* ===== PARTNER INFO PANEL ===== */}
            {showPartnerInfo && selectedConvo && !isMobile && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden border-s border-border"
              >
                <ChatPartnerInfo
                  partner={{
                    id: selectedConvo.partner?.organization_id || '',
                    name: selectedConvo.partner?.organization_name || selectedConvo.partner?.full_name || '',
                    organization_type: (selectedConvo.partner as any)?.organization_type || 'generator',
                    logo_url: selectedConvo.partner?.avatar_url || null,
                  }}
                  conversationId={selectedConvoId || undefined}
                  notificationsEnabled={true}
                  onToggleNotifications={() => selectedConvoId && toggleMute(selectedConvoId)}
                  onBack={() => setShowPartnerInfo(false)}
                  isMobile={isMobile}
                />
              </motion.div>
            )}

            {/* ===== NOTES PANEL ===== */}
            {showNotes && selectedConvoId && !isMobile && !showPartnerInfo && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden"
              >
                <NotesPanel
                  conversationId={selectedConvoId}
                  organizationId={organization?.id}
                  targetOrganizationId={selectedConvo?.partner?.organization_id || null}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  };

// ─── Lazy load NotesTab ─────────────────────────────────
const NotesTab = lazy(() => import('@/components/chat/NotesTab'));
const ChannelListViewPage = lazy(() => import('@/components/chat/ChannelListView'));
const PollsListView = lazy(() => import('@/components/chat/PollsListView'));

type ChatTabType = 'chat' | 'notes' | 'channels' | 'polls';

// ─── Main Page with Chat + Notes Tabs ───────────────────
const ChatAndNotesPage = () => {
  const [searchParamsPage] = useSearchParams();
  const paramTab = searchParamsPage.get('tab') as ChatTabType | null;
  const initialTab: ChatTabType = paramTab && ['chat', 'notes', 'channels', 'polls'].includes(paramTab) ? paramTab : 'chat';
  const [activeTab, setActiveTab] = useState<ChatTabType>(initialTab);
  const [notesUnread, setNotesUnread] = useState(0);

  // Listen for new notes to update badge
  useEffect(() => {
    const channel = supabase
      .channel('notes-badge-counter')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes',
      }, () => {
        if (activeTab !== 'notes') {
          setNotesUnread(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  // Clear badge when switching to notes
  useEffect(() => {
    if (activeTab === 'notes') setNotesUnread(0);
  }, [activeTab]);

  // Sync tab with URL param changes
  useEffect(() => {
    const t = searchParamsPage.get('tab') as ChatTabType | null;
    if (t && ['chat', 'notes', 'channels', 'polls'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParamsPage]);

  return (
    <DashboardLayout>
      <ChatAppearanceProvider>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
        {/* Top Tabs */}
        <div className="flex items-center border-b border-border bg-card px-4 shrink-0" dir="rtl">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'chat' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            الدردشات
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative",
              activeTab === 'notes' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <StickyNote className="w-4 h-4" />
            الملاحظات
            {notesUnread > 0 && (
              <Badge className="h-4 min-w-4 rounded-full text-[9px] px-1 bg-destructive text-destructive-foreground">
                {notesUnread}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'channels' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Hash className="w-4 h-4" />
            القنوات
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'polls' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            التصويت
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <EncryptedChatInner />}
          {activeTab === 'notes' && (
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
              <NotesTab className="h-full" />
            </Suspense>
          )}
          {activeTab === 'channels' && (
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
              <ChannelListViewPage />
            </Suspense>
          )}
          {activeTab === 'polls' && (
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={28} /></div>}>
              <PollsListView />
            </Suspense>
          )}
        </div>
      </div>
      </ChatAppearanceProvider>
    </DashboardLayout>
  );
};

export default ChatAndNotesPage;

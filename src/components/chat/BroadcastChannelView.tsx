import { useState, memo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Plus, Send, Users, ChevronRight, Search,
  Share2, Loader2, BadgeCheck,
  Bell, BellOff, MoreVertical, Image as ImageIcon, Video,
  FileText, Pin, Check, Crown, UserPlus, Shield,
  Flag, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useBroadcastChannels, type BroadcastChannel } from '@/hooks/useBroadcastChannels';
import { useBroadcastPosts } from '@/hooks/useBroadcastPosts';
import { useBroadcastNotificationSettings } from '@/hooks/useBroadcastAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// Extracted sub-components
import ShareToChatDialog from './broadcast/ShareToChatDialog';
import type { InternalSharePayload } from './broadcast/ShareToChatDialog';
import OwnerAdminPanel from './broadcast/OwnerAdminPanel';
import PostCard from './broadcast/PostCard';

interface BroadcastChannelViewProps {
  onBack?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Post Composer (Owner only)
// ═══════════════════════════════════════════════════════════════
const PostComposer = memo(({ channelId, onPost, isPosting, onUpload, onUploadMultiple }: {
  channelId: string;
  onPost: (data: { content: string; postType?: string; fileUrl?: string; fileName?: string; mediaUrls?: string[]; mediaTypes?: string[]; mediaNames?: string[] }) => void;
  isPosting: boolean;
  onUpload: (file: File) => Promise<{ url: string; name: string; type: string } | null>;
  onUploadMultiple: (files: File[]) => Promise<{ url: string; name: string; type: string }[]>;
}) => {
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ url: string; name: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && attachedFiles.length === 0) return;
    if (attachedFiles.length <= 1) {
      onPost({ content, postType: attachedFiles[0]?.type || 'text', fileUrl: attachedFiles[0]?.url, fileName: attachedFiles[0]?.name });
    } else {
      onPost({ content, mediaUrls: attachedFiles.map(f => f.url), mediaTypes: attachedFiles.map(f => f.type), mediaNames: attachedFiles.map(f => f.name) });
    }
    setContent(''); setAttachedFiles([]); setExpanded(false);
  };

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setUploadProgress(`جاري رفع ${files.length} ملف...`);
    const results = await onUploadMultiple(files);
    if (results.length > 0) setAttachedFiles(prev => [...prev, ...results]);
    setUploading(false); setUploadProgress(''); e.target.value = '';
  };

  const removeFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const images = attachedFiles.filter(f => f.type === 'image');
  const videos = attachedFiles.filter(f => f.type === 'video');
  const docs = attachedFiles.filter(f => f.type === 'document');

  return (
    <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm">
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-3 pt-2 max-h-60 overflow-y-auto custom-scrollbar">
            {images.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground mb-1">📷 {images.length} صورة</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {images.map((f, i) => (
                    <div key={`img-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border/30">
                      <img src={f.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(attachedFiles.indexOf(f))}
                        className="absolute top-0.5 left-0.5 bg-black/60 rounded-full p-0.5 text-white">
                        <Pin className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground mb-1">🎬 {videos.length} فيديو</p>
                <div className="flex gap-1.5 overflow-x-auto">
                  {videos.map((f, i) => (
                    <div key={`vid-${i}`} className="relative w-20 h-14 rounded-lg overflow-hidden border border-border/30 shrink-0 bg-muted/30 flex items-center justify-center">
                      <Video className="w-5 h-5 text-muted-foreground" />
                      <button onClick={() => removeFile(attachedFiles.indexOf(f))}
                        className="absolute top-0.5 left-0.5 bg-black/60 rounded-full p-0.5 text-white">
                        <Pin className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {docs.length > 0 && (
              <div className="mb-2 space-y-1">
                <p className="text-[10px] text-muted-foreground">📄 {docs.length} مستند</p>
                {docs.map((f, i) => (
                  <div key={`doc-${i}`} className="flex items-center gap-2 p-1.5 rounded-lg border border-border/30 bg-muted/10">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] truncate flex-1">{f.name}</span>
                    <button onClick={() => removeFile(attachedFiles.indexOf(f))} className="text-muted-foreground hover:text-destructive">
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <div className="px-3 py-1.5 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-[10px] text-muted-foreground">{uploadProgress}</span>
        </div>
      )}

      <div className="p-3" dir="rtl">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea value={content}
              onChange={e => { setContent(e.target.value); if (!expanded && e.target.value) setExpanded(true); }}
              placeholder="اكتب منشوراً للقناة..."
              className="text-sm resize-none min-h-[44px] max-h-[160px] rounded-2xl border-border/50 focus:border-primary/40 transition-colors"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }} />
          </div>
          <Button size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
            onClick={handleSubmit} disabled={(!content.trim() && attachedFiles.length === 0) || isPosting || uploading}>
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}<span>صور</span>
          </button>
          <button onClick={() => vidInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">
            <Video className="w-3.5 h-3.5" /><span>فيديو</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-600 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
            <FileText className="w-3.5 h-3.5" /><span>مستند</span>
          </button>
          {attachedFiles.length > 0 && <Badge variant="secondary" className="text-[9px] h-5 mr-auto">{attachedFiles.length} مرفق</Badge>}
        </div>
      </div>
      <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleFiles} />
      <input ref={vidInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleMultipleFiles} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" multiple className="hidden" onChange={handleMultipleFiles} />
    </div>
  );
});
PostComposer.displayName = 'PostComposer';

// ═══════════════════════════════════════════════════════════════
// Channel Profile View
// ═══════════════════════════════════════════════════════════════
const ChannelProfileView = memo(({ channel, onBack, onSubscribeToggle, isMine }: {
  channel: BroadcastChannel; onBack: () => void; onSubscribeToggle: () => void; isMine: boolean;
}) => {
  const { isMuted, toggleMute, report } = useBroadcastNotificationSettings(channel.id);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { posts } = useBroadcastPosts(channel.id);

  const filteredPosts = searchQuery.trim()
    ? posts.filter(p => p.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto" dir="rtl">
      <div className="flex items-center gap-2 p-3 border-b border-border/50 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ChevronRight className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold">معلومات القناة</span>
      </div>

      <div className="relative w-full aspect-[2.8/1] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {channel.cover_url ? <img src={channel.cover_url} alt="غلاف" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center"><Radio className="w-12 h-12 text-primary/20" /></div>
        )}
      </div>

      <div className="flex flex-col items-center -mt-10 relative z-10 px-4">
        <Avatar className="w-20 h-20 border-[3px] border-background shadow-lg ring-2 ring-primary/10">
          {channel.avatar_url && <AvatarImage src={channel.avatar_url} className="object-cover" />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{channel.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5 mt-2.5">
          <h2 className="text-base font-bold">{channel.name}</h2>
          {channel.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          قناة {((channel as any).channel_visibility === 'internal' ? '🏢 خاصة' : (channel as any).channel_visibility === 'partners_only' ? '🤝 شركاء' : '🌍 عامة')} • {channel.subscriber_count?.toLocaleString('ar-EG')} متابعًا
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        <button onClick={() => setShowSearch(!showSearch)}
          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors",
            showSearch ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-muted/50")}>
          <Search className={cn("w-5 h-5", showSearch ? "text-primary" : "text-muted-foreground")} />
          <span className="text-[11px] font-medium">بحث</span>
        </button>
        <button onClick={() => setShowShareDialog(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
          <Share2 className="w-5 h-5 text-muted-foreground" /><span className="text-[11px] font-medium">مشاركة</span>
        </button>
        <button onClick={() => toggleMute(!isMuted)}
          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors",
            isMuted ? "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10" : "border-border/50 hover:bg-muted/50")}>
          {isMuted ? <BellOff className="w-5 h-5 text-amber-600" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
          <span className="text-[11px] font-medium">{isMuted ? 'مكتومة' : 'كتم'}</span>
        </button>
        <button onClick={onSubscribeToggle}
          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors",
            channel.is_subscribed ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-muted/50")}>
          {channel.is_subscribed ? <Check className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-muted-foreground" />}
          <span className="text-[11px] font-medium">{channel.is_subscribed ? 'متابَعة ✓' : 'متابعة'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 mt-3 overflow-hidden">
            <Input placeholder="ابحث في منشورات القناة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="text-sm" autoFocus />
            {searchQuery.trim() && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {filteredPosts.length > 0 ? filteredPosts.map(p => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-muted/50 text-xs border border-border/30">
                    <p className="line-clamp-2">{p.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(p.created_at), 'yyyy/M/d', { locale: ar })}</p>
                  </div>
                )) : <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج</p>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {channel.description && (
        <div className="px-4 mt-4 py-3 border-t border-border/30">
          <p className="text-sm leading-relaxed">{channel.description}</p>
          <p className="text-[10px] text-muted-foreground mt-2">أنشئت في {format(new Date(channel.created_at), 'yyyy/M/d', { locale: ar })}</p>
        </div>
      )}

      {(channel as any).rules && (
        <div className="px-4 py-3 border-t border-border/30">
          <h4 className="text-xs font-semibold mb-1 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-muted-foreground" /> قواعد القناة</h4>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{(channel as any).rules}</p>
        </div>
      )}

      {!isMine && (
        <div className="px-4 mt-2 border-t border-border/30 py-3">
          <button onClick={() => setShowReport(true)} className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 w-full py-2">
            <Flag className="w-4 h-4" /> الإبلاغ عن هذه القناة
          </button>
        </div>
      )}

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-destructive" /> الإبلاغ عن القناة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {['محتوى مسيء', 'بريد عشوائي', 'معلومات مضللة', 'أخرى'].map(r => (
                <button key={r} onClick={() => setReportReason(r)}
                  className={cn("p-2 rounded-xl border text-xs text-center transition-colors",
                    reportReason === r ? "border-primary bg-primary/5 font-medium" : "border-border/50 hover:bg-muted/30")}>
                  {r}
                </button>
              ))}
            </div>
            <Button className="w-full" size="sm" disabled={!reportReason}
              onClick={() => { report({ reason: reportReason }); setShowReport(false); setReportReason(''); }}>إرسال البلاغ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareToChatDialog open={showShareDialog} onOpenChange={setShowShareDialog}
        payload={{ title: channel.name, preview: channel.description || 'قناة بث داخلية على المنصة',
          message: `📡 تمت مشاركة قناة بث\n\n${channel.name}\n${channel.description ? `\n${channel.description}\n` : '\n'}${window.location.origin}/dashboard/broadcast-channels?channel=${channel.id}`,
          link: `${window.location.origin}/dashboard/broadcast-channels?channel=${channel.id}` }} />
    </div>
  );
});
ChannelProfileView.displayName = 'ChannelProfileView';

// ═══════════════════════════════════════════════════════════════
// Channel Feed View
// ═══════════════════════════════════════════════════════════════
const ChannelFeedView = memo(({ channel, onBack, onShowProfile, onShowAdmin, isSystemAdmin }: {
  channel: BroadcastChannel; onBack: () => void; onShowProfile: () => void; onShowAdmin: () => void; isSystemAdmin?: boolean;
}) => {
  const { subscribe, unsubscribe } = useBroadcastChannels();
  const { report } = useBroadcastNotificationSettings(channel.id);
  const [sharePayload, setSharePayload] = useState<InternalSharePayload | null>(null);
  const { posts, isLoading: postsLoading, myReactions, createPost, toggleReaction, togglePin, deletePost, recordView, uploadFile, uploadMultipleFiles, isPosting } = useBroadcastPosts(channel.id);

  const allowComments = (channel as any).allow_comments !== false;
  const allowReactions = (channel as any).allow_reactions !== false;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center gap-2 p-2.5 border-b border-border/50 bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}><ChevronRight className="w-4 h-4" /></Button>
        <button onClick={onShowProfile} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="w-9 h-9">
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{channel.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              {channel.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />}
            </div>
            <p className="text-[10px] text-muted-foreground">{channel.subscriber_count?.toLocaleString('ar-EG')} متابع</p>
          </div>
        </button>
        <div className="flex items-center gap-0.5">
          {(channel.is_mine || isSystemAdmin) && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowAdmin}><Crown className="w-4 h-4 text-amber-500" /></Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onShowProfile}>معلومات القناة</DropdownMenuItem>
              {(channel.is_mine || isSystemAdmin) && <DropdownMenuItem onClick={onShowAdmin}><Crown className="w-3.5 h-3.5 ml-2 text-amber-500" /> لوحة الإدارة</DropdownMenuItem>}
              <DropdownMenuSeparator />
              {channel.is_subscribed ? (
                <DropdownMenuItem onClick={() => unsubscribe(channel.id)} className="text-destructive">إلغاء المتابعة</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => subscribe(channel.id)}>متابعة القناة</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex justify-center py-2">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{format(new Date(), 'dd MMMM yyyy', { locale: ar })}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
        {postsLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p>
            {channel.is_mine && <p className="text-xs text-muted-foreground mt-1">ابدأ بنشر أول منشور في قناتك</p>}
          </div>
        ) : (
          posts.map((p: any) => (
            <PostCard key={p.id} post={p} channelId={channel.id} channelName={channel.name}
              channelAvatar={channel.avatar_url} onReact={(postId, type) => toggleReaction({ postId, type })}
              myReactions={myReactions} isMine={!!channel.is_mine} allowComments={allowComments} allowReactions={allowReactions}
              onPin={togglePin} onDelete={deletePost} onReport={(postId) => report({ postId, reason: 'محتوى مسيء' })}
              onView={recordView} onShare={setSharePayload} />
          ))
        )}
      </div>

      {(channel.is_mine || isSystemAdmin) && (
        <PostComposer channelId={channel.id} onPost={createPost} isPosting={isPosting} onUpload={uploadFile} onUploadMultiple={uploadMultipleFiles} />
      )}

      <ShareToChatDialog open={!!sharePayload} onOpenChange={(open) => { if (!open) setSharePayload(null); }} payload={sharePayload} />
    </div>
  );
});
ChannelFeedView.displayName = 'ChannelFeedView';

// ═══════════════════════════════════════════════════════════════
// Channel List
// ═══════════════════════════════════════════════════════════════
const ChannelListView = memo(({ channels, isLoading, onSelect, onBack, onCreate }: {
  channels: BroadcastChannel[]; isLoading: boolean; onSelect: (ch: BroadcastChannel) => void; onBack?: () => void; onCreate: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = channels.filter(ch => !searchQuery || ch.name.includes(searchQuery) || ch.description?.includes(searchQuery));
  const myChannels = filtered.filter(ch => ch.is_mine);
  const subscribedChannels = filtered.filter(ch => !ch.is_mine && ch.is_subscribed);
  const discoverChannels = filtered.filter(ch => !ch.is_mine && !ch.is_subscribed);

  const renderChannel = (ch: BroadcastChannel, i: number) => (
    <motion.button key={ch.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }} onClick={() => onSelect(ch)}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30 hover:bg-muted/30 hover:border-primary/20 transition-all group">
      <div className="relative shrink-0">
        <Avatar className="w-9 h-9 ring-1 ring-primary/10">
          {ch.avatar_url && <AvatarImage src={ch.avatar_url} />}
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">{ch.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {ch.is_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-px">
            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-bold truncate">{ch.name}</p>
          {ch.is_mine ? (
            <Badge variant="outline" className="text-[8px] h-3.5 bg-amber-500/10 border-amber-500/20 text-amber-700 gap-0.5 shrink-0 px-1">
              <Crown className="w-2 h-2" /> مالك
            </Badge>
          ) : ch.is_subscribed ? (
            <Badge className="text-[8px] h-3.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0 px-1">متابَع</Badge>
          ) : null}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{ch.description || 'قناة بث رسمية'}</p>
        <span className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
          <Users className="w-2.5 h-2.5" /> {ch.subscriber_count?.toLocaleString('ar-EG')} متابع
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0 rotate-180" />
    </motion.button>
  );

  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    count > 0 ? (
      <div className="flex items-center gap-2 mt-3 mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <Badge variant="secondary" className="text-[9px] h-4">{count}</Badge>
      </div>
    ) : null
  );

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onBack && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ChevronRight className="w-4 h-4" /></Button>}
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">قنوات البث</h2>
            <Badge variant="secondary" className="text-[10px]">{channels.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}><Search className="w-4 h-4" /></Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={onCreate}><Plus className="w-3.5 h-3.5" /> إنشاء قناة</Button>
          </div>
        </div>
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث في القنوات..." className="text-sm h-9 mt-2" autoFocus />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{searchQuery ? 'لا توجد نتائج' : 'لا توجد قنوات بث بعد'}</p>
            {!searchQuery && <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={onCreate}><Plus className="w-3.5 h-3.5" /> إنشاء أول قناة</Button>}
          </div>
        ) : (
          <>
            <SectionHeader title="قنواتي" count={myChannels.length} />
            {myChannels.map((ch, i) => renderChannel(ch, i))}
            <SectionHeader title="اشتراكاتي" count={subscribedChannels.length} />
            {subscribedChannels.map((ch, i) => renderChannel(ch, i))}
            <SectionHeader title="اكتشف المزيد" count={discoverChannels.length} />
            {discoverChannels.map((ch, i) => renderChannel(ch, i))}
          </>
        )}
      </div>
    </div>
  );
});
ChannelListView.displayName = 'ChannelListView';

// ═══════════════════════════════════════════════════════════════
// Create Channel Dialog
// ═══════════════════════════════════════════════════════════════
const CreateBroadcastDialog = memo(({ open, onOpenChange, onCreate }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreate: (data: { name: string; description?: string; channel_visibility?: string }) => void;
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('public');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim() || undefined, channel_visibility: visibility });
    setName(''); setDesc(''); setVisibility('public'); onOpenChange(false);
  };

  const visibilityOptions = [
    { value: 'public', label: 'عامة', desc: 'يمكن للجميع اكتشافها', icon: '🌍' },
    { value: 'internal', label: 'جهات المنصة فقط', desc: 'مرئية داخل المنصة فقط', icon: '🏢' },
    { value: 'partners_only', label: 'الجهات المرتبطة فقط', desc: 'مرئية للشركاء فقط', icon: '🤝' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Radio className="w-5 h-5 text-primary" />إنشاء قناة بث جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-xs mb-1.5 block">اسم القناة</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أخبار شركة الناقل" className="text-sm" /></div>
          <div><Label className="text-xs mb-1.5 block">الوصف (اختياري)</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر للقناة..." className="text-sm min-h-[60px]" /></div>
          <div>
            <Label className="text-xs mb-1.5 block">رؤية القناة</Label>
            <div className="space-y-1.5">
              {visibilityOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setVisibility(opt.value)}
                  className={cn("w-full flex items-center gap-2.5 p-2 rounded-lg border text-right transition-all",
                    visibility === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 hover:bg-muted/50")}>
                  <span className="text-base">{opt.icon}</span>
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium">{opt.label}</p><p className="text-[9px] text-muted-foreground">{opt.desc}</p></div>
                  {visibility === opt.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>إنشاء القناة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
CreateBroadcastDialog.displayName = 'CreateBroadcastDialog';

// ═══════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════
const BroadcastChannelView = memo(({ onBack }: BroadcastChannelViewProps) => {
  const { channels, isLoading, createChannel, subscribe, unsubscribe } = useBroadcastChannels();
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'feed' | 'profile' | 'admin'>('feed');
  const [isMobileListView, setIsMobileListView] = useState(true);

  useEffect(() => {
    if (selectedChannel) {
      const fresh = channels.find(c => c.id === selectedChannel.id);
      if (fresh && (fresh.is_subscribed !== selectedChannel.is_subscribed || fresh.subscriber_count !== selectedChannel.subscriber_count)) {
        setSelectedChannel(fresh);
      }
    }
  }, [channels, selectedChannel]);

  useEffect(() => {
    if (!channels.length) return;
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    if (!channelId) return;
    const linkedChannel = channels.find((channel) => channel.id === channelId);
    if (linkedChannel && selectedChannel?.id !== linkedChannel.id) {
      setSelectedChannel(linkedChannel); setView('feed'); setIsMobileListView(false);
    }
  }, [channels, selectedChannel?.id]);

  const handleSelectChannel = useCallback((ch: BroadcastChannel) => { setSelectedChannel(ch); setView('feed'); setIsMobileListView(false); }, []);
  const handleSubscribeToggle = useCallback(() => {
    if (!selectedChannel) return;
    if (selectedChannel.is_subscribed) unsubscribe(selectedChannel.id); else subscribe(selectedChannel.id);
  }, [selectedChannel, subscribe, unsubscribe]);
  const handleBackToList = useCallback(() => { setSelectedChannel(null); setView('feed'); setIsMobileListView(true); }, []);

  const renderRightPanel = () => {
    if (!selectedChannel) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-4"><Radio className="w-10 h-10 text-primary/30" /></div>
          <h3 className="text-base font-bold text-foreground/70 mb-1">اختر قناة للعرض</h3>
          <p className="text-xs text-muted-foreground max-w-[220px]">اختر قناة من القائمة لعرض المنشورات والتفاعل معها</p>
        </div>
      );
    }
    if (view === 'admin' && (selectedChannel.is_mine || isAdmin)) return <OwnerAdminPanel channel={selectedChannel} onBack={() => setView('feed')} />;
    if (view === 'profile') return <ChannelProfileView channel={selectedChannel} onBack={() => setView('feed')} onSubscribeToggle={handleSubscribeToggle} isMine={!!selectedChannel.is_mine} />;
    return <ChannelFeedView channel={selectedChannel} onBack={handleBackToList} onShowProfile={() => setView('profile')} onShowAdmin={() => setView('admin')} isSystemAdmin={isAdmin} />;
  };

  return (
    <>
      <div className="hidden md:flex h-full w-full overflow-hidden border border-border/30 rounded-xl bg-card/50">
        <div className="w-[320px] lg:w-[360px] xl:w-[380px] shrink-0 border-l border-border/40 h-full overflow-hidden">
          <ChannelListView channels={channels} isLoading={isLoading} onSelect={handleSelectChannel} onBack={onBack} onCreate={() => setShowCreate(true)} />
        </div>
        <div className="flex-1 h-full overflow-hidden bg-background/50">{renderRightPanel()}</div>
      </div>
      <div className="md:hidden h-full w-full overflow-hidden">
        {isMobileListView ? (
          <ChannelListView channels={channels} isLoading={isLoading} onSelect={handleSelectChannel} onBack={onBack} onCreate={() => setShowCreate(true)} />
        ) : renderRightPanel()}
      </div>
      <CreateBroadcastDialog open={showCreate} onOpenChange={setShowCreate} onCreate={createChannel} />
    </>
  );
});

BroadcastChannelView.displayName = 'BroadcastChannelView';
export default BroadcastChannelView;

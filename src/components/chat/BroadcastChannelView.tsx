import { useState, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Plus, Bell, BellOff, Send, Users, ChevronRight, Search,
  Share2, Forward, Check, MoreVertical, Image as ImageIcon, Video,
  Link2, FileText, Heart, ThumbsUp, Smile, Eye, Globe, ShieldCheck,
  Camera, X, Loader2, MessageCircle, Clock, BadgeCheck
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const REACTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'thumbsup', emoji: '👍' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire', emoji: '🔥' },
  { type: 'clap', emoji: '👏' },
  { type: 'flag', emoji: '🇵🇸' },
];

interface BroadcastChannelViewProps {
  onBack?: () => void;
}

// ─── Channel Profile View ───────────────────────────────────
const ChannelProfileView = memo(({ channel, onBack, onSubscribeToggle }: {
  channel: BroadcastChannel;
  onBack: () => void;
  onSubscribeToggle: () => void;
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto" dir="rtl">
      {/* Header with back */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">معلومات القناة</span>
      </div>

      {/* Cover Photo */}
      <div className="relative w-full aspect-[3/1] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {channel.cover_url ? (
          <img src={channel.cover_url} alt="غلاف" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio className="w-12 h-12 text-primary/20" />
          </div>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center -mt-10 relative z-10 px-4">
        <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
          {channel.avatar_url ? (
            <AvatarImage src={channel.avatar_url} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {channel.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-1.5 mt-2">
          <h2 className="text-lg font-bold">{channel.name}</h2>
          {channel.is_verified && (
            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">
          قناة • {channel.subscriber_count?.toLocaleString('ar-EG')} متابعًا
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        {[
          { icon: Search, label: 'بحث' },
          { icon: Share2, label: 'مشاركة' },
          { icon: Forward, label: 'إعادة توجيه' },
          { icon: channel.is_subscribed ? Check : Bell, label: channel.is_subscribed ? 'تتابعها' : 'متابعة', action: onSubscribeToggle },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <btn.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-[11px] font-medium">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Description */}
      {channel.description && (
        <div className="px-4 mt-4 py-3 border-t border-border/30">
          <p className="text-sm leading-relaxed">{channel.description}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            أنشئت في {format(new Date(channel.created_at), 'yyyy/M/d', { locale: ar })}
          </p>
        </div>
      )}

      {/* Settings */}
      <div className="px-4 mt-2 space-y-0 border-t border-border/30">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">كتم الإشعارات</span>
          </div>
          <div className="w-10 h-5 rounded-full bg-muted relative cursor-pointer">
            <div className="w-4 h-4 rounded-full bg-background shadow absolute top-0.5 right-0.5" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">قناة عامة</p>
              <p className="text-[10px] text-muted-foreground">يمكن لأي شخص العثور على هذه القناة ورؤية ما تم مشاركته.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ChannelProfileView.displayName = 'ChannelProfileView';

// ─── Post Card ──────────────────────────────────────────────
const PostCard = memo(({ post, channelName, channelAvatar, onReact, myReactions }: {
  post: any;
  channelName: string;
  channelAvatar?: string;
  onReact: (postId: string, type: string) => void;
  myReactions: Set<string>;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactionsData: Record<string, number> = post.reactions_summary || {};
  const totalReactions = post.reactions_count || 0;
  const topReactions = Object.entries(reactionsData)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/30 overflow-hidden"
    >
      {/* Media */}
      {post.file_url && (
        <div className="relative bg-muted/30">
          {post.post_type === 'video' ? (
            <div className="aspect-video bg-muted/50 flex items-center justify-center">
              <video src={post.file_url} className="w-full h-full object-cover" controls />
            </div>
          ) : post.post_type === 'image' ? (
            <img src={post.file_url} alt="" className="w-full max-h-80 object-cover" />
          ) : (
            <div className="p-3 flex items-center gap-3 bg-muted/20">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{post.file_name || 'ملف مرفق'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {post.post_type === 'document' ? 'مستند' : 'ملف'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link Preview */}
      {post.link_url && (
        <a href={post.link_url} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-3 bg-muted/20 border-b border-border/20 hover:bg-muted/30 transition-colors"
        >
          {post.link_preview_image && (
            <img src={post.link_preview_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{post.link_title || channelName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">{new URL(post.link_url).hostname}</span>
            </div>
          </div>
        </a>
      )}

      {/* Content */}
      <div className="p-4" dir="rtl">
        {post.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(post.created_at), 'h:mm a', { locale: ar })}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Eye className="w-3 h-3" /> {(post.views_count || 0).toLocaleString('ar-EG')}
          </span>
        </div>
      </div>

      {/* Reactions Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Existing Reactions */}
          <div className="flex items-center gap-1">
            {topReactions.length > 0 && (
              <>
                <div className="flex -space-x-1 rtl:space-x-reverse">
                  {topReactions.map(([type]) => {
                    const r = REACTIONS.find(r => r.type === type);
                    return r ? <span key={type} className="text-base">{r.emoji}</span> : null;
                  })}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mr-1">
                  {totalReactions.toLocaleString('ar-EG')}
                </span>
              </>
            )}
          </div>

          {/* Forward button */}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            <Forward className="w-4 h-4" />
          </Button>
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1 mt-2 p-1.5 rounded-full bg-muted/50 w-fit"
            >
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => { onReact(post.id, r.type); setShowReactions(false); }}
                  className={cn(
                    'text-lg px-1.5 py-0.5 rounded-full hover:bg-background transition-all hover:scale-125',
                    myReactions.has(`${post.id}-${r.type}`) && 'bg-primary/10 ring-1 ring-primary/30'
                  )}
                >
                  {r.emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!showReactions && (
          <button
            onClick={() => setShowReactions(true)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            تفاعل...
          </button>
        )}
      </div>
    </motion.div>
  );
});
PostCard.displayName = 'PostCard';

// ─── Create Channel Dialog ─────────────────────────────────
const CreateBroadcastDialog = memo(({ open, onOpenChange, onCreate }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: { name: string; description?: string }) => void;
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim() || undefined });
    setName('');
    setDesc('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            إنشاء قناة بث جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">اسم القناة</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أخبار شركة الناقل" className="text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">الوصف (اختياري)</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر للقناة..." className="text-sm min-h-[60px]" />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            إنشاء القناة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
CreateBroadcastDialog.displayName = 'CreateBroadcastDialog';

// ─── Main Broadcast Channel View ────────────────────────────
const BroadcastChannelView = memo(({ onBack }: BroadcastChannelViewProps) => {
  const { user } = useAuth();
  const { channels, isLoading, createChannel, subscribe, unsubscribe, post } = useBroadcastChannels();
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Posts for selected channel
  const { data: posts = [] } = useQuery({
    queryKey: ['broadcast-posts', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const { data } = await (supabase as any)
        .from('broadcast_posts')
        .select('*')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!selectedChannel,
  });

  // My reactions
  const { data: myReactionsData = [] } = useQuery({
    queryKey: ['my-broadcast-reactions', selectedChannel?.id, user?.id],
    queryFn: async () => {
      if (!selectedChannel || !user) return [];
      const postIds = posts.map((p: any) => p.id);
      if (!postIds.length) return [];
      const { data } = await (supabase as any)
        .from('broadcast_post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      return data || [];
    },
    enabled: !!selectedChannel && !!user && posts.length > 0,
  });

  const myReactions = new Set(myReactionsData.map((r: any) => `${r.post_id}-${r.reaction_type}`));

  // React to post
  const reactMutation = useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: string }) => {
      if (!user) return;
      const key = `${postId}-${type}`;
      if (myReactions.has(key)) {
        await (supabase as any).from('broadcast_post_reactions')
          .delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction_type', type);
      } else {
        await (supabase as any).from('broadcast_post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: type });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts'] });
      qc.invalidateQueries({ queryKey: ['my-broadcast-reactions'] });
    },
  });

  const handlePost = (type?: string, fileUrl?: string, fileName?: string) => {
    if ((!postContent.trim() && !fileUrl) || !selectedChannel) return;
    post({ channelId: selectedChannel.id, content: postContent, postType: type || 'text', fileUrl, fileName });
    setPostContent('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;

    const ext = file.name.split('.').pop();
    const path = `broadcast/${selectedChannel.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from('public-assets').upload(path, file);
    if (error) { toast.error('فشل رفع الملف'); return; }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    handlePost(isImage ? 'image' : isVideo ? 'video' : 'document', urlData.publicUrl, file.name);
    e.target.value = '';
  };

  const handleSubscribeToggle = () => {
    if (!selectedChannel) return;
    if (selectedChannel.is_subscribed) unsubscribe(selectedChannel.id);
    else subscribe(selectedChannel.id);
  };

  const filteredChannels = channels.filter(ch =>
    !searchQuery || ch.name.includes(searchQuery) || ch.description?.includes(searchQuery)
  );

  // ─── Channel Detail (Posts Feed) ──────────────────────
  if (selectedChannel && showProfile) {
    return (
      <ChannelProfileView
        channel={selectedChannel as any}
        onBack={() => setShowProfile(false)}
        onSubscribeToggle={handleSubscribeToggle}
      />
    );
  }

  if (selectedChannel) {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        {/* Channel Header */}
        <div className="flex items-center gap-2 p-2.5 border-b border-border/50 bg-background sticky top-0 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedChannel(null)}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-9 h-9">
              {selectedChannel.avatar_url ? (
                <AvatarImage src={selectedChannel.avatar_url} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {selectedChannel.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold truncate">{selectedChannel.name}</p>
                {(selectedChannel as any).is_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {selectedChannel.subscriber_count?.toLocaleString('ar-EG')} متابع
              </p>
            </div>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowProfile(true)}>
                معلومات القناة
              </DropdownMenuItem>
              <DropdownMenuItem>بحث</DropdownMenuItem>
              <DropdownMenuItem>مشاركة</DropdownMenuItem>
              <DropdownMenuSeparator />
              {selectedChannel.is_subscribed ? (
                <DropdownMenuItem onClick={() => unsubscribe(selectedChannel.id)} className="text-destructive">
                  إلغاء المتابعة
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => subscribe(selectedChannel.id)}>
                  متابعة القناة
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Date Separator */}
        <div className="flex justify-center py-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {format(new Date(), 'dd MMMM yyyy', { locale: ar })}
          </span>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p>
            </div>
          ) : (
            posts.map((p: any) => (
              <PostCard
                key={p.id}
                post={p}
                channelName={selectedChannel.name}
                channelAvatar={selectedChannel.avatar_url || undefined}
                onReact={(postId, type) => reactMutation.mutate({ postId, type })}
                myReactions={myReactions}
              />
            ))
          )}
        </div>

        {/* Post Composer (owner only) */}
        {selectedChannel.is_mine && (
          <div className="p-3 border-t border-border/50 bg-background">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="اكتب منشوراً للقناة..."
                  className="text-sm resize-none min-h-[44px] max-h-[120px] rounded-2xl"
                  dir="rtl"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  size="icon" className="h-10 w-10 rounded-full"
                  onClick={() => handlePost()}
                  disabled={!postContent.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Channel List ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">قنوات البث</h2>
            <Badge variant="secondary" className="text-[10px]">{channels.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
              <Search className="w-4 h-4" />
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5" />
              إنشاء قناة
            </Button>
          </div>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث في القنوات..."
                className="text-sm h-9 mt-2"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Channels Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد قنوات بث بعد'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" />
                إنشاء أول قناة
              </Button>
            )}
          </div>
        ) : (
          filteredChannels.map((ch, i) => (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedChannel(ch)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/40 hover:bg-muted/30 transition-all group"
            >
              <Avatar className="w-12 h-12 shrink-0">
                {ch.avatar_url ? <AvatarImage src={ch.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {ch.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold truncate">{ch.name}</p>
                  {(ch as any).is_verified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {ch.description || 'قناة بث رسمية'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {ch.is_mine && (
                  <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 border-primary/20 text-primary">
                    قناتي
                  </Badge>
                )}
                {ch.is_subscribed && !ch.is_mine && (
                  <Badge className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    مشترك
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {ch.subscriber_count?.toLocaleString('ar-EG')}
                </span>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <CreateBroadcastDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createChannel}
      />
    </div>
  );
});

BroadcastChannelView.displayName = 'BroadcastChannelView';
export default BroadcastChannelView;

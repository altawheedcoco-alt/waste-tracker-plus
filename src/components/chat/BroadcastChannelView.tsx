import { useState, memo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Plus, Send, Users, ChevronRight, Search,
  Share2, Forward, Eye, Globe, ShieldCheck,
  Camera, X, Loader2, MessageCircle, BadgeCheck,
  Bell, BellOff, MoreVertical, Image as ImageIcon, Video,
  Link2, FileText, Heart, Pin, Trash2,
  Check, Settings, BarChart3, UserPlus, Shield,
  Copy, Flag, AlertTriangle, Crown, UserX, Edit3,
  TrendingUp, MessageSquare, Activity, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBroadcastChannels, type BroadcastChannel } from '@/hooks/useBroadcastChannels';
import { useBroadcastPosts } from '@/hooks/useBroadcastPosts';
import { useBroadcastComments } from '@/hooks/useBroadcastComments';
import { useBroadcastAdmin, useBroadcastNotificationSettings } from '@/hooks/useBroadcastAdmin';
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

// ═══════════════════════════════════════════════════════════════
// 🔵 OWNER SECTION: Analytics Dashboard
// ═══════════════════════════════════════════════════════════════
const OwnerAnalytics = memo(({ channelId }: { channelId: string }) => {
  const { analytics } = useBroadcastAdmin(channelId);
  if (!analytics) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const stats = [
    { icon: Eye, label: 'إجمالي المشاهدات', value: analytics.totalViews.toLocaleString('ar-EG'), color: 'text-blue-600' },
    { icon: Heart, label: 'التفاعلات', value: analytics.totalReactions.toLocaleString('ar-EG'), color: 'text-red-500' },
    { icon: MessageCircle, label: 'التعليقات', value: analytics.totalComments.toLocaleString('ar-EG'), color: 'text-emerald-600' },
    { icon: TrendingUp, label: 'متابعين جدد (30 يوم)', value: analytics.newSubscribers30d.toLocaleString('ar-EG'), color: 'text-primary' },
  ];

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        تحليلات القناة
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-border/40 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-4 h-4', s.color)} />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Engagement Rate */}
      <div className="p-3 rounded-xl border border-border/40 bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">معدل التفاعل</span>
          <span className="text-sm font-bold text-primary">{analytics.engagementRate}%</span>
        </div>
        <Progress value={Math.min(analytics.engagementRate, 100)} className="h-2" />
      </div>

      {/* Per post average */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card">
        <span className="text-xs text-muted-foreground">متوسط المشاهدات لكل منشور</span>
        <span className="text-sm font-bold">{analytics.avgViewsPerPost.toLocaleString('ar-EG')}</span>
      </div>

      {/* Top posts */}
      {analytics.topPosts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">أفضل المنشورات أداءً</h4>
          <div className="space-y-1.5">
            {analytics.topPosts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {format(new Date(p.created_at), 'dd MMM', { locale: ar })}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-3 h-3" /> {p.views_count || 0}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="w-3 h-3" /> {p.reactions_count || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
OwnerAnalytics.displayName = 'OwnerAnalytics';

// ═══════════════════════════════════════════════════════════════
// 🔵 OWNER SECTION: Channel Settings
// ═══════════════════════════════════════════════════════════════
const OwnerSettings = memo(({ channel }: { channel: BroadcastChannel }) => {
  const { updateSettings, uploadChannelImage, generateInviteLink, isUpdating } = useBroadcastAdmin(channel.id);
  const [editName, setEditName] = useState(channel.name);
  const [editDesc, setEditDesc] = useState(channel.description || '');
  const [editRules, setEditRules] = useState((channel as any).rules || '');
  const [inviteLink, setInviteLink] = useState((channel as any).invite_link || '');
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings({
      name: editName,
      description: editDesc,
      rules: editRules,
    });
  };

  const handleGenerateLink = async () => {
    const link = await generateInviteLink();
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ رابط الدعوة');
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        إعدادات القناة
      </h3>

      {/* Images */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 cursor-pointer ring-2 ring-border" onClick={() => avatarRef.current?.click()}>
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {channel.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => avatarRef.current?.click()}>
              <Camera className="w-3 h-3" /> تغيير صورة القناة
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1">يفضل 1:1 مربعة</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => coverRef.current?.click()}>
          <ImageIcon className="w-3 h-3" /> تغيير صورة الغلاف (3:1)
        </Button>

        <input ref={avatarRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && uploadChannelImage(e.target.files[0], 'avatar')} />
        <input ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && uploadChannelImage(e.target.files[0], 'cover')} />
      </div>

      {/* Name & Description */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs mb-1 block">اسم القناة</Label>
          <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">وصف القناة</Label>
          <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="text-sm min-h-[60px]" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">قواعد القناة (اختياري)</Label>
          <Textarea value={editRules} onChange={e => setEditRules(e.target.value)} className="text-sm min-h-[60px]" placeholder="اكتب قواعد المشاركة في القناة..." />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 border-t border-border/30 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">السماح بالتعليقات</p>
            <p className="text-[10px] text-muted-foreground">يمكن للمتابعين التعليق على المنشورات</p>
          </div>
          <Switch
            checked={(channel as any).allow_comments !== false}
            onCheckedChange={v => updateSettings({ allow_comments: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">السماح بالتفاعلات</p>
            <p className="text-[10px] text-muted-foreground">يمكن للمتابعين التفاعل بالإيموجي</p>
          </div>
          <Switch
            checked={(channel as any).allow_reactions !== false}
            onCheckedChange={v => updateSettings({ allow_reactions: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">رؤية القناة</p>
            <p className="text-[10px] text-muted-foreground">
              {(channel as any).channel_visibility === 'private' ? 'خاصة — بالدعوة فقط' : 'عامة — يمكن للجميع اكتشافها'}
            </p>
          </div>
          <Switch
            checked={(channel as any).channel_visibility !== 'private'}
            onCheckedChange={v => updateSettings({ channel_visibility: v ? 'public' : 'private' })}
          />
        </div>
      </div>

      {/* Invite Link */}
      <div className="border-t border-border/30 pt-3">
        <Label className="text-xs mb-1.5 block">رابط الدعوة</Label>
        {inviteLink ? (
          <div className="flex items-center gap-2">
            <Input value={inviteLink} readOnly className="text-xs flex-1" dir="ltr" />
            <Button size="icon" variant="outline" className="shrink-0 h-9 w-9"
              onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('تم النسخ'); }}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={handleGenerateLink}>
            <Link2 className="w-3 h-3" /> إنشاء رابط دعوة
          </Button>
        )}
      </div>

      <Button className="w-full" onClick={handleSave} disabled={isUpdating}>
        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
        حفظ التغييرات
      </Button>
    </div>
  );
});
OwnerSettings.displayName = 'OwnerSettings';

// ═══════════════════════════════════════════════════════════════
// 🔵 OWNER SECTION: Members Management
// ═══════════════════════════════════════════════════════════════
const OwnerMembers = memo(({ channelId }: { channelId: string }) => {
  const { admins, subscribers, subsLoading, addAdmin, removeAdmin, blockUser } = useBroadcastAdmin(channelId);
  const [searchQ, setSearchQ] = useState('');

  const filteredSubs = subscribers.filter((s: any) =>
    !searchQ || (s.user_name || '').includes(searchQ)
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'مالك';
      case 'admin': return 'مشرف';
      case 'moderator': return 'مراقب';
      default: return role;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'admin': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'moderator': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      default: return '';
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        إدارة الأعضاء
      </h3>

      {/* Admins */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Crown className="w-3 h-3" /> المشرفون ({admins.length})
        </h4>
        <div className="space-y-1.5">
          {admins.map(admin => (
            <div key={admin.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/30">
              <Avatar className="w-8 h-8">
                {admin.user_avatar && <AvatarImage src={admin.user_avatar} />}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {(admin.user_name || '?').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{admin.user_name}</p>
              </div>
              <Badge variant="outline" className={cn('text-[9px] h-4', roleColor(admin.role))}>
                {roleLabel(admin.role)}
              </Badge>
              {admin.role !== 'owner' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAdmin(admin.id)}>
                  <X className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers */}
      <div className="border-t border-border/30 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground">
            المتابعون ({subscribers.length})
          </h4>
        </div>
        <Input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="بحث في المتابعين..."
          className="text-xs h-8 mb-2"
        />

        {subsLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {filteredSubs.map((sub: any) => (
              <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <Avatar className="w-7 h-7">
                  {sub.user_avatar && <AvatarImage src={sub.user_avatar} />}
                  <AvatarFallback className="text-[9px] bg-muted">{(sub.user_name || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs flex-1 truncate">{sub.user_name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => addAdmin({ userId: sub.user_id, role: 'admin' })}>
                      <UserPlus className="w-3.5 h-3.5 ml-2" /> ترقية لمشرف
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addAdmin({ userId: sub.user_id, role: 'moderator' })}>
                      <Shield className="w-3.5 h-3.5 ml-2" /> ترقية لمراقب
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => blockUser({ userId: sub.user_id })} className="text-destructive">
                      <UserX className="w-3.5 h-3.5 ml-2" /> حظر المتابع
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
OwnerMembers.displayName = 'OwnerMembers';

// ═══════════════════════════════════════════════════════════════
// 🔵 OWNER: Full Admin Panel
// ═══════════════════════════════════════════════════════════════
const OwnerAdminPanel = memo(({ channel, onBack }: { channel: BroadcastChannel; onBack: () => void }) => {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center gap-2 p-3 border-b border-border/50 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Crown className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold">لوحة إدارة القناة</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Tabs defaultValue="analytics" dir="rtl">
          <TabsList className="w-full justify-start px-3 pt-2 bg-transparent">
            <TabsTrigger value="analytics" className="text-xs gap-1">
              <BarChart3 className="w-3.5 h-3.5" /> التحليلات
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1">
              <Settings className="w-3.5 h-3.5" /> الإعدادات
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" /> الأعضاء
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <OwnerAnalytics channelId={channel.id} />
          </TabsContent>
          <TabsContent value="settings">
            <OwnerSettings channel={channel} />
          </TabsContent>
          <TabsContent value="members">
            <OwnerMembers channelId={channel.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
OwnerAdminPanel.displayName = 'OwnerAdminPanel';

// ═══════════════════════════════════════════════════════════════
// Comment Section
// ═══════════════════════════════════════════════════════════════
const CommentSection = memo(({ postId, isOpen }: { postId: string; isOpen: boolean }) => {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment, toggleLike, isAdding } = useBroadcastComments(postId);
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment({ content: text.trim() });
    setText('');
  };

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-t border-border/30 bg-muted/20"
    >
      <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : topLevel.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
        ) : (
          topLevel.map(comment => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6 mt-0.5">
                  {comment.user_avatar && <AvatarImage src={comment.user_avatar} />}
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {(comment.user_name || '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-background rounded-xl px-3 py-1.5">
                    <p className="text-[11px] font-semibold">{comment.user_name}</p>
                    <p className="text-xs leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 px-1">
                    <button onClick={() => toggleLike(comment.id)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                      إعجاب {comment.likes_count > 0 && `(${comment.likes_count})`}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(comment.created_at), 'h:mm a', { locale: ar })}
                    </span>
                    {comment.user_id === user?.id && (
                      <button onClick={() => deleteComment(comment.id)} className="text-[10px] text-destructive">حذف</button>
                    )}
                  </div>
                </div>
              </div>
              {replies(comment.id).map(reply => (
                <div key={reply.id} className="flex items-start gap-2 mr-8">
                  <Avatar className="w-5 h-5 mt-0.5">
                    {reply.user_avatar && <AvatarImage src={reply.user_avatar} />}
                    <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
                      {(reply.user_name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-background rounded-xl px-2.5 py-1">
                      <p className="text-[10px] font-semibold">{reply.user_name}</p>
                      <p className="text-[11px]">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border/20">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="أضف تعليقاً..."
          className="text-xs h-8 flex-1 rounded-full" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <Button size="icon" className="h-8 w-8 rounded-full shrink-0"
          disabled={!text.trim() || isAdding} onClick={handleSubmit}>
          {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
});
CommentSection.displayName = 'CommentSection';

// ═══════════════════════════════════════════════════════════════
// Post Card (Shared — adapts per role) — Enhanced Design
// ═══════════════════════════════════════════════════════════════
const PostCard = memo(({ post, channelName, channelAvatar, onReact, myReactions, isMine, allowComments, allowReactions, onPin, onDelete, onReport }: {
  post: any;
  channelName: string;
  channelAvatar?: string | null;
  onReact: (postId: string, type: string) => void;
  myReactions: Set<string>;
  isMine: boolean;
  allowComments: boolean;
  allowReactions: boolean;
  onPin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(false);
  const reactionsData: Record<string, number> = post.reactions_summary || {};
  const totalReactions = post.reactions_count || 0;
  const topReactions = Object.entries(reactionsData)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4);

  const renderContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noreferrer"
          className="text-primary hover:underline break-all" dir="ltr">{part}</a>
      ) : part
    );
  };

  const isImagePost = post.post_type === 'image' && post.file_url;
  const isVideoPost = post.post_type === 'video' && post.file_url;
  const isDocPost = post.file_url && !isImagePost && !isVideoPost;
  const fileExt = post.file_name?.split('.').pop()?.toLowerCase() || '';
  const isPdf = fileExt === 'pdf';
  const isDocFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow",
          post.is_pinned ? "border-primary/40 ring-2 ring-primary/10" : "border-border/30"
        )}
      >
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-l from-primary/5 to-primary/10 border-b border-primary/10">
            <Pin className="w-3 h-3 text-primary fill-primary/20" />
            <span className="text-[10px] font-semibold text-primary">منشور مثبت</span>
          </div>
        )}

        {/* Channel Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
          <Avatar className="w-9 h-9 ring-2 ring-primary/10">
            {channelAvatar && <AvatarImage src={channelAvatar} />}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-bold">
              {channelName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate">{channelName}</p>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(post.created_at), 'dd MMM yyyy • h:mm a', { locale: ar })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {isMine ? (
                <>
                  <DropdownMenuItem onClick={() => onPin?.(post.id)}>
                    <Pin className="w-3.5 h-3.5 ml-2" />
                    {post.is_pinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(post.content || ''); toast.success('تم النسخ'); }}>
                    <Copy className="w-3.5 h-3.5 ml-2" /> نسخ النص
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 ml-2" /> حذف المنشور
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(post.content || ''); toast.success('تم النسخ'); }}>
                    <Copy className="w-3.5 h-3.5 ml-2" /> نسخ النص
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onReport?.(post.id)} className="text-destructive">
                    <Flag className="w-3.5 h-3.5 ml-2" /> إبلاغ عن المحتوى
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Text */}
        {post.content && (
          <div className="px-4 py-2" dir="rtl">
            <p className="text-sm leading-[1.8] whitespace-pre-wrap text-foreground/90">
              {renderContent(post.content)}
            </p>
          </div>
        )}

        {/* Image */}
        {isImagePost && (
          <div className="relative group cursor-pointer mt-1" onClick={() => setFullscreenMedia(true)}>
            {!imageLoaded && (
              <div className="aspect-video bg-muted/30 animate-pulse flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <img src={post.file_url} alt={post.file_name || 'صورة'}
              className={cn("w-full max-h-[400px] object-cover transition-transform", !imageLoaded && "hidden")}
              onLoad={() => setImageLoaded(true)} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2"><Eye className="w-5 h-5 text-white" /></div>
            </div>
          </div>
        )}

        {/* Video */}
        {isVideoPost && (
          <div className="relative mt-1 bg-black">
            <video src={post.file_url} className="w-full max-h-[400px] object-contain" controls preload="metadata" />
          </div>
        )}

        {/* Document */}
        {isDocPost && (
          <div className="mx-4 my-2 rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
            <a href={post.file_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-3 bg-gradient-to-l from-muted/30 to-transparent hover:from-muted/50 transition-colors">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                isPdf ? "bg-red-500/10" : isDocFile ? "bg-blue-500/10" : "bg-primary/10")}>
                <FileText className={cn("w-6 h-6", isPdf ? "text-red-500" : isDocFile ? "text-blue-500" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.file_name || 'ملف مرفق'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase" dir="ltr">{fileExt.toUpperCase()} • اضغط للتحميل</p>
              </div>
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Forward className="w-4 h-4 text-primary rotate-90" />
              </div>
            </a>
          </div>
        )}

        {/* Link Preview */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noreferrer"
            className="block mx-4 my-2 rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all group">
            {post.link_preview_image && (
              <div className="aspect-video bg-muted/20 overflow-hidden">
                <img src={post.link_preview_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-3 bg-gradient-to-l from-muted/30 to-transparent">
              <p className="text-sm font-semibold truncate">{post.link_title || 'رابط خارجي'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Link2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground truncate" dir="ltr">
                  {(() => { try { return new URL(post.link_url).hostname; } catch { return post.link_url; } })()}
                </span>
              </div>
            </div>
          </a>
        )}

        {/* Stats & Action Bar */}
        <div className="px-4 pb-2 mt-1">
          {(totalReactions > 0 || (post.comments_count || 0) > 0 || (post.views_count || 0) > 0) && (
            <div className="flex items-center justify-between py-1.5 border-b border-border/20 mb-1">
              <div className="flex items-center gap-1.5">
                {topReactions.length > 0 && (
                  <>
                    <div className="flex -space-x-0.5 rtl:space-x-reverse">
                      {topReactions.map(([type]) => { const r = REACTIONS.find(r => r.type === type); return r ? <span key={type} className="text-sm">{r.emoji}</span> : null; })}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{totalReactions.toLocaleString('ar-EG')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {(post.comments_count || 0) > 0 && <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>}
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {(post.views_count || 0).toLocaleString('ar-EG')}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-around">
            {allowReactions && (
              <button onClick={() => setShowReactions(!showReactions)}
                className={cn("flex items-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg transition-all",
                  showReactions ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <Heart className={cn("w-[18px] h-[18px]", showReactions && "fill-primary/20")} /><span>تفاعل</span>
              </button>
            )}
            {allowComments && (
              <button onClick={() => setShowComments(!showComments)}
                className={cn("flex items-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg transition-all",
                  showComments ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <MessageCircle className={cn("w-[18px] h-[18px]", showComments && "fill-primary/20")} /><span>تعليق</span>
              </button>
            )}
            <button onClick={() => { navigator.clipboard.writeText(post.content || post.file_url || ''); toast.success('تم نسخ المحتوى'); }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/50 transition-all">
              <Share2 className="w-[18px] h-[18px]" /><span>مشاركة</span>
            </button>
          </div>

          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 6 }}
                className="flex items-center gap-0.5 mt-1.5 p-2 rounded-2xl bg-card border border-border/50 shadow-lg w-fit mx-auto">
                {REACTIONS.map(r => (
                  <motion.button key={r.type} whileHover={{ scale: 1.35, y: -4 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { onReact(post.id, r.type); setShowReactions(false); }}
                    className={cn('text-xl px-2 py-1 rounded-full transition-colors',
                      myReactions.has(`${post.id}-${r.type}`) && 'bg-primary/10 ring-2 ring-primary/30')}>
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showComments && <CommentSection postId={post.id} isOpen={showComments} />}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Image Viewer */}
      <Dialog open={fullscreenMedia} onOpenChange={setFullscreenMedia}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95 overflow-hidden">
          <button onClick={() => setFullscreenMedia(false)}
            className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/80">
            <X className="w-5 h-5" />
          </button>
          {isImagePost && <img src={post.file_url} alt="" className="w-full h-full object-contain max-h-[90vh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
});
PostCard.displayName = 'PostCard';

// ═══════════════════════════════════════════════════════════════
// Post Composer (Owner only) — Enhanced
// ═══════════════════════════════════════════════════════════════
const PostComposer = memo(({ channelId, onPost, isPosting, onUpload }: {
  channelId: string;
  onPost: (data: { content: string; postType?: string; fileUrl?: string; fileName?: string }) => void;
  isPosting: boolean;
  onUpload: (file: File) => Promise<{ url: string; name: string; type: string } | null>;
}) => {
  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && !attachedFile) return;
    onPost({ content, postType: attachedFile?.type || 'text', fileUrl: attachedFile?.url, fileName: attachedFile?.name });
    setContent('');
    setAttachedFile(null);
    setExpanded(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await onUpload(file);
    if (result) setAttachedFile(result);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm">
      <AnimatePresence>
        {attachedFile && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3">
            <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20">
              {attachedFile.type === 'image' ? (
                <div className="relative">
                  <img src={attachedFile.url} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                  <button onClick={() => setAttachedFile(null)}
                    className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : attachedFile.type === 'video' ? (
                <div className="relative">
                  <video src={attachedFile.url} className="w-full max-h-48 object-cover rounded-xl" />
                  <button onClick={() => setAttachedFile(null)}
                    className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">جاهز للرفع</p>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={handleSubmit} disabled={(!content.trim() && !attachedFile) || isPosting}>
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <button onClick={() => imgInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}<span>صورة</span>
          </button>
          <button onClick={() => vidInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors">
            <Video className="w-3.5 h-3.5" /><span>فيديو</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-amber-600 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
            <FileText className="w-3.5 h-3.5" /><span>مستند</span>
          </button>
        </div>
      </div>
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={vidInputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" className="hidden" onChange={handleFile} />
    </div>
  );
});
PostComposer.displayName = 'PostComposer';

// ═══════════════════════════════════════════════════════════════
// 🟢 SUBSCRIBER: Channel Profile View
// ═══════════════════════════════════════════════════════════════
const ChannelProfileView = memo(({ channel, onBack, onSubscribeToggle, isMine }: {
  channel: BroadcastChannel;
  onBack: () => void;
  onSubscribeToggle: () => void;
  isMine: boolean;
}) => {
  const { isMuted, toggleMute, report } = useBroadcastNotificationSettings(channel.id);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  return (
    <div className="flex flex-col h-full overflow-y-auto" dir="rtl">
      <div className="flex items-center gap-2 p-3 border-b border-border/50 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">معلومات القناة</span>
      </div>

      {/* Cover */}
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
          {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {channel.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5 mt-2">
          <h2 className="text-lg font-bold">{channel.name}</h2>
          {channel.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          قناة • {channel.subscriber_count?.toLocaleString('ar-EG')} متابعًا
        </p>
      </div>

      {/* Action buttons — differ by role */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        <button onClick={() => {}} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-medium">بحث</span>
        </button>
        <button onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/dashboard/broadcast-channels`);
          toast.success('تم نسخ رابط القناة');
        }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
          <Share2 className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-medium">مشاركة</span>
        </button>
        <button onClick={() => toggleMute(!isMuted)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
          {isMuted ? <BellOff className="w-5 h-5 text-muted-foreground" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
          <span className="text-[11px] font-medium">{isMuted ? 'مكتومة' : 'كتم'}</span>
        </button>
        <button onClick={onSubscribeToggle}
          className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors",
            channel.is_subscribed ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-muted/50")}>
          {channel.is_subscribed ? <Check className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-muted-foreground" />}
          <span className="text-[11px] font-medium">{channel.is_subscribed ? 'متابَعة' : 'متابعة'}</span>
        </button>
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

      {/* Rules */}
      {(channel as any).rules && (
        <div className="px-4 py-3 border-t border-border/30">
          <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" /> قواعد القناة
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{(channel as any).rules}</p>
        </div>
      )}

      {/* Subscriber-only actions */}
      {!isMine && (
        <div className="px-4 mt-2 border-t border-border/30 py-3">
          <button onClick={() => setShowReport(true)}
            className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 w-full py-2">
            <Flag className="w-4 h-4" /> الإبلاغ عن هذه القناة
          </button>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive" /> الإبلاغ عن القناة
            </DialogTitle>
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
              onClick={() => { report({ reason: reportReason }); setShowReport(false); setReportReason(''); }}>
              إرسال البلاغ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
ChannelProfileView.displayName = 'ChannelProfileView';

// ═══════════════════════════════════════════════════════════════
// Channel Feed View
// ═══════════════════════════════════════════════════════════════
const ChannelFeedView = memo(({ channel, onBack, onShowProfile, onShowAdmin }: {
  channel: BroadcastChannel;
  onBack: () => void;
  onShowProfile: () => void;
  onShowAdmin: () => void;
}) => {
  const { subscribe, unsubscribe } = useBroadcastChannels();
  const { report } = useBroadcastNotificationSettings(channel.id);
  const {
    posts, isLoading: postsLoading, myReactions,
    createPost, toggleReaction, togglePin, deletePost, recordView, uploadFile, isPosting,
  } = useBroadcastPosts(channel.id);

  const allowComments = (channel as any).allow_comments !== false;
  const allowReactions = (channel as any).allow_reactions !== false;

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 border-b border-border/50 bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>

        <button onClick={onShowProfile} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="w-9 h-9">
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {channel.name.charAt(0)}
            </AvatarFallback>
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
          {/* Owner-only: Admin panel */}
          {channel.is_mine && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowAdmin}>
              <Crown className="w-4 h-4 text-amber-500" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onShowProfile}>معلومات القناة</DropdownMenuItem>
              {channel.is_mine && (
                <DropdownMenuItem onClick={onShowAdmin}>
                  <Crown className="w-3.5 h-3.5 ml-2 text-amber-500" /> لوحة الإدارة
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {channel.is_subscribed ? (
                <DropdownMenuItem onClick={() => unsubscribe(channel.id)} className="text-destructive">
                  إلغاء المتابعة
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => subscribe(channel.id)}>
                  متابعة القناة
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date */}
      <div className="flex justify-center py-2">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {format(new Date(), 'dd MMMM yyyy', { locale: ar })}
        </span>
      </div>

      {/* Posts */}
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
            <PostCard
              key={p.id} post={p} channelName={channel.name}
              channelAvatar={channel.avatar_url}
              onReact={(postId, type) => toggleReaction({ postId, type })}
              myReactions={myReactions}
              isMine={!!channel.is_mine}
              allowComments={allowComments}
              allowReactions={allowReactions}
              onPin={togglePin} onDelete={deletePost}
              onReport={(postId) => report({ postId, reason: 'محتوى مسيء' })}
            />
          ))
        )}
      </div>

      {/* Composer: Owner only */}
      {channel.is_mine && (
        <PostComposer channelId={channel.id} onPost={createPost} isPosting={isPosting} onUpload={uploadFile} />
      )}
    </div>
  );
});
ChannelFeedView.displayName = 'ChannelFeedView';

// ═══════════════════════════════════════════════════════════════
// Channel List
// ═══════════════════════════════════════════════════════════════
const ChannelListView = memo(({ channels, isLoading, onSelect, onBack, onCreate }: {
  channels: BroadcastChannel[];
  isLoading: boolean;
  onSelect: (ch: BroadcastChannel) => void;
  onBack?: () => void;
  onCreate: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = channels.filter(ch =>
    !searchQuery || ch.name.includes(searchQuery) || ch.description?.includes(searchQuery)
  );

  const myChannels = filtered.filter(ch => ch.is_mine);
  const subscribedChannels = filtered.filter(ch => !ch.is_mine && ch.is_subscribed);
  const discoverChannels = filtered.filter(ch => !ch.is_mine && !ch.is_subscribed);

  const renderChannel = (ch: BroadcastChannel, i: number) => (
    <motion.button key={ch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }} onClick={() => onSelect(ch)}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border/30 hover:bg-muted/30 hover:border-primary/20 transition-all group">
      <div className="relative shrink-0">
        <Avatar className="w-13 h-13 ring-2 ring-primary/10">
          {ch.avatar_url && <AvatarImage src={ch.avatar_url} />}
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">{ch.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {ch.is_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
            <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[13px] font-bold truncate">{ch.name}</p>
          {ch.is_mine ? (
            <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 border-amber-500/20 text-amber-700 gap-0.5 shrink-0">
              <Crown className="w-2.5 h-2.5" /> مالك
            </Badge>
          ) : ch.is_subscribed ? (
            <Badge className="text-[8px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">متابَع</Badge>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{ch.description || 'قناة بث رسمية'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="w-3 h-3" /> {ch.subscriber_count?.toLocaleString('ar-EG')} متابع
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 rotate-180" />
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
            <Button size="sm" className="h-8 text-xs gap-1" onClick={onCreate}>
              <Plus className="w-3.5 h-3.5" /> إنشاء قناة
            </Button>
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
            {!searchQuery && (
              <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={onCreate}>
                <Plus className="w-3.5 h-3.5" /> إنشاء أول قناة
              </Button>
            )}
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

// ═══════════════════════════════════════════════════════════════
// 🎯 MAIN ORCHESTRATOR — Split Panel Layout
// ═══════════════════════════════════════════════════════════════
const BroadcastChannelView = memo(({ onBack }: BroadcastChannelViewProps) => {
  const { channels, isLoading, createChannel, subscribe, unsubscribe } = useBroadcastChannels();
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'feed' | 'profile' | 'admin'>('feed');
  const [isMobileListView, setIsMobileListView] = useState(true);

  const handleSelectChannel = useCallback((ch: BroadcastChannel) => {
    setSelectedChannel(ch);
    setView('feed');
    setIsMobileListView(false);
  }, []);

  const handleSubscribeToggle = useCallback(() => {
    if (!selectedChannel) return;
    if (selectedChannel.is_subscribed) unsubscribe(selectedChannel.id);
    else subscribe(selectedChannel.id);
  }, [selectedChannel, subscribe, unsubscribe]);

  const handleBackToList = useCallback(() => {
    setSelectedChannel(null);
    setView('feed');
    setIsMobileListView(true);
  }, []);

  // Right panel content
  const renderRightPanel = () => {
    if (!selectedChannel) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-4">
            <Radio className="w-10 h-10 text-primary/30" />
          </div>
          <h3 className="text-base font-bold text-foreground/70 mb-1">اختر قناة للعرض</h3>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            اختر قناة من القائمة لعرض المنشورات والتفاعل معها
          </p>
        </div>
      );
    }

    if (view === 'admin' && selectedChannel.is_mine) {
      return <OwnerAdminPanel channel={selectedChannel} onBack={() => setView('feed')} />;
    }

    if (view === 'profile') {
      return (
        <ChannelProfileView
          channel={selectedChannel}
          onBack={() => setView('feed')}
          onSubscribeToggle={handleSubscribeToggle}
          isMine={!!selectedChannel.is_mine}
        />
      );
    }

    return (
      <ChannelFeedView
        channel={selectedChannel}
        onBack={handleBackToList}
        onShowProfile={() => setView('profile')}
        onShowAdmin={() => setView('admin')}
      />
    );
  };

  return (
    <>
      {/* Desktop: Split Panel (30% list / 70% content) */}
      <div className="hidden md:flex h-full w-full overflow-hidden border border-border/30 rounded-xl bg-card/50">
        {/* Channel List — 30% */}
        <div className="w-[320px] lg:w-[360px] xl:w-[380px] shrink-0 border-l border-border/40 h-full overflow-hidden">
          <ChannelListView
            channels={channels}
            isLoading={isLoading}
            onSelect={handleSelectChannel}
            onBack={onBack}
            onCreate={() => setShowCreate(true)}
          />
        </div>

        {/* Content Area — 70% */}
        <div className="flex-1 h-full overflow-hidden bg-background/50">
          {renderRightPanel()}
        </div>
      </div>

      {/* Mobile: Single View Toggle */}
      <div className="md:hidden h-full w-full overflow-hidden">
        {isMobileListView ? (
          <ChannelListView
            channels={channels}
            isLoading={isLoading}
            onSelect={handleSelectChannel}
            onBack={onBack}
            onCreate={() => setShowCreate(true)}
          />
        ) : (
          renderRightPanel()
        )}
      </div>

      <CreateBroadcastDialog open={showCreate} onOpenChange={setShowCreate} onCreate={createChannel} />
    </>
  );
});

BroadcastChannelView.displayName = 'BroadcastChannelView';
export default BroadcastChannelView;

import { useState, memo, useRef } from 'react';
import {
  Settings, Users, ChevronRight, Crown,
  Camera, X, Loader2, BadgeCheck,
  MoreVertical, Image as ImageIcon,
  Link2, Check, BarChart3, UserPlus, Shield,
  Copy, UserX, Eye, Heart, MessageCircle,
  TrendingUp, Bell, BellOff,
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBroadcastAdmin } from '@/hooks/useBroadcastAdmin';
import type { BroadcastChannel } from '@/hooks/useBroadcastChannels';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// Analytics
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
      <div className="p-3 rounded-xl border border-border/40 bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">معدل التفاعل</span>
          <span className="text-sm font-bold text-primary">{analytics.engagementRate}%</span>
        </div>
        <Progress value={Math.min(analytics.engagementRate, 100)} className="h-2" />
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card">
        <span className="text-xs text-muted-foreground">متوسط المشاهدات لكل منشور</span>
        <span className="text-sm font-bold">{analytics.avgViewsPerPost.toLocaleString('ar-EG')}</span>
      </div>
      {analytics.topPosts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">أفضل المنشورات أداءً</h4>
          <div className="space-y-1.5">
            {analytics.topPosts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                <span className="flex-1 truncate text-muted-foreground">{format(new Date(p.created_at), 'dd MMM', { locale: ar })}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Eye className="w-3 h-3" /> {p.views_count || 0}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Heart className="w-3 h-3" /> {p.reactions_count || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
OwnerAnalytics.displayName = 'OwnerAnalytics';

// Settings
const OwnerSettings = memo(({ channel }: { channel: BroadcastChannel }) => {
  const { updateSettings, uploadChannelImage, generateInviteLink, isUpdating } = useBroadcastAdmin(channel.id);
  const [editName, setEditName] = useState(channel.name);
  const [editDesc, setEditDesc] = useState(channel.description || '');
  const [editRules, setEditRules] = useState((channel as any).rules || '');
  const [inviteLink, setInviteLink] = useState((channel as any).invite_link || '');
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings({ name: editName, description: editDesc, rules: editRules });
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
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-7 h-7 cursor-pointer ring-2 ring-border" onClick={() => avatarRef.current?.click()}>
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{channel.name.charAt(0)}</AvatarFallback>
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
      <div className="space-y-3 border-t border-border/30 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">السماح بالتعليقات</p>
            <p className="text-[10px] text-muted-foreground">يمكن للمتابعين التعليق على المنشورات</p>
          </div>
          <Switch checked={(channel as any).allow_comments !== false} onCheckedChange={v => updateSettings({ allow_comments: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">السماح بالتفاعلات</p>
            <p className="text-[10px] text-muted-foreground">يمكن للمتابعين التفاعل بالإيموجي</p>
          </div>
          <Switch checked={(channel as any).allow_reactions !== false} onCheckedChange={v => updateSettings({ allow_reactions: v })} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium">رؤية القناة</p>
          <p className="text-[10px] text-muted-foreground mb-2">تحديد من يمكنه رؤية القناة واكتشافها</p>
          <div className="space-y-2">
            {[
              { value: 'public', label: 'عامة', desc: 'يمكن للجميع اكتشافها ومتابعتها', icon: '🌍' },
              { value: 'internal', label: 'خاصة — جميع الجهات', desc: 'مرئية لجميع الجهات داخل المنصة فقط', icon: '🏢' },
              { value: 'partners_only', label: 'خاصة — الجهات المرتبطة', desc: 'مرئية فقط للجهات المرتبطة بكم', icon: '🤝' },
            ].map(opt => (
              <button key={opt.value} onClick={() => updateSettings({ channel_visibility: opt.value })}
                className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all",
                  ((channel as any).channel_visibility || 'public') === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 hover:bg-muted/50")}>
                <span className="text-lg">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
                {((channel as any).channel_visibility || 'public') === opt.value && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>
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

// Members
const OwnerMembers = memo(({ channelId }: { channelId: string }) => {
  const { admins, subscribers, subsLoading, addAdmin, removeAdmin, blockUser } = useBroadcastAdmin(channelId);
  const [searchQ, setSearchQ] = useState('');

  const filteredSubs = subscribers.filter((s: any) => !searchQ || (s.user_name || '').includes(searchQ));

  const roleLabel = (role: string) => {
    switch (role) { case 'owner': return 'مالك'; case 'admin': return 'مشرف'; case 'moderator': return 'مراقب'; default: return role; }
  };
  const roleColor = (role: string) => {
    switch (role) { case 'owner': return 'bg-amber-500/10 text-amber-700 border-amber-500/20'; case 'admin': return 'bg-blue-500/10 text-blue-700 border-blue-500/20'; case 'moderator': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'; default: return ''; }
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />إدارة الأعضاء</h3>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Crown className="w-3 h-3" /> المشرفون ({admins.length})</h4>
        <div className="space-y-1.5">
          {admins.map(admin => (
            <div key={admin.id} className="flex items-center gap-2 p-2 rounded-xl border border-border/30">
              <Avatar className="w-8 h-8">
                {admin.user_avatar && <AvatarImage src={admin.user_avatar} />}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(admin.user_name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{admin.user_name}</p></div>
              <Badge variant="outline" className={cn('text-[9px] h-4', roleColor(admin.role))}>{roleLabel(admin.role)}</Badge>
              {admin.role !== 'owner' && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAdmin(admin.id)}>
                  <X className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/30 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground">المتابعون ({subscribers.length})</h4>
        </div>
        <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="بحث في المتابعين..." className="text-xs h-8 mb-2" />
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
                    <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => addAdmin({ userId: sub.user_id, role: 'admin' })}><UserPlus className="w-3.5 h-3.5 ml-2" /> ترقية لمشرف</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addAdmin({ userId: sub.user_id, role: 'moderator' })}><Shield className="w-3.5 h-3.5 ml-2" /> ترقية لمراقب</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => blockUser({ userId: sub.user_id })} className="text-destructive"><UserX className="w-3.5 h-3.5 ml-2" /> حظر المتابع</DropdownMenuItem>
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

// Main Admin Panel
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
            <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> التحليلات</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Settings className="w-3.5 h-3.5" /> الإعدادات</TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1"><Users className="w-3.5 h-3.5" /> الأعضاء</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics"><OwnerAnalytics channelId={channel.id} /></TabsContent>
          <TabsContent value="settings"><OwnerSettings channel={channel} /></TabsContent>
          <TabsContent value="members"><OwnerMembers channelId={channel.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
OwnerAdminPanel.displayName = 'OwnerAdminPanel';

export default OwnerAdminPanel;

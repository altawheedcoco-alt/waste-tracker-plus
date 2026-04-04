import { useState, memo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Share2, Send, Users, Search,
  Loader2, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrivateChat } from '@/hooks/usePrivateChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface InternalSharePayload {
  title: string;
  preview: string;
  message: string;
  link?: string;
}

const ShareToChatDialog = memo(({ open, onOpenChange, payload }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: InternalSharePayload | null;
}) => {
  const { user } = useAuth();
  const { conversations, conversationsLoading, sendMessage, getOrCreateConversation } = usePrivateChat();
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'social' | 'internal'>('social');
  const [internalTab, setInternalTab] = useState<'conversations' | 'members'>('conversations');

  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['all-system-members-for-share'],
    queryFn: async () => {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .neq('user_id', user?.id || '');
      if (!profiles?.length) return [];
      const orgIds = [...new Set(profiles.map((p: any) => p.organization_id).filter(Boolean))];
      const { data: orgs } = await (supabase as any)
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      const orgMap = new Map((orgs || []).map((o: any) => [o.id, o.name]));
      return profiles.map((p: any) => ({
        ...p,
        organization_name: orgMap.get(p.organization_id) || '',
      }));
    },
    enabled: open && internalTab === 'members',
  });

  useEffect(() => {
    if (!open) { setSearch(''); setSendingId(null); setTab('social'); setInternalTab('conversations'); }
  }, [open]);

  const filteredConversations = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.partner?.full_name || '').toLowerCase().includes(q) || (c.partner?.organization_name || '').toLowerCase().includes(q);
  });

  const filteredMembers = allMembers.filter((m: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (m.full_name || '').toLowerCase().includes(q) || (m.organization_name || '').toLowerCase().includes(q);
  });

  const membersByOrg = filteredMembers.reduce((acc: Record<string, any[]>, m: any) => {
    const orgName = m.organization_name || 'بدون جهة';
    if (!acc[orgName]) acc[orgName] = [];
    acc[orgName].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const handleShareToConversation = async (conversationId: string) => {
    if (!payload) return;
    setSendingId(conversationId);
    try {
      await sendMessage(conversationId, payload.message);
      toast.success('تمت المشاركة داخل المحادثة');
      onOpenChange(false);
    } catch { toast.error('تعذر إرسال المشاركة'); }
    finally { setSendingId(null); }
  };

  const handleShareToMember = async (memberId: string) => {
    if (!payload) return;
    setSendingId(memberId);
    try {
      const convoId = await getOrCreateConversation(memberId);
      if (!convoId) throw new Error('Failed');
      await sendMessage(convoId, payload.message);
      toast.success('تمت المشاركة بنجاح');
      onOpenChange(false);
    } catch { toast.error('تعذر إرسال المشاركة'); }
    finally { setSendingId(null); }
  };

  const shareLink = payload?.link || '';
  const shareText = encodeURIComponent(payload?.message || '');
  const shareUrl = encodeURIComponent(shareLink);
  const shareTitle = encodeURIComponent(payload?.title || '');

  const socialPlatforms = [
    { name: 'واتساب', icon: '💬', url: `https://wa.me/?text=${shareText}` },
    { name: 'فيسبوك', icon: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareTitle}` },
    { name: 'تويتر / X', icon: '🐦', url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}` },
    { name: 'تيليجرام', icon: '✈️', url: `https://t.me/share/url?url=${shareUrl}&text=${shareText}` },
    { name: 'لينكدإن', icon: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { name: 'بريد إلكتروني', icon: '📧', url: `mailto:?subject=${shareTitle}&body=${shareText}` },
  ];

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => toast.success('تم نسخ الرابط')).catch(() => {
      const ta = document.createElement('textarea'); ta.value = shareLink; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('تم نسخ الرابط');
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: payload?.title, text: payload?.preview, url: shareLink }).catch(() => {});
    }
  };

  const renderMemberButton = (member: any) => {
    const isSending = sendingId === member.user_id;
    return (
      <button key={member.user_id} type="button" onClick={() => handleShareToMember(member.user_id)}
        disabled={!!sendingId}
        className="w-full flex items-center gap-3 rounded-xl border border-border/50 p-2.5 text-right hover:bg-muted/40 transition-colors disabled:opacity-60">
        <Avatar className="w-8 h-8 shrink-0">
          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{(member.full_name || '?').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{member.full_name}</p>
        </div>
        {isSending ? <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" /> : <Send className="w-4 h-4 text-primary shrink-0" />}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4 text-primary" />
            مشاركة المنشور
          </DialogTitle>
        </DialogHeader>

        {payload && (
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 mb-2">
            <p className="text-sm font-semibold line-clamp-1">{payload.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">{payload.preview}</p>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'social' | 'internal')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="social" className="text-xs">مواقع التواصل</TabsTrigger>
            <TabsTrigger value="internal" className="text-xs">مشاركة داخلية</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {socialPlatforms.map((p) => (
                <button key={p.name} onClick={() => window.open(p.url, '_blank', 'noopener,noreferrer')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs" onClick={handleCopyLink}>
                <Copy className="w-3.5 h-3.5" /> نسخ الرابط
              </Button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs" onClick={handleNativeShare}>
                  <Share2 className="w-3.5 h-3.5" /> مشاركة أخرى
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="internal" className="space-y-3">
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              <button onClick={() => setInternalTab('conversations')}
                className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                  internalTab === 'conversations' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                محادثات حالية
              </button>
              <button onClick={() => setInternalTab('members')}
                className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
                  internalTab === 'members' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                أعضاء الجهات
              </button>
            </div>

            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={internalTab === 'conversations' ? 'ابحث عن محادثة...' : 'ابحث عن عضو أو جهة...'}
              className="text-sm" />

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {internalTab === 'conversations' ? (
                conversationsLoading ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => {
                    const partnerName = conversation.partner?.full_name || 'محادثة';
                    const orgName = conversation.partner?.organization_name || '';
                    const isSending = sendingId === conversation.id;
                    return (
                      <button key={conversation.id} type="button" onClick={() => handleShareToConversation(conversation.id)}
                        disabled={!!sendingId}
                        className="w-full flex items-center gap-3 rounded-xl border border-border/50 p-2.5 text-right hover:bg-muted/40 transition-colors disabled:opacity-60">
                        <Avatar className="w-9 h-9 shrink-0">
                          {conversation.partner?.avatar_url && <AvatarImage src={conversation.partner.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{partnerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{partnerName}</p>
                          {orgName && <p className="text-[11px] text-muted-foreground truncate">{orgName}</p>}
                        </div>
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" /> : <Send className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-5 text-center">
                    <p className="text-sm font-medium">لا توجد محادثات متاحة</p>
                  </div>
                )
              ) : (
                membersLoading ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : Object.keys(membersByOrg).length > 0 ? (
                  Object.entries(membersByOrg).map(([orgName, members]) => (
                    <div key={orgName} className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground px-1 py-1 sticky top-0 bg-background/95 backdrop-blur-sm flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {orgName}
                      </p>
                      {(members as any[]).map(renderMemberButton)}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-5 text-center">
                    <p className="text-sm font-medium">لا يوجد أعضاء</p>
                  </div>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
ShareToChatDialog.displayName = 'ShareToChatDialog';

export default ShareToChatDialog;

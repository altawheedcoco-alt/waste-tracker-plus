import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, Shield, Lock, Building2, Users, Plus, X,
  ChevronDown, ChevronRight, MessageCircle, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import ConversationItem from '@/components/chat/ConversationItem';
import OrgGroupHeader, { type OrgGroup } from '@/components/chat/OrgGroupHeader';
import type { PrivateConversation } from '@/hooks/usePrivateChat';

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

interface ChatSidebarPanelProps {
  conversations: PrivateConversation[];
  conversationsLoading: boolean;
  linkedPartners: LinkedPartnerOrg[];
  partnersLoading: boolean;
  selectedConvoId: string | null;
  currentUserId: string | undefined;
  isMobile: boolean;
  orgGroups: OrgGroup[];
  expandedOrgs: Set<string>;
  onToggleOrgExpand: (orgId: string) => void;
  onSelectConvo: (convo: PrivateConversation) => void;
  onStartConvoWithMember: (member: PartnerMember) => void;
  totalUnread: number;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص',
};

const ChatSidebarPanel = memo(({
  conversations, conversationsLoading, linkedPartners, partnersLoading,
  selectedConvoId, currentUserId, isMobile, orgGroups, expandedOrgs,
  onToggleOrgExpand, onSelectConvo, onStartConvoWithMember, totalUnread,
}: ChatSidebarPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'orgs' | 'partners'>('orgs');
  const [expandedPartnerOrgs, setExpandedPartnerOrgs] = useState<Set<string>>(new Set());

  const togglePartnerOrgExpand = (orgId: string) => {
    setExpandedPartnerOrgs(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId); else next.add(orgId);
      return next;
    });
  };

  const filteredConversations = useMemo(() => conversations.filter(c =>
    !searchQuery || c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partner?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [conversations, searchQuery]);

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

  return (
    <motion.div
      initial={isMobile ? { x: 100, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      exit={isMobile ? { x: 100, opacity: 0 } : undefined}
      transition={{ type: 'spring', damping: 25 }}
      className={cn("h-full flex flex-col bg-card border-l border-border", isMobile ? "w-full" : "w-[300px] min-w-[300px]")}
    >
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm">مركز التواصل</h2>
              <p className="text-[10px] text-primary flex items-center gap-1">
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

        <div className="relative mb-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو الجهة..." className="pr-9 h-9 text-sm bg-muted/50 border-none" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <div className="flex rounded-lg bg-muted/50 p-0.5">
          {[
            { key: 'orgs' as const, icon: Building2, label: 'حسب الجهة' },
            { key: 'all' as const, icon: Users, label: 'الكل' },
            { key: 'partners' as const, icon: Plus, label: 'الجهات' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setSidebarTab(tab.key)}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors",
                sidebarTab === tab.key ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"
              )}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : sidebarTab === 'orgs' ? (
          filteredOrgGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">لا توجد محادثات</p>
            </div>
          ) : (
            filteredOrgGroups.map(group => (
              <div key={group.orgId}>
                <OrgGroupHeader group={group} isExpanded={expandedOrgs.has(group.orgId)} onToggle={() => onToggleOrgExpand(group.orgId)} />
                <AnimatePresence>
                  {expandedOrgs.has(group.orgId) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      {group.conversations.map(convo => (
                        <ConversationItem key={convo.id} conversation={convo} isActive={selectedConvoId === convo.id} onClick={() => onSelectConvo(convo)} currentUserId={currentUserId} compact />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )
        ) : sidebarTab === 'partners' ? (
          partnersLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
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
                const orgTypeLabel = ORG_TYPE_LABELS[partner.organization_type] || partner.organization_type;
                const isExpanded = expandedPartnerOrgs.has(partner.id);
                return (
                  <div key={partner.id}>
                    <button onClick={() => togglePartnerOrgExpand(partner.id)} className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors text-start">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <Avatar className="w-7 h-7">
                        {partner.logo_url && <AvatarImage src={partner.logo_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]"><Building2 className="w-3.5 h-3.5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold truncate block">{partner.name}</span>
                        <span className="text-[10px] text-muted-foreground">{orgTypeLabel}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">{partner.members.length} عضو</Badge>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          {partner.members.length === 0 ? (
                            <div className="px-4 py-3 text-center text-xs text-muted-foreground">لا يوجد أعضاء مسجلين</div>
                          ) : (
                            partner.members.map(member => {
                              const hasConvo = conversations.some(c => c.partner?.user_id === member.user_id);
                              return (
                                <button key={member.user_id} onClick={() => onStartConvoWithMember(member)}
                                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-border/20", "hover:bg-muted/50 active:bg-muted/80")}>
                                  <Avatar className="w-9 h-9">
                                    {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{member.full_name?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0 text-right">
                                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{hasConvo ? '💬 محادثة قائمة' : '➕ بدء محادثة جديدة'}</p>
                                  </div>
                                  {!hasConvo && <MessageCircle className="w-4 h-4 text-primary/50 shrink-0" />}
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
              <ConversationItem key={convo.id} conversation={convo} isActive={selectedConvoId === convo.id} onClick={() => onSelectConvo(convo)} currentUserId={currentUserId} />
            ))
          )
        )}
      </ScrollArea>
    </motion.div>
  );
});

ChatSidebarPanel.displayName = 'ChatSidebarPanel';
export default ChatSidebarPanel;
export type { PartnerMember, LinkedPartnerOrg };
